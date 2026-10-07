import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createHttpApp } from '../http/createHttpApp.js'
import { getMetricsWriter, resetMetricsWriterForTests } from '../metrics/globalWriter.js'
import { TOOL_GENERATE_ARTIFACT, TOOL_INSPECT_ARTIFACT } from '../server/constants.js'

const mcpHeaders = {
  Accept: 'application/json, text/event-stream',
  'Content-Type': 'application/json',
  Host: '127.0.0.1',
}

describe('HTTP gateway metrics', () => {
  let dbPath: string

  beforeEach(() => {
    resetMetricsWriterForTests()
    dbPath = path.join(os.tmpdir(), `fyp-http-metrics-${Date.now()}.sqlite`)
    process.env.MCP_METRICS_DB = dbPath
    process.env.MCP_METRICS_PEPPER = 'test-pepper'
  })

  afterEach(() => {
    resetMetricsWriterForTests()
    delete process.env.MCP_METRICS_DB
    delete process.env.MCP_METRICS_PEPPER
    fs.rmSync(dbPath, { force: true })
  })

  it('records generate_artifact and inspect_artifact tool_call rows', async () => {
    const app = createHttpApp({ allowedHosts: ['127.0.0.1', 'localhost'] })

    await request(app)
      .post('/mcp')
      .set(mcpHeaders)
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'metrics-test', version: '1.0' },
        },
      })
      .expect(200)

    await request(app)
      .post('/mcp')
      .set(mcpHeaders)
      .send({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: TOOL_GENERATE_ARTIFACT,
          arguments: {
            fork: { baseHardfork: 'glamsterdam' },
            transactions: [
              {
                from: '0xb6e610921b0a0f6f608c0e1f29a845552bc6db2c',
                to: '0x16abcdab9880c2d58230998de45c493c478dc0d8',
                value: '1',
              },
            ],
            accounts: [
              {
                address: '0xb6e610921b0a0f6f608c0e1f29a845552bc6db2c',
                balance: '1000000000000000000',
              },
            ],
          },
        },
      })
      .expect(200)

    await request(app)
      .post('/mcp')
      .set(mcpHeaders)
      .send({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: TOOL_INSPECT_ARTIFACT,
          arguments: {
            kind: 'authorization-list',
            artifact: [],
            fork: { baseHardfork: 'pectra' },
          },
        },
      })
      .expect(200)

    getMetricsWriter().flush()
    resetMetricsWriterForTests()

    const db = new DatabaseSync(dbPath, { readOnly: true })
    const tools = db
      .prepare(`SELECT tool, outcome, fork_id FROM events WHERE kind = 'tool_call' ORDER BY ts`)
      .all() as { tool: string; outcome: string; fork_id: string | null }[]

    expect(tools.map((row) => row.tool)).toEqual([TOOL_GENERATE_ARTIFACT, TOOL_INSPECT_ARTIFACT])
    expect(tools[0]?.outcome).toBe('ok')
    expect(tools[0]?.fork_id).toBe('glamsterdam')
    expect(tools[1]?.outcome).toBe('ok')
    expect(tools[1]?.fork_id).toBe('pectra')
    db.close()
  })
})
