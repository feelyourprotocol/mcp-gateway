import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

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

  it('counts tool calls by display name with alias', () => {
    const dbPath = path.join(os.tmpdir(), `fyp-metrics-q-${Date.now()}.sqlite`)
    tempPaths.push(dbPath)
    const db = openMetricsDb(dbPath)
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
    db.close()
  })
})
