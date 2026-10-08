import type { DatabaseSync } from 'node:sqlite'

import type { ToolErrorDiagnostic } from '../errorDiagnostic.js'
import type { MetricsWindow } from './types.js'
import { windowToMs } from './window.js'

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

function parseEips(json: string | null): number[] {
  if (!json) {
    return []
  }
  try {
    const parsed: unknown = JSON.parse(json)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0)
  } catch {
    return []
  }
}

function parseDiagnostic(json: string | null): ToolErrorDiagnostic | null {
  if (!json) {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(json)
    if (parsed === null || typeof parsed !== 'object') {
      return null
    }
    const record = parsed as Record<string, unknown>
    if (typeof record.code !== 'string' || typeof record.message !== 'string') {
      return null
    }
    const diagnostic: ToolErrorDiagnostic = {
      code: record.code,
      message: record.message,
    }
    if (typeof record.field === 'string') {
      diagnostic.field = record.field
    }
    if (record.facts !== undefined && typeof record.facts === 'object' && record.facts !== null) {
      diagnostic.facts = record.facts as Record<string, string | number | boolean>
    }
    return diagnostic
  } catch {
    return null
  }
}

export function runErrorsQuery(
  db: DatabaseSync,
  window: MetricsWindow,
  nowMs: number = Date.now(),
  limit = 100,
): ErrorsQueryResult {
  const start = nowMs - windowToMs(window)
  const countRow = db
    .prepare(
      `SELECT COUNT(*) AS c FROM events
       WHERE kind = 'tool_call' AND outcome = 'error' AND ts >= ? AND ts < ?`,
    )
    .get(start, nowMs) as { c: number }

  const rows = db
    .prepare(
      `SELECT id, ts, tool, fork_id, eips_json, error_json
       FROM events
       WHERE kind = 'tool_call' AND outcome = 'error' AND ts >= ? AND ts < ?
       ORDER BY ts DESC
       LIMIT ?`,
    )
    .all(start, nowMs, limit) as {
    id: number
    ts: number
    tool: string | null
    fork_id: string | null
    eips_json: string | null
    error_json: string | null
  }[]

  const totalInWindow = countRow.c
  return {
    window,
    limit,
    totalInWindow,
    truncated: totalInWindow > rows.length,
    errors: rows.map((row) => ({
      id: row.id,
      ts: row.ts,
      tool: row.tool ?? 'unknown',
      forkId: row.fork_id,
      eips: parseEips(row.eips_json),
      diagnostic: parseDiagnostic(row.error_json),
    })),
  }
}
