import type { DatabaseSync } from 'node:sqlite'

import type { CardDefinition, CardQueryResult, MetricsGrain, MetricsWindow } from './types.js'
import { bucketStartUtc, grainStepMs, windowToMs } from './window.js'

type RawEventRow = {
  ts: number
  kind: string
  actor_key: string | null
  tool: string | null
  outcome: string | null
  settlement: string | null
  amount_micro_usdc: number | null
  display_tool: string | null
}

type Cell = { count: number; actors: Set<string>; sum: number }

function emptyCell(): Cell {
  return { count: 0, actors: new Set(), sum: 0 }
}

function resolveSeriesName(row: RawEventRow, split: CardDefinition['split']): string {
  if (split === 'tool') {
    return row.display_tool ?? row.tool ?? 'unknown'
  }
  if (split === 'settlement') {
    return row.settlement ?? 'unknown'
  }
  if (split === 'outcome') {
    return row.outcome ?? 'unknown'
  }
  return 'total'
}

function buildWhereClause(filter: CardDefinition['filter']): { sql: string; params: string[] } {
  const clauses: string[] = ['e.ts >= ?', 'e.ts < ?']
  const params: string[] = []
  if (filter?.kind) {
    clauses.push('e.kind = ?')
    params.push(filter.kind)
  }
  if (filter?.settlement) {
    clauses.push('e.settlement = ?')
    params.push(filter.settlement)
  }
  if (filter?.outcome) {
    clauses.push('e.outcome = ?')
    params.push(filter.outcome)
  }
  return { sql: clauses.join(' AND '), params }
}

function applyMeasure(cell: Cell, measure: CardDefinition['measure'], row: RawEventRow): void {
  if (measure === 'count') {
    cell.count += 1
  } else if (measure === 'count_distinct_actor' && row.actor_key) {
    cell.actors.add(row.actor_key)
  } else if (measure === 'sum_micro_usdc') {
    cell.sum += row.amount_micro_usdc ?? 0
  }
}

function cellValue(cell: Cell, measure: CardDefinition['measure']): number {
  if (measure === 'count') {
    return cell.count
  }
  if (measure === 'count_distinct_actor') {
    return cell.actors.size
  }
  return cell.sum
}

export function runCardQuery(
  db: DatabaseSync,
  card: CardDefinition,
  window: MetricsWindow,
  grain: MetricsGrain,
  nowMs: number = Date.now(),
): CardQueryResult {
  const windowMs = windowToMs(window)
  const fromTs = nowMs - windowMs
  const toTs = nowMs

  const { sql: whereCore, params: filterParams } = buildWhereClause(card.filter)
  const params = [fromTs, toTs, ...filterParams]

  const selectSql = `
    SELECT
      e.ts,
      e.kind,
      e.actor_key,
      e.tool,
      e.outcome,
      e.settlement,
      e.amount_micro_usdc,
      COALESCE(a.to_name, e.tool) AS display_tool
    FROM events e
    LEFT JOIN tool_alias a ON e.tool = a.from_name
    WHERE ${whereCore}
  `

  const rows = db.prepare(selectSql).all(...params) as RawEventRow[]

  const buckets = new Map<number, Map<string, Cell>>()

  for (const row of rows) {
    const bucket = bucketStartUtc(row.ts, grain)
    const series = resolveSeriesName(row, card.split)
    if (!buckets.has(bucket)) {
      buckets.set(bucket, new Map())
    }
    const seriesMap = buckets.get(bucket)!
    const cell = seriesMap.get(series) ?? emptyCell()
    applyMeasure(cell, card.measure, row)
    seriesMap.set(series, cell)
  }

  const seriesOut: CardQueryResult['series'] = []
  const step = grainStepMs(grain)

  for (let t = bucketStartUtc(fromTs, grain); t < toTs; t += step) {
    const seriesMap = buckets.get(t) ?? new Map<string, Cell>()
    if (seriesMap.size === 0) {
      seriesOut.push({ bucketStart: t, series: 'total', value: 0 })
      continue
    }
    for (const [series, cell] of seriesMap) {
      seriesOut.push({ bucketStart: t, series, value: cellValue(cell, card.measure) })
    }
  }

  return {
    cardId: card.id,
    window,
    grain,
    series: seriesOut,
    isEmpty: rows.length === 0,
  }
}

export const RETENTION_DAYS = 180

export function purgeOldEvents(db: DatabaseSync, nowMs: number = Date.now()): number {
  const cutoff = nowMs - RETENTION_DAYS * 24 * 60 * 60 * 1000
  const result = db.prepare('DELETE FROM events WHERE ts < ?').run(cutoff)
  return Number(result.changes ?? 0)
}
