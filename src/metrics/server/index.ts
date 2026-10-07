#!/usr/bin/env node
import { createMetricsApp } from './createMetricsApp.js'

const host = process.env.MCP_METRICS_HOST ?? '127.0.0.1'
const port = Number(process.env.MCP_METRICS_PORT ?? '3001')
const dbPath = process.env.MCP_METRICS_DB

if (!dbPath) {
  console.error('[fyp-mcp-metrics] MCP_METRICS_DB is required')
  process.exit(1)
}

const { app, healthPoller } = createMetricsApp({ dbPath })

process.on('SIGTERM', () => {
  healthPoller?.stop()
})

app.listen(port, host, () => {
  console.error(`[fyp-mcp-metrics] listening on http://${host}:${port}`)
})
