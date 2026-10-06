import { EngineError } from '@feelyourprotocol/mcp-execution-engine'

import type { SimulationTask } from './TaskProcessor.js'

export type WorkerRequest = { type: 'run'; id: number; task: SimulationTask }

export type SerializedError = { name: string; message: string; code?: string }

export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'result'; id: number; ok: true; result: unknown }
  | { type: 'result'; id: number; ok: false; error: SerializedError }

export function serializeError(error: unknown): SerializedError {
  if (error instanceof EngineError) {
    return { name: 'EngineError', message: error.message, code: error.code }
  }
  if (error instanceof Error) {
    return { name: error.name, message: error.message }
  }
  return { name: 'Error', message: 'Unknown error' }
}

/** Rebuilds an EngineError so `toMcpToolError` still appends the `(code)` suffix. */
export function deserializeError(error: SerializedError): Error {
  if (error.name === 'EngineError' && typeof error.code === 'string') {
    return new EngineError(error.message, error.code)
  }
  return new Error(error.message)
}
