import type { Express, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'

import { createGatewayServer } from '../bootstrap/createGateway.js'
import { computeActorKey } from '../metrics/actor.js'
import { getMetricsWriter } from '../metrics/globalWriter.js'
import { clientIpFromRequest, extractClientInfoFromInitializeBody } from '../metrics/httpHelpers.js'
import { metricsRequestContext } from '../metrics/requestContext.js'
import {
  deleteSessionMetricsContext,
  getSessionMetricsContext,
  setSessionMetricsContext,
} from '../metrics/sessionRegistry.js'
import type { RequestMetricsContext } from '../metrics/types.js'
import { SERVER_NAME, SERVER_VERSION, TOOL_NAMES } from '../server/constants.js'

export type CreateHttpAppOptions = {
  allowedHosts?: string[]
}

function buildInitializeMetricsContext(req: Request, body: unknown): RequestMetricsContext {
  const { clientName, clientVersion } = extractClientInfoFromInitializeBody(body)
  const ip = clientIpFromRequest(req)
  const pepper = process.env.MCP_METRICS_PEPPER ?? ''
  const actorKey = computeActorKey({ pepper, clientName, clientVersion, ip })
  return {
    actorKey,
    clientName,
    clientVersion,
    settlement: 'unpaid',
    amountMicroUsdc: null,
    asset: null,
  }
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

  const transports = new Map<string, StreamableHTTPServerTransport>()

  app.get('/healthz', (_req, res) => {
    res.json({
      status: 'ok',
      service: SERVER_NAME,
      version: SERVER_VERSION,
      tools: [...TOOL_NAMES],
    })
  })

  app.post('/mcp', (req, res) => {
    void handleMcpRequest(req, res)
  })

  app.get('/mcp', (req, res) => {
    void handleMcpRequest(req, res)
  })

  app.delete('/mcp', (req, res) => {
    void handleMcpRequest(req, res)
  })

  async function handleMcpRequest(req: Request, res: Response): Promise<void> {
    const sessionHeader = req.headers['mcp-session-id']
    const sessionId = typeof sessionHeader === 'string' ? sessionHeader : undefined

    try {
      let transport: StreamableHTTPServerTransport | undefined
      let metricsContext: RequestMetricsContext | undefined

      if (sessionId) {
        transport = transports.get(sessionId)
        if (!transport) {
          res.status(404).json({
            jsonrpc: '2.0',
            error: { code: -32000, message: 'Session not found' },
            id: null,
          })
          return
        }
        metricsContext = getSessionMetricsContext(sessionId)
      } else if (req.method === 'POST' && isInitializeRequest(req.body)) {
        metricsContext = buildInitializeMetricsContext(req, req.body)

        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId) => {
            if (transport && metricsContext) {
              transports.set(newSessionId, transport)
              setSessionMetricsContext(newSessionId, metricsContext)
              getMetricsWriter().enqueue({
                kind: 'session_open',
                ts: Date.now(),
                actorKey: metricsContext.actorKey,
                clientName: metricsContext.clientName,
                clientVersion: metricsContext.clientVersion,
              })
            }
          },
        })

        transport.onclose = () => {
          const sid = transport?.sessionId
          if (sid) {
            transports.delete(sid)
            deleteSessionMetricsContext(sid)
          }
        }

        const server = createGatewayServer()
        await server.connect(transport)
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: missing session or not an initialize POST',
          },
          id: null,
        })
        return
      }

      const runTransport = async (): Promise<void> => {
        await transport!.handleRequest(req, res, req.body)
      }

      if (metricsContext) {
        await metricsRequestContext.run(metricsContext, runTransport)
      } else {
        await runTransport()
      }
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
