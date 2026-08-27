#!/usr/bin/env node
import { SERVER_NAME, SERVER_VERSION, TOOL_NAMES } from '../server/constants.js'
import { createHttpApp } from './createHttpApp.js'

const host = process.env.MCP_HTTP_HOST ?? '127.0.0.1'
const port = Number(process.env.MCP_HTTP_PORT ?? '3000')
const allowedHosts = process.env.MCP_ALLOWED_HOSTS?.split(',')
  .map((value) => value.trim())
  .filter(Boolean)

const app = createHttpApp(allowedHosts && allowedHosts.length > 0 ? { allowedHosts } : {})

const server = app.listen(port, host, () => {
  console.error(
    `[fyp-mcp] ${SERVER_NAME} v${SERVER_VERSION} HTTP ready on http://${host}:${port} — tools: ${TOOL_NAMES.join(', ')}`,
  )
  console.error(
    `[fyp-mcp] MCP endpoint: http://${host}:${port}/mcp (proxy via nginx for public HTTPS)`,
  )
})

async function shutdown(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}

process.on('SIGINT', () => {
  void shutdown().finally(() => process.exit(0))
})

process.on('SIGTERM', () => {
  void shutdown().finally(() => process.exit(0))
})
