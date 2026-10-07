import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { TOOL_NAMES } from '../../server/constants.js'
import { getCardDefinition } from '../query/cardRegistry.js'
import { runCardQuery } from '../query/runCardQuery.js'
import { openMetricsDb } from '../server/openMetricsDb.js'

describe('runCardQuery', () => {
  const tempPaths: string[] = []

  afterEach(() => {
    for (const p of tempPaths) {
      fs.rmSync(p, { force: true })
    }
    tempPaths.length = 0
  })

  function openTempDb(): ReturnType<typeof openMetricsDb> {
    const dbPath = path.join(os.tmpdir(), `fyp-metrics-q-${Date.now()}.sqlite`)
    tempPaths.push(dbPath)
    return openMetricsDb(dbPath)
  }

  it('counts tool calls by display name with alias', () => {
    const db = openTempDb()
    const now = Date.UTC(2026, 2, 1, 12, 0, 0)
    db.prepare(
      `INSERT INTO tool_alias (from_name, to_name) VALUES ('old_tool', 'run_bytecode')`,
    ).run()
    db.prepare(
      `INSERT INTO events (ts, kind, tool, outcome, settlement) VALUES (?, 'tool_call', 'old_tool', 'ok', 'unpaid')`,
    ).run(now)
    db.prepare(
      `INSERT INTO events (ts, kind, tool, outcome, settlement) VALUES (?, 'tool_call', 'run_bytecode', 'ok', 'unpaid')`,
    ).run(now + 3_600_000)

    const card = getCardDefinition('tool-calls')!
    const result = runCardQuery(db, card, '7d', 'day', now + 3_600_001)
    const runBytecode = result.series.filter((row) => row.series === 'run_bytecode')
    expect(runBytecode.some((row) => row.value >= 2)).toBe(true)
    expect(result.summary).toBe(2)
    db.close()
  })

  it('does not emit a series named total', () => {
    const db = openTempDb()
    const now = Date.UTC(2026, 2, 10, 12, 0, 0)
    db.prepare(
      `INSERT INTO events (ts, kind, actor_key, client_name, client_version) VALUES (?, 'session_open', 'a', 'c', '1')`,
    ).run(now)

    const card = getCardDefinition('sessions')!
    const result = runCardQuery(db, card, '7d', 'day', now + 86_400_000)
    expect(result.series.some((row) => row.series === 'total')).toBe(false)
    expect(result.summary).toBe(1)
    db.close()
  })

  it('uses window-unique actors for fingerprint summary', () => {
    const db = openTempDb()
    const day1 = Date.UTC(2026, 2, 5, 12, 0, 0)
    const day2 = day1 + 86_400_000
    db.prepare(
      `INSERT INTO events (ts, kind, actor_key, client_name, client_version) VALUES (?, 'session_open', 'same', 'c', '1')`,
    ).run(day1)
    db.prepare(
      `INSERT INTO events (ts, kind, actor_key, client_name, client_version) VALUES (?, 'session_open', 'same', 'c', '1')`,
    ).run(day2)
    db.prepare(
      `INSERT INTO events (ts, kind, actor_key, client_name, client_version) VALUES (?, 'session_open', 'other', 'c', '2')`,
    ).run(day2)

    const card = getCardDefinition('distinct-fingerprints')!
    const result = runCardQuery(db, card, '7d', 'day', day2 + 86_400_000)
    expect(result.summary).toBe(2)
    const dailySum = result.series.reduce((sum, row) => sum + row.value, 0)
    expect(dailySum).toBeGreaterThan(result.summary)
    db.close()
  })

  it('zero-fills all tools in the tool usage card', () => {
    const db = openTempDb()
    const now = Date.UTC(2026, 2, 8, 12, 0, 0)
    db.prepare(
      `INSERT INTO events (ts, kind, tool, outcome, settlement) VALUES (?, 'tool_call', 'run_bytecode', 'ok', 'unpaid')`,
    ).run(now)

    const card = getCardDefinition('tool-calls')!
    const result = runCardQuery(db, card, '7d', 'day', now + 3_600_000)
    for (const tool of TOOL_NAMES) {
      expect(result.series.some((row) => row.series === tool)).toBe(true)
    }
    expect(result.series.find((row) => row.series === 'generate_artifact')?.value).toBe(0)
    db.close()
  })

  it('splits fork_id including omitted', () => {
    const db = openTempDb()
    const now = Date.UTC(2026, 2, 8, 12, 0, 0)
    db.prepare(
      `INSERT INTO events (ts, kind, tool, outcome, settlement, fork_id) VALUES (?, 'tool_call', 'run_bytecode', 'ok', 'unpaid', 'glamsterdam')`,
    ).run(now)
    db.prepare(
      `INSERT INTO events (ts, kind, tool, outcome, settlement, fork_id) VALUES (?, 'tool_call', 'generate_artifact', 'ok', 'unpaid', 'omitted')`,
    ).run(now)

    const card = getCardDefinition('hardforks')!
    const result = runCardQuery(db, card, '7d', 'day', now + 3_600_000)
    expect(result.series.some((row) => row.series === 'omitted' && row.value === 1)).toBe(true)
    db.close()
  })

  it('counts both eips from one call', () => {
    const db = openTempDb()
    const now = Date.UTC(2026, 2, 8, 12, 0, 0)
    db.prepare(
      `INSERT INTO events (ts, kind, tool, outcome, settlement, eips_json) VALUES (?, 'tool_call', 'run_bytecode', 'ok', 'unpaid', ?)`,
    ).run(now, '[7928,8024]')

    const card = getCardDefinition('eip-numbers')!
    const result = runCardQuery(db, card, '7d', 'day', now + 3_600_000)
    expect(result.summary).toBe(2)
    expect(result.series.some((row) => row.series === '7928' && row.value === 1)).toBe(true)
    expect(result.series.some((row) => row.series === '8024' && row.value === 1)).toBe(true)
    db.close()
  })

  it('keeps sparse bar charts on the same hour grid', () => {
    const db = openTempDb()
    const now = Date.UTC(2026, 3, 2, 15, 30, 0)
    const errorAt = now - 3 * 3_600_000
    db.prepare(
      `INSERT INTO events (ts, kind, tool, outcome, settlement, fork_id, eips_json) VALUES (?, 'tool_call', 'run_bytecode', 'error', 'unpaid', 'glamsterdam', ?)`,
    ).run(errorAt, '[7928]')
    db.prepare(
      `INSERT INTO events (ts, kind, tool, outcome, settlement, fork_id) VALUES (?, 'tool_call', 'run_bytecode', 'ok', 'unpaid', 'fusaka')`,
    ).run(now - 10 * 3_600_000)

    const bucketCount = (id: string, grain: 'hour' | 'day' = 'hour') => {
      const card = getCardDefinition(id)!
      const result = runCardQuery(db, card, '24h', grain, now)
      return new Set(result.series.map((row) => row.bucketStart)).size
    }

    const tools = bucketCount('tool-calls')
    expect(tools).toBeGreaterThanOrEqual(24)
    expect(bucketCount('tool-errors')).toBe(tools)
    expect(bucketCount('hardforks')).toBe(tools)
    expect(bucketCount('eip-numbers')).toBe(tools)
    expect(bucketCount('settlement-mix')).toBe(tools)

    const errors = runCardQuery(db, getCardDefinition('tool-errors')!, '24h', 'hour', now)
    const byDay = runCardQuery(db, getCardDefinition('tool-errors')!, '24h', 'day', now)
    expect(errors.summary).toBe(1)
    expect(byDay.summary).toBe(1)
    expect(errors.series.filter((row) => row.value === 0).length).toBeGreaterThan(20)
    expect(bucketCount('tool-errors', 'hour')).toBeGreaterThan(bucketCount('tool-errors', 'day'))
    db.close()
  })

  it('returns empty eip card when no eips_json rows', () => {
    const db = openTempDb()
    const now = Date.UTC(2026, 2, 8, 12, 0, 0)
    db.prepare(
      `INSERT INTO events (ts, kind, tool, outcome, settlement, fork_id) VALUES (?, 'tool_call', 'run_bytecode', 'ok', 'unpaid', 'glamsterdam')`,
    ).run(now)

    const card = getCardDefinition('eip-numbers')!
    const result = runCardQuery(db, card, '7d', 'day', now + 3_600_000)
    expect(result.isEmpty).toBe(false)
    expect(result.summary).toBe(0)
    expect(result.series.length).toBe(0)
    db.close()
  })

  it('builds client table rows sorted by sessions', () => {
    const db = openTempDb()
    const now = Date.UTC(2026, 2, 8, 12, 0, 0)
    db.prepare(
      `INSERT INTO events (ts, kind, client_name, client_version) VALUES (?, 'session_open', 'cursor-agent', '1.0')`,
    ).run(now)
    db.prepare(
      `INSERT INTO events (ts, kind, client_name, client_version) VALUES (?, 'session_open', 'cursor-agent', '1.0')`,
    ).run(now + 1000)
    db.prepare(
      `INSERT INTO events (ts, kind, client_name, client_version) VALUES (?, 'session_open', 'other', '2.0')`,
    ).run(now + 2000)

    const card = getCardDefinition('clients')!
    const result = runCardQuery(db, card, '7d', 'day', now + 86_400_000)
    expect(result.series[0]?.series).toBe('cursor-agent\t1.0')
    expect(result.series[0]?.value).toBe(2)
    expect(result.series).toHaveLength(2)
    expect(result.summary).toBe(2)
    db.close()
  })
})
