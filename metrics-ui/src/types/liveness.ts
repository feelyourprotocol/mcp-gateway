export type LivenessState = 'up' | 'degraded' | 'down'

export type LivenessStatus = {
  state: LivenessState
  lastCheckTs: number | null
  lastOk: boolean | null
  lastDurationMs: number | null
  pollIntervalMs: number
  message: string
}
