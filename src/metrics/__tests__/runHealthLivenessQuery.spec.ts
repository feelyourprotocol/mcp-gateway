import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { insertHealthSample } from '../healthPoller.js'
import { getCardDefinition } from '../query/cardRegistry.js'
import { runHealthLivenessQuery } from '../query/runHealthLivenessQuery.js'
import { openMetricsDb } from '../server/openMetricsDb.js'

describe('runHealthLivenessQuery', () => {
  const tempPaths: string[] = []

  afterEach(() => {
    for (const p of tempPaths) {
      fs.rmSync(p, { force: true })
    }
    tempPaths.length = 0
  })

  it('computes uptime percent summary', () => {
    const dbPath = path.join(os.tmpdir(), `fyp-health-q-${Date.now()}.sqlite`)
    tempPaths.push(dbPath)
    const db = openMetricsDb(dbPath)
    const now = Date.UTC(2026, 3, 10, 12, 0, 0)
    insertHealthSample(db, { ts: now, ok: true, statusCode: 200, durationMs: 10 })
    insertHealthSample(db, { ts: now + 60_000, ok: false, statusCode: 503, durationMs: 10 })

    const card = getCardDefinition('mcp-liveness')!
    const result = runHealthLivenessQuery(db, card, '7d', 'day', now + 120_000)
    expect(result.summary).toBe(50)
    expect(result.series.some((row) => row.series === 'up' && row.value === 1)).toBe(true)
    db.close()
  })
})
