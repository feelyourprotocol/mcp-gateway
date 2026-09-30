import type { RequestMetricsContext } from './types.js'

const sessions = new Map<string, RequestMetricsContext>()

export function setSessionMetricsContext(sessionId: string, context: RequestMetricsContext): void {
  sessions.set(sessionId, context)
}

export function getSessionMetricsContext(sessionId: string): RequestMetricsContext | undefined {
  return sessions.get(sessionId)
}

export function deleteSessionMetricsContext(sessionId: string): void {
  sessions.delete(sessionId)
}

/** Test hook */
export function clearSessionMetricsRegistry(): void {
  sessions.clear()
}
