import type { MetricsWindow } from '@/types/metrics'

export type ToolErrorDiagnostic = {
  code: string
  field?: string
  message: string
  facts?: Record<string, string | number | boolean>
}

export type ErrorEventRow = {
  id: number
  ts: number
  tool: string
  forkId: string | null
  eips: number[]
  diagnostic: ToolErrorDiagnostic | null
}

export type ErrorsQueryResult = {
  window: MetricsWindow
  errors: ErrorEventRow[]
  totalInWindow: number
  limit: number
  truncated: boolean
}
