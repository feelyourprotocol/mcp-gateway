import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'
import { afterEach, describe, expect, it } from 'vitest'
import { EngineError } from '@feelyourprotocol/mcp-execution-engine'

import { LocalTaskProcessor } from '../engine/LocalTaskProcessor.js'
import type { SimulationTask } from '../engine/TaskProcessor.js'
import { WorkerPool } from '../engine/WorkerPool.js'

const gatewayRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const engineWorkerPath = path.join(gatewayRoot, 'dist/engine/worker/engineWorker.js')

// Fixture worker speaking the pool protocol. `spin` never returns, `crash` ends the thread.
const FIXTURE_WORKER = `
const { parentPort } = require('node:worker_threads')
parentPort.on('message', (message) => {
  const bytecode = message.task.payload && message.task.payload.bytecode
  if (bytecode === 'spin') {
    for (;;) {}
  }
  if (bytecode === 'crash') {
    process.exit(3)
  }
  parentPort.postMessage({ type: 'result', id: message.id, ok: true, result: { echo: bytecode } })
})
parentPort.postMessage({ type: 'ready' })
`

const fixtureWorker = (): Worker => new Worker(FIXTURE_WORKER, { eval: true })
const engineWorker = (): Worker => new Worker(engineWorkerPath)

function simulate(bytecode: string, extra: Record<string, unknown> = {}): SimulationTask {
  return { kind: 'simulate', payload: { bytecode, ...extra } } as SimulationTask
}

function codeOf(error: unknown): string | undefined {
  return error instanceof EngineError ? error.code : undefined
}

describe('WorkerPool', () => {
  const pools: WorkerPool[] = []

  async function startPool(
    options: ConstructorParameters<typeof WorkerPool>[0],
  ): Promise<WorkerPool> {
    const pool = new WorkerPool(options)
    pools.push(pool)
    await pool.start()
    return pool
  }

  afterEach(async () => {
    await Promise.all(pools.splice(0).map((pool) => pool.close()))
  })

  describe('with the compiled engine worker', () => {
    it('matches the in-process result for a short simulation', async () => {
      const pool = await startPool({ size: 1, createWorker: engineWorker })
      const task = simulate('0x6001600101')

      const viaWorker = (await pool.submit(task)) as { success: boolean; gasUsed: string }
      const local = (await new LocalTaskProcessor().submit(task)) as typeof viaWorker

      expect(viaWorker.success).toBe(true)
      expect(viaWorker.gasUsed).toBe(local.gasUsed)
    })

    it('keeps the EngineError code across the thread boundary', async () => {
      const pool = await startPool({ size: 1, createWorker: engineWorker })

      const failure = await pool.submit(simulate('0x00', { gasLimit: '31000000' })).catch((e) => e)

      expect(failure).toBeInstanceOf(EngineError)
      expect(codeOf(failure)).toBe('gas_limit_too_high')
    })

    it('stays usable after rejected calls', async () => {
      const pool = await startPool({ size: 1, createWorker: engineWorker })

      await pool.submit(simulate('zzzz')).catch(() => undefined)
      const ok = (await pool.submit(simulate('0x00'))) as { success: boolean }

      expect(ok.success).toBe(true)
    })
  })

  describe('with a fixture worker', () => {
    it('terminates a call that exceeds the wall clock and keeps serving', async () => {
      const pool = await startPool({ size: 1, taskTimeoutMs: 200, createWorker: fixtureWorker })

      const failure = await pool.submit(simulate('spin')).catch((e) => e)
      expect(codeOf(failure)).toBe('execution_timeout')

      const next = await pool.submit(simulate('0xaa'))
      expect(next).toEqual({ echo: '0xaa' })
    })

    it('keeps the main thread responsive while a worker spins', async () => {
      const pool = await startPool({ size: 1, taskTimeoutMs: 400, createWorker: fixtureWorker })

      let ticks = 0
      const interval = setInterval(() => {
        ticks += 1
      }, 20)
      const spinning = pool.submit(simulate('spin')).catch((e) => e)
      await new Promise((resolve) => setTimeout(resolve, 250))
      clearInterval(interval)

      expect(ticks).toBeGreaterThanOrEqual(5)
      expect(codeOf(await spinning)).toBe('execution_timeout')
    })

    it('answers probe on the main thread while every worker is busy', async () => {
      const pool = await startPool({ size: 1, taskTimeoutMs: 5_000, createWorker: fixtureWorker })
      const spinning = pool.submit(simulate('spin')).catch((e) => e)

      const probe = (await pool.submit({ kind: 'probe' })) as { engineVersion: string }

      expect(probe.engineVersion).toBeTruthy()
      await pool.close()
      expect(codeOf(await spinning)).toBe('server_shutdown')
    })

    it('runs a second call beside a spinning one when the pool has two workers', async () => {
      const pool = await startPool({ size: 2, taskTimeoutMs: 5_000, createWorker: fixtureWorker })
      const spinning = pool.submit(simulate('spin')).catch((e) => e)

      const beside = await pool.submit(simulate('0xbb'))

      expect(beside).toEqual({ echo: '0xbb' })
      await pool.close()
      expect(codeOf(await spinning)).toBe('server_shutdown')
    })

    it('refuses calls past the queue with server_busy', async () => {
      const pool = await startPool({
        size: 1,
        maxQueue: 1,
        taskTimeoutMs: 5_000,
        createWorker: fixtureWorker,
      })
      const running = pool.submit(simulate('spin')).catch((e) => e)
      const waiting = pool.submit(simulate('0xcc')).catch((e) => e)

      const refused = await pool.submit(simulate('0xdd')).catch((e) => e)

      expect(codeOf(refused)).toBe('server_busy')
      await pool.close()
      expect(codeOf(await running)).toBe('server_shutdown')
      expect(codeOf(await waiting)).toBe('server_shutdown')
    })

    it('runs a queued call once the running one finishes', async () => {
      const pool = await startPool({ size: 1, taskTimeoutMs: 200, createWorker: fixtureWorker })
      const first = pool.submit(simulate('spin')).catch((e) => e)
      const queued = pool.submit(simulate('0xee'))

      expect(codeOf(await first)).toBe('execution_timeout')
      expect(await queued).toEqual({ echo: '0xee' })
    })

    it('drops a queued call when its caller goes away', async () => {
      const pool = await startPool({ size: 1, taskTimeoutMs: 5_000, createWorker: fixtureWorker })
      const running = pool.submit(simulate('spin')).catch((e) => e)
      const controller = new AbortController()
      const queued = pool.submit(simulate('0x11'), { signal: controller.signal }).catch((e) => e)

      controller.abort()

      expect(codeOf(await queued)).toBe('request_cancelled')
      await pool.close()
      expect(codeOf(await running)).toBe('server_shutdown')
    })

    it('stops a running call when its caller goes away and serves the next one', async () => {
      const pool = await startPool({ size: 1, taskTimeoutMs: 5_000, createWorker: fixtureWorker })
      const controller = new AbortController()
      const running = pool.submit(simulate('spin'), { signal: controller.signal }).catch((e) => e)
      await new Promise((resolve) => setTimeout(resolve, 50))

      controller.abort()

      expect(codeOf(await running)).toBe('request_cancelled')
      expect(await pool.submit(simulate('0x22'))).toEqual({ echo: '0x22' })
    })

    it('rejects an already aborted request without taking a worker', async () => {
      const pool = await startPool({ size: 1, createWorker: fixtureWorker })
      const controller = new AbortController()
      controller.abort()

      const failure = await pool
        .submit(simulate('0x33'), { signal: controller.signal })
        .catch((e) => e)

      expect(codeOf(failure)).toBe('request_cancelled')
    })

    it('reports worker_failed when a worker dies mid call and recovers', async () => {
      const pool = await startPool({ size: 1, taskTimeoutMs: 5_000, createWorker: fixtureWorker })

      const failure = await pool.submit(simulate('crash')).catch((e) => e)
      expect(codeOf(failure)).toBe('worker_failed')

      expect(await pool.submit(simulate('0x44'))).toEqual({ echo: '0x44' })
    })

    it('refuses new calls after close', async () => {
      const pool = await startPool({ size: 1, createWorker: fixtureWorker })
      await pool.close()

      const failure = await pool.submit(simulate('0x55')).catch((e) => e)

      expect(codeOf(failure)).toBe('server_shutdown')
    })
  })
})
