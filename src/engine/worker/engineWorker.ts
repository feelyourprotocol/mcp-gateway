import { parentPort } from 'node:worker_threads'

import { runSimulationTask } from '../runSimulationTask.js'
import type { WorkerRequest, WorkerResponse } from '../workerProtocol.js'
import { serializeError } from '../workerProtocol.js'

const port = parentPort
if (!port) {
  throw new Error('engineWorker must run inside a worker thread')
}

function reply(message: WorkerResponse): void {
  port?.postMessage(message)
}

port.on('message', (request: WorkerRequest) => {
  if (request.type !== 'run') {
    return
  }
  runSimulationTask(request.task).then(
    (result) => reply({ type: 'result', id: request.id, ok: true, result }),
    (error: unknown) =>
      reply({ type: 'result', id: request.id, ok: false, error: serializeError(error) }),
  )
})

// The engine import above is the cold start. Announce only once it has finished.
reply({ type: 'ready' })
