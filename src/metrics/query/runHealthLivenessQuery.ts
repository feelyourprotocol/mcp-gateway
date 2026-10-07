import type { DatabaseSync } from 'node:sqlite'

import type { CardDefinition, CardQueryResult, MetricsGrain, MetricsWindow } from './types.js'
import { bucketStartUtc, grainStepMs, windowToMs } from './window.js'

type HealthRow = {
  ts: number
  ok: number
}

type Cell = { count: number }

function emptyCell(): Cell {
  return { count: 0 }
}

export function getLatestHealthSample(db: DatabaseSync): {
  ts: number
  ok: boolean
  durationMs: number
  statusCode: number | null
} | null {
  const row = db
    .prepare(`SELECT ts, ok, duration_ms, status_code FROM health_samples ORDER BY ts DESC LIMIT 1`)
    .get() as
    | { ts: number; ok: number; duration_ms: number; status_code: number | null }
    | undefined
  if (!row) {
    return null
  }
  return {
    ts: row.ts,
    ok: row.ok === 1,
    durationMs: row.duration_ms,
    statusCode: row.status_code,
  }
}

export function runHealthLivenessQuery(
  db: DatabaseSync,
  card: CardDefinition,
  window: MetricsWindow,
  grain: MetricsGrain,
  nowMs: number = Date.now(),
): CardQueryResult {
  const windowMs = windowToMs(window)
  const fromTs = nowMs - windowMs
  const toTs = nowMs

  const rows = db
    .prepare(`SELECT ts, ok FROM health_samples WHERE ts >= ? AND ts < ? ORDER BY ts`)
    .all(fromTs, toTs) as HealthRow[]

  const buckets = new Map<number, Map<string, Cell>>()

  for (const row of rows) {
    const bucket = bucketStartUtc(row.ts, grain)
    const series = row.ok === 1 ? 'up' : 'down'
    if (!buckets.has(bucket)) {
      buckets.set(bucket, new Map())
    }
    const seriesMap = buckets.get(bucket)!
    const cell = seriesMap.get(series) ?? emptyCell()
    cell.count += 1
    seriesMap.set(series, cell)
  }

  const seriesOut: CardQueryResult['series'] = []
  const step = grainStepMs(grain)

  for (let t = bucketStartUtc(fromTs, grain); t < toTs; t += step) {
    const seriesMap = buckets.get(t) ?? new Map<string, Cell>()
    for (const series of ['up', 'down'] as const) {
      const cell = seriesMap.get(series) ?? emptyCell()
      seriesOut.push({ bucketStart: t, series, value: cell.count })
    }
  }

  const upCount = rows.filter((row) => row.ok === 1).length
  const summary = rows.length === 0 ? 0 : Math.round((upCount / rows.length) * 1000) / 10

  return {
    cardId: card.id,
    window,
    grain,
    series: seriesOut,
    summary,
    isEmpty: rows.length === 0,
  }
}
