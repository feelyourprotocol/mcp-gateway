import { availableParallelism } from 'node:os'
import { Worker } from 'node:worker_threads'
import { EngineError } from '@feelyourprotocol/mcp-execution-engine'

import { runSimulationTask } from './runSimulationTask.js'
import type { SimulationTask, SubmitOptions, TaskProcessor } from './TaskProcessor.js'
import type { WorkerRequest, WorkerResponse } from './workerProtocol.js'
import { deserializeError } from './workerProtocol.js'

/** Wall clock for one engine call. On expiry the worker is terminated. */
export const WORKER_TASK_TIMEOUT_MS = 15_000
/** Calls that may wait behind the running ones. One more is refused. */
export const WORKER_QUEUE_DEPTH = 4
/** Heap cap per worker. A runaway call dies alone instead of taking the process. */
export const WORKER_HEAP_LIMIT_MB = 256

const RESPAWN_DELAY_AFTER_EARLY_FAILURE_MS = 1_000

export type WorkerPoolOptions = {
  /** Defaults to one worker per core. */
  size?: number
  maxQueue?: number
  taskTimeoutMs?: number
  /** Tests pass a fixture worker here. Production uses the compiled engine worker. */
  createWorker?: () => Worker
}

type Job = {
  id: number
  task: SimulationTask
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
  signal?: AbortSignal
  onAbort?: () => void
  timer?: NodeJS.Timeout
}

type Slot = {
  worker: Worker
  ready: boolean
  retired: boolean
  job?: Job
}

function defaultCreateWorker(): Worker {
  return new Worker(new URL('./worker/engineWorker.js', import.meta.url), {
    resourceLimits: { maxOldGenerationSizeMb: WORKER_HEAP_LIMIT_MB },
  })
}

export class WorkerPool implements TaskProcessor {
  private readonly size: number
  private readonly maxQueue: number
  private readonly taskTimeoutMs: number
  private readonly createWorker: () => Worker

  private slots: Slot[] = []
  private queue: Job[] = []
  private nextJobId = 1
  private closed = false
  private readyWaiters: (() => void)[] = []

  constructor(options: WorkerPoolOptions = {}) {
    this.size = Math.max(1, options.size ?? availableParallelism())
    this.maxQueue = options.maxQueue ?? WORKER_QUEUE_DEPTH
    this.taskTimeoutMs = options.taskTimeoutMs ?? WORKER_TASK_TIMEOUT_MS
    this.createWorker = options.createWorker ?? defaultCreateWorker
    for (let index = 0; index < this.size; index += 1) {
      this.slots.push(this.spawn(index))
    }
  }

  /** Resolves once every worker has finished its cold start. */
  start(): Promise<void> {
    return new Promise((resolve) => {
      const check = (): void => {
        if (this.slots.every((slot) => slot.ready)) {
          resolve()
        } else {
          this.readyWaiters.push(check)
        }
      }
      check()
    })
  }

  submit(task: SimulationTask, options: SubmitOptions = {}): Promise<unknown> {
    // The capability catalog is a cheap read. A heavy run must not delay it.
    if (task.kind === 'probe') {
      return runSimulationTask(task)
    }
    if (this.closed) {
      return Promise.reject(new EngineError('Server is shutting down', 'server_shutdown'))
    }
    const { signal } = options
    if (signal?.aborted) {
      return Promise.reject(new EngineError('Request cancelled', 'request_cancelled'))
    }

    return new Promise<unknown>((resolve, reject) => {
      const job: Job = { id: this.nextJobId, task, resolve, reject, signal }
      this.nextJobId += 1

      if (signal) {
        job.onAbort = () => this.cancel(job)
        signal.addEventListener('abort', job.onAbort, { once: true })
      }

      const idle = this.slots.find((slot) => slot.ready && !slot.job)
      if (idle) {
        this.dispatch(idle, job)
      } else if (this.queue.length >= this.maxQueue) {
        this.settle(job, (j) =>
          j.reject(new EngineError('Server busy, retry shortly', 'server_busy')),
        )
      } else {
        this.queue.push(job)
      }
    })
  }

  async close(): Promise<void> {
    if (this.closed) {
      return
    }
    this.closed = true
    const shutdown = new EngineError('Server is shutting down', 'server_shutdown')
    for (const job of this.queue.splice(0)) {
      this.settle(job, (j) => j.reject(shutdown))
    }
    const terminations: Promise<number>[] = []
    for (const slot of this.slots) {
      if (slot.job) {
        const { job } = slot
        slot.job = undefined
        this.settle(job, (j) => j.reject(shutdown))
      }
      slot.retired = true
      terminations.push(slot.worker.terminate())
    }
    await Promise.all(terminations)
  }

  private spawn(index: number): Slot {
    const worker = this.createWorker()
    const slot: Slot = { worker, ready: false, retired: false }

    worker.on('message', (message: WorkerResponse) => this.onMessage(slot, message))
    worker.on('error', (error) => this.onWorkerFailure(index, slot, error))
    worker.on('exit', (code) => {
      if (!slot.retired) {
        this.onWorkerFailure(index, slot, new Error(`Engine worker exited with code ${code}`))
      }
    })
    return slot
  }

  private onMessage(slot: Slot, message: WorkerResponse): void {
    if (slot.retired) {
      return
    }
    if (message.type === 'ready') {
      slot.ready = true
      this.drain()
      this.notifyReady()
      return
    }

    const { job } = slot
    if (!job || job.id !== message.id) {
      return
    }
    slot.job = undefined
    this.settle(job, (j) =>
      message.ok ? j.resolve(message.result) : j.reject(deserializeError(message.error)),
    )
    this.drain()
  }

  private onWorkerFailure(index: number, slot: Slot, error: Error): void {
    if (slot.retired) {
      return
    }
    console.error('[fyp-mcp] engine worker failed:', error.message)
    const { job } = slot
    const wasReady = slot.ready
    slot.job = undefined
    if (job) {
      this.settle(job, (j) =>
        j.reject(new EngineError('Engine worker failed while running this call', 'worker_failed')),
      )
    }
    this.replace(index, slot, wasReady ? 0 : RESPAWN_DELAY_AFTER_EARLY_FAILURE_MS)
  }

  private dispatch(slot: Slot, job: Job): void {
    slot.job = job
    job.timer = setTimeout(() => this.expire(slot, job), this.taskTimeoutMs)
    const request: WorkerRequest = { type: 'run', id: job.id, task: job.task }
    try {
      slot.worker.postMessage(request)
    } catch (error) {
      slot.job = undefined
      this.settle(job, (j) => j.reject(error))
      this.drain()
    }
  }

  private expire(slot: Slot, job: Job): void {
    if (slot.job !== job) {
      return
    }
    slot.job = undefined
    const seconds = Math.round(this.taskTimeoutMs / 1000)
    this.settle(job, (j) =>
      j.reject(
        new EngineError(`Execution exceeded the ${seconds}s time limit`, 'execution_timeout'),
      ),
    )
    this.replace(this.slots.indexOf(slot), slot, 0)
  }

  private cancel(job: Job): void {
    const cancelled = new EngineError('Request cancelled', 'request_cancelled')
    const queuedAt = this.queue.indexOf(job)
    if (queuedAt >= 0) {
      this.queue.splice(queuedAt, 1)
      this.settle(job, (j) => j.reject(cancelled))
      return
    }
    const slot = this.slots.find((candidate) => candidate.job === job)
    if (slot) {
      slot.job = undefined
      this.settle(job, (j) => j.reject(cancelled))
      this.replace(this.slots.indexOf(slot), slot, 0)
    }
  }

  /** Stops the old worker for good and starts a fresh one in the same position. */
  private replace(index: number, slot: Slot, delayMs: number): void {
    slot.retired = true
    slot.ready = false
    void slot.worker.terminate()
    if (this.closed || index < 0) {
      return
    }

    const start = (): void => {
      if (this.closed) {
        return
      }
      this.slots[index] = this.spawn(index)
    }
    if (delayMs > 0) {
      // Keep a placeholder so the slot count stays stable while we wait.
      this.slots[index] = { worker: slot.worker, ready: false, retired: true }
      const timer = setTimeout(start, delayMs)
      timer.unref()
    } else {
      start()
    }
  }

  private drain(): void {
    while (this.queue.length > 0) {
      const idle = this.slots.find((slot) => slot.ready && !slot.retired && !slot.job)
      const next = this.queue[0]
      if (!idle || !next) {
        return
      }
      this.queue.shift()
      this.dispatch(idle, next)
    }
  }

  private notifyReady(): void {
    const waiters = this.readyWaiters.splice(0)
    for (const waiter of waiters) {
      waiter()
    }
  }

  private settle(job: Job, finish: (job: Job) => void): void {
    if (job.timer) {
      clearTimeout(job.timer)
      job.timer = undefined
    }
    if (job.signal && job.onAbort) {
      job.signal.removeEventListener('abort', job.onAbort)
      job.onAbort = undefined
    }
    finish(job)
  }
}
