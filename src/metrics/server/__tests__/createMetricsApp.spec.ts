import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'

import { insertHealthSample } from '../../healthPoller.js'
import { createMetricsApp } from '../createMetricsApp.js'
import { openMetricsDb } from '../openMetricsDb.js'

describe('createMetricsApp', () => {
  let dbDir = ''
  let dbPath = ''

  afterEach(() => {
    if (dbDir) {
      rmSync(dbDir, { recursive: true, force: true })
      dbDir = ''
    }
  })

  it('registers routes without throwing (Express 5 wildcard)', async () => {
    dbDir = mkdtempSync(join(tmpdir(), 'fyp-metrics-'))
    dbPath = join(dbDir, 'events.sqlite')
    const { app, healthPoller } = createMetricsApp({ dbPath, startHealthPoller: false })
    healthPoller?.stop()

    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ok', service: 'fyp-mcp-metrics' })
  })

  it('returns current liveness from health_samples', async () => {
    dbDir = mkdtempSync(join(tmpdir(), 'fyp-metrics-live-'))
    dbPath = join(dbDir, 'events.sqlite')
    const db = openMetricsDb(dbPath)
    insertHealthSample(db, {
      ts: Date.now(),
      ok: true,
      statusCode: 200,
      durationMs: 25,
    })
    db.close()

    const { app } = createMetricsApp({ dbPath, startHealthPoller: false })
    const res = await request(app).get('/api/liveness/current')
    expect(res.status).toBe(200)
    expect(res.body.state).toBe('up')
  })
})
