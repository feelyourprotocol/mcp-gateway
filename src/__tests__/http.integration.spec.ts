import type { AddressInfo } from 'node:net'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

import { createHttpApp } from '../http/createHttpApp.js'
import { SERVER_NAME, SERVER_VERSION, TOOL_NAMES } from '../server/constants.js'

const mcpHeaders = {
  Accept: 'application/json, text/event-stream',
  'Content-Type': 'application/json',
  Host: '127.0.0.1',
}

const toolsList = { jsonrpc: '2.0', id: 1, method: 'tools/list' }

describe('HTTP gateway', () => {
  const app = createHttpApp({ allowedHosts: ['127.0.0.1', 'localhost'] })

  it('returns health JSON at GET /healthz', async () => {
    const response = await request(app).get('/healthz').expect(200)

    expect(response.body).toEqual({
      status: 'ok',
      service: SERVER_NAME,
      version: SERVER_VERSION,
      tools: [...TOOL_NAMES],
    })
  })

  it('answers tools/list with no session and ignores a stale session id', async () => {
    const fresh = await request(app).post('/mcp').set(mcpHeaders).send(toolsList).expect(200)

    expect(fresh.headers['mcp-session-id']).toBeUndefined()
    expect(fresh.text).toContain('describe_capabilities')

    const stale = await request(app)
      .post('/mcp')
      .set(mcpHeaders)
      .set('mcp-session-id', 'not-a-session')
      .send(toolsList)
      .expect(200)

    expect(stale.headers['mcp-session-id']).toBeUndefined()
    expect(stale.text).toContain('describe_capabilities')
  })

  it('does not issue a session id on initialize', async () => {
    const response = await request(app)
      .post('/mcp')
      .set(mcpHeaders)
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'stateless-test', version: '0' },
        },
      })
      .expect(200)

    expect(response.headers['mcp-session-id']).toBeUndefined()
    expect(response.text).toContain('FeelYourProtocol')
  })

  it('rejects GET and DELETE /mcp', async () => {
    const getResponse = await request(app).get('/mcp').set('Host', '127.0.0.1').expect(405)
    const deleteResponse = await request(app).delete('/mcp').set('Host', '127.0.0.1').expect(405)

    expect(getResponse.headers.allow).toBe('POST')
    expect(deleteResponse.body.error?.message).toBe('Method Not Allowed')
  })

  it('serves the streamable HTTP client with no stored session', async () => {
    const httpServer = app.listen(0, '127.0.0.1')
    await new Promise<void>((resolve) => {
      httpServer.once('listening', () => resolve())
    })
    const { port } = httpServer.address() as AddressInfo
    const client = new Client({ name: 'stateless-test', version: '0' })
    const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`))

    try {
      await client.connect(transport)
      expect(transport.sessionId).toBeUndefined()

      const listed = await client.listTools()
      expect(listed.tools.map((tool) => tool.name)).toEqual([...TOOL_NAMES])

      const again = await client.listTools()
      expect(again.tools).toHaveLength(TOOL_NAMES.length)
    } finally {
      await client.close()
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()))
      })
    }
  })
})
