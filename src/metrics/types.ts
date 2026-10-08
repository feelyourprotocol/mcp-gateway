export type MetricsOutcome = 'ok' | 'error'

export type MetricsSettlement = 'unpaid' | 'paid' | 'quoted'

export type SessionOpenEvent = {
  kind: 'session_open'
  ts: number
  actorKey: string
  clientName: string
  clientVersion: string
}

export type ToolCallEvent = {
  kind: 'tool_call'
  ts: number
  actorKey: string
  clientName: string
  clientVersion: string
  tool: string
  outcome: MetricsOutcome
  durationMs: number
  settlement: MetricsSettlement
  amountMicroUsdc: number | null
  asset: string | null
  forkId: string | null
  eipsJson: string | null
  /** Sanitized ToolErrorDiagnostic JSON when outcome is error. */
  errorJson?: string | null
}

export type MetricsEvent = SessionOpenEvent | ToolCallEvent

export type RequestMetricsContext = {
  actorKey: string
  clientName: string
  clientVersion: string
  settlement: MetricsSettlement
  amountMicroUsdc: number | null
  asset: string | null
}
