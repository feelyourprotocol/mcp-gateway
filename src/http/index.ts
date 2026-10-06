#!/usr/bin/env node
import { WorkerPool } from '../engine/WorkerPool.js'
import { SERVER_NAME, SERVER_VERSION, TOOL_NAMES } from '../server/constants.js'
import { createHttpApp } from './createHttpApp.js'

const host = process.env.MCP_HTTP_HOST ?? '127.0.0.1'
const port = Number(process.env.MCP_HTTP_PORT ?? '3000')
const allowedHosts = process.env.MCP_ALLOWED_HOSTS?.split(',')
  .map((value) => value.trim())
  .filter(Boolean)

const STARTUP_TIMEOUT_MS = 30_000

async function startPool(): Promise<WorkerPool> {
  const pool = new WorkerPool()
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error('Engine workers did not start in time')),
      STARTUP_TIMEOUT_MS,
    )
  })
  try {
    await Promise.race([pool.start(), timeout])
  } catch (error) {
    await pool.close()
    throw error
  } finally {
    clearTimeout(timer)
  }
  return pool
}

async function main(): Promise<void> {
  // One pool for the whole process. Each stateless POST builds its own MCP server
  // but submits engine work here, off the event loop.
  const pool = await startPool()

  const app = createHttpApp({
    ...(allowedHosts && allowedHosts.length > 0 ? { allowedHosts } : {}),
    processor: pool,
  })

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
    await pool.close()
  }

  process.on('SIGINT', () => {
    void shutdown().finally(() => process.exit(0))
  })

  process.on('SIGTERM', () => {
    void shutdown().finally(() => process.exit(0))
  })
}

main().catch((error: unknown) => {
  console.error('FYP MCP HTTP gateway failed to start:', error)
  process.exit(1)
})
