import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { insertHealthSample, probeHealthUrl, startHealthPoller } from '../healthPoller.js'
import { openMetricsDb } from '../server/openMetricsDb.js'

describe('healthPoller', () => {
  const tempPaths: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()
    for (const p of tempPaths) {
      fs.rmSync(p, { force: true })
    }
    tempPaths.length = 0
  })

  it('records ok samples from health JSON', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    })) as unknown as typeof fetch

    const result = await probeHealthUrl('http://127.0.0.1:3000/healthz', 5000, fetchImpl)
    expect(result.ok).toBe(true)
    expect(result.statusCode).toBe(200)
  })

  it('inserts samples through the poller tick', async () => {
    const dbPath = path.join(os.tmpdir(), `fyp-health-${Date.now()}.sqlite`)
    tempPaths.push(dbPath)
    const db = openMetricsDb(dbPath)

    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    })) as unknown as typeof fetch

    const poller = startHealthPoller({
      db,
      pollIntervalMs: 60_000,
      fetchImpl,
    })
    await poller.tick()
    poller.stop()

    const count = db.prepare('SELECT COUNT(*) AS c FROM health_samples').get() as { c: number }
    expect(count.c).toBeGreaterThanOrEqual(1)
    expect(fetchImpl).toHaveBeenCalled()
    db.close()
  })

  it('stores failed probes', () => {
    const dbPath = path.join(os.tmpdir(), `fyp-health-fail-${Date.now()}.sqlite`)
    tempPaths.push(dbPath)
    const db = openMetricsDb(dbPath)
    insertHealthSample(db, {
      ts: Date.now(),
      ok: false,
      statusCode: 503,
      durationMs: 12,
    })
    const row = db.prepare('SELECT ok FROM health_samples').get() as { ok: number }
    expect(row.ok).toBe(0)
    db.close()
  })
})
