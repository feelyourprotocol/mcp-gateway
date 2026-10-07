import type { DatabaseSync } from 'node:sqlite'

import type { CardDefinition, CardQueryResult, MetricsGrain, MetricsWindow } from './types.js'
import { bucketStartUtc, grainStepMs, windowToMs } from './window.js'

const SINGLE_SERIES = 'value'

type RawEventRow = {
  ts: number
  kind: string
  actor_key: string | null
  client_name: string | null
  client_version: string | null
  tool: string | null
  outcome: string | null
  settlement: string | null
  amount_micro_usdc: number | null
  display_tool: string | null
  fork_id: string | null
  eips_json: string | null
}

type Cell = { count: number; actors: Set<string>; sum: number }

function emptyCell(): Cell {
  return { count: 0, actors: new Set(), sum: 0 }
}

function parseEipNumbers(eipsJson: string | null): string[] {
  if (!eipsJson) {
    return []
  }
  try {
    const parsed: unknown = JSON.parse(eipsJson)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0)
      .map((n) => String(n))
  } catch {
    return []
  }
}

function resolveSeriesNames(row: RawEventRow, split: CardDefinition['split']): string[] {
  if (split === 'tool') {
    return [row.display_tool ?? row.tool ?? 'unknown']
  }
  if (split === 'settlement') {
    return [row.settlement ?? 'unknown']
  }
  if (split === 'outcome') {
    return [row.outcome ?? 'unknown']
  }
  if (split === 'client') {
    const name = row.client_name ?? 'unknown'
    const version = row.client_version ?? 'unknown'
    return [`${name}\t${version}`]
  }
  if (split === 'fork') {
    if (!row.fork_id) {
      return []
    }
    return [row.fork_id]
  }
  if (split === 'eip') {
    return parseEipNumbers(row.eips_json)
  }
  return [SINGLE_SERIES]
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

function computeSummary(rows: RawEventRow[], card: CardDefinition): number {
  if (card.measure === 'count') {
    if (card.split === 'eip') {
      let total = 0
      for (const row of rows) {
        total += parseEipNumbers(row.eips_json).length
      }
      return total
    }
    if (card.split === 'client') {
      const versions = new Set<string>()
      for (const row of rows) {
        versions.add(`${row.client_name ?? 'unknown'}\t${row.client_version ?? 'unknown'}`)
      }
      return versions.size
    }
    return rows.length
  }
  if (card.measure === 'count_distinct_actor') {
    const actors = new Set<string>()
    for (const row of rows) {
      if (row.actor_key) {
        actors.add(row.actor_key)
      }
    }
    return actors.size
  }
  return rows.reduce((sum, row) => sum + (row.amount_micro_usdc ?? 0), 0)
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
      e.client_name,
      e.client_version,
      e.tool,
      e.outcome,
      e.settlement,
      e.amount_micro_usdc,
      e.fork_id,
      e.eips_json,
      COALESCE(a.to_name, e.tool) AS display_tool
    FROM events e
    LEFT JOIN tool_alias a ON e.tool = a.from_name
    WHERE ${whereCore}
  `

  const rows = db.prepare(selectSql).all(...params) as RawEventRow[]
  const summary = computeSummary(rows, card)

  if (card.chart === 'table') {
    const windowMap = new Map<string, Cell>()
    for (const row of rows) {
      for (const series of resolveSeriesNames(row, card.split)) {
        const cell = windowMap.get(series) ?? emptyCell()
        applyMeasure(cell, card.measure, row)
        windowMap.set(series, cell)
      }
    }
    const seriesOut: CardQueryResult['series'] = [...windowMap.entries()]
      .map(([series, cell]) => ({
        bucketStart: fromTs,
        series,
        value: cellValue(cell, card.measure),
      }))
      .sort((a, b) => b.value - a.value)

    return {
      cardId: card.id,
      window,
      grain,
      series: seriesOut,
      summary,
      isEmpty: rows.length === 0,
    }
  }

  const buckets = new Map<number, Map<string, Cell>>()

  for (const row of rows) {
    const bucket = bucketStartUtc(row.ts, grain)
    const seriesNames = resolveSeriesNames(row, card.split)
    if (seriesNames.length === 0) {
      continue
    }
    if (!buckets.has(bucket)) {
      buckets.set(bucket, new Map())
    }
    const seriesMap = buckets.get(bucket)!
    for (const series of seriesNames) {
      const cell = seriesMap.get(series) ?? emptyCell()
      applyMeasure(cell, card.measure, row)
      seriesMap.set(series, cell)
    }
  }

  const discovered = new Set<string>(card.fillSeries ?? [])
  for (const seriesMap of buckets.values()) {
    for (const name of seriesMap.keys()) {
      discovered.add(name)
    }
  }
  const ordered = [
    ...(card.fillSeries ?? []),
    ...[...discovered].filter((name) => !(card.fillSeries ?? []).includes(name)).sort(),
  ]

  const seriesOut: CardQueryResult['series'] = []
  const step = grainStepMs(grain)

  for (let t = bucketStartUtc(fromTs, grain); t < toTs; t += step) {
    const seriesMap = buckets.get(t) ?? new Map<string, Cell>()
    if (ordered.length === 0) {
      if (!card.split) {
        seriesOut.push({ bucketStart: t, series: SINGLE_SERIES, value: 0 })
      }
      continue
    }
    for (const name of ordered) {
      const cell = seriesMap.get(name) ?? emptyCell()
      seriesOut.push({ bucketStart: t, series: name, value: cellValue(cell, card.measure) })
    }
  }

  return {
    cardId: card.id,
    window,
    grain,
    series: seriesOut,
    summary,
    isEmpty: rows.length === 0,
  }
}

export const RETENTION_DAYS = 180

export function purgeOldEvents(db: DatabaseSync, nowMs: number = Date.now()): number {
  const cutoff = nowMs - RETENTION_DAYS * 24 * 60 * 60 * 1000
  const result = db.prepare('DELETE FROM events WHERE ts < ?').run(cutoff)
  return Number(result.changes ?? 0)
}
