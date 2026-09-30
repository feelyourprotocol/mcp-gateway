import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'

import { createMetricsApp } from '../createMetricsApp.js'

describe('createMetricsApp', () => {
  let dbDir = ''

  afterEach(() => {
    if (dbDir) {
      rmSync(dbDir, { recursive: true, force: true })
      dbDir = ''
    }
  })

  it('registers routes without throwing (Express 5 wildcard)', async () => {
    dbDir = mkdtempSync(join(tmpdir(), 'fyp-metrics-'))
    const dbPath = join(dbDir, 'events.sqlite')
    const app = createMetricsApp({ dbPath })

    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ok', service: 'fyp-mcp-metrics' })
  })
})
