import type { Express, Request, Response } from 'express'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'

import { createGatewayServer } from '../bootstrap/createGateway.js'
import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { computeActorKey } from '../metrics/actor.js'
import { getMetricsWriter } from '../metrics/globalWriter.js'
import { clientIpFromRequest, extractClientInfoFromInitializeBody } from '../metrics/httpHelpers.js'
import { metricsRequestContext } from '../metrics/requestContext.js'
import type { RequestMetricsContext } from '../metrics/types.js'
import { SERVER_NAME, SERVER_VERSION, TOOL_NAMES } from '../server/constants.js'

export type CreateHttpAppOptions = {
  allowedHosts?: string[]
  /** Shared across requests. The HTTP entry passes the worker pool. Defaults to in-process. */
  processor?: TaskProcessor
}

function buildRequestMetricsContext(
  req: Request,
  client: { clientName: string; clientVersion: string },
): RequestMetricsContext {
  const ip = clientIpFromRequest(req)
  const pepper = process.env.MCP_METRICS_PEPPER ?? ''
  const actorKey = computeActorKey({
    pepper,
    clientName: client.clientName,
    clientVersion: client.clientVersion,
    ip,
  })
  return {
    actorKey,
    clientName: client.clientName,
    clientVersion: client.clientVersion,
    settlement: 'unpaid',
    amountMicroUsdc: null,
    asset: null,
  }
}

function methodNotAllowed(_req: Request, res: Response): void {
  res.set('Allow', 'POST')
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method Not Allowed' },
    id: null,
  })
}

export function createHttpApp(options: CreateHttpAppOptions = {}): Express {
  const allowedHosts = options.allowedHosts ?? [
    'mcp.feelyourprotocol.org',
    'localhost',
    '127.0.0.1',
  ]

  const app = createMcpExpressApp({
    host: '127.0.0.1',
    allowedHosts,
  })

  app.set('trust proxy', 1)

  app.get('/healthz', (_req, res) => {
    res.json({
      status: 'ok',
      service: SERVER_NAME,
      version: SERVER_VERSION,
      tools: [...TOOL_NAMES],
    })
  })

  // No session map. Each POST gets a fresh server and a stateless transport
  // (sessionIdGenerator omitted). A restart cannot invalidate an install, and
  // an abandoned initialize cannot stay in memory. GET is the optional
  // server-push stream; this lab does not push, so 405 is the spec's "no stream".
  app.post('/mcp', (req, res) => {
    void handleMcpPost(req, res)
  })

  app.get('/mcp', methodNotAllowed)
  app.delete('/mcp', methodNotAllowed)

  async function handleMcpPost(req: Request, res: Response): Promise<void> {
    const server = createGatewayServer(options.processor)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    })

    let released = false
    const release = (): void => {
      if (released) {
        return
      }
      released = true
      void server.close()
    }
    res.on('close', release)

    try {
      const initializing = isInitializeRequest(req.body)
      const client = initializing
        ? extractClientInfoFromInitializeBody(req.body)
        : { clientName: 'unknown', clientVersion: 'unknown' }
      const metricsContext = buildRequestMetricsContext(req, client)

      if (initializing) {
        getMetricsWriter().enqueue({
          kind: 'session_open',
          ts: Date.now(),
          actorKey: metricsContext.actorKey,
          clientName: metricsContext.clientName,
          clientVersion: metricsContext.clientVersion,
        })
      }

      await server.connect(transport)
      await metricsRequestContext.run(metricsContext, async () => {
        await transport.handleRequest(req, res, req.body)
      })
    } catch (error) {
      console.error('[fyp-mcp] MCP HTTP error:', error)
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        })
      }
    }
  }

  return app
}
