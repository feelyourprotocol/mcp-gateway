import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { AnySchema, ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js'

import { runToolHandler } from '../errors/toMcpError.js'
import { logToolErrorStderr } from '../metrics/errorDiagnostic.js'
import { forkFactsFromToolInput } from '../metrics/forkFactsFromToolInput.js'
import { getMetricsWriter } from '../metrics/globalWriter.js'
import { getRequestMetricsContext } from '../metrics/requestContext.js'

export type ObservedToolConfig = {
  description: string
  inputSchema?: ZodRawShapeCompat | AnySchema
}

export function registerObservedTool(
  server: McpServer,
  toolName: string,
  config: ObservedToolConfig,
  run: (input: unknown, signal?: AbortSignal) => Promise<unknown>,
): void {
  // Tools with an input schema receive `(input, extra)`. `extra.signal` aborts when the
  // HTTP request goes away (the server closes with the response), so queued or running
  // engine work for a vanished caller is dropped.
  server.registerTool(toolName, config, async (input: unknown, extra?: unknown) => {
    const started = Date.now()
    const signal = (extra as { signal?: AbortSignal } | undefined)?.signal
    const { result, diagnostic } = await runToolHandler(async () => run(input, signal))
    const metricsError = result.isError === true || diagnostic?.code === 'unexpected'
    const ctx = getRequestMetricsContext()
    if (ctx) {
      const forkFacts = forkFactsFromToolInput(toolName, input)
      getMetricsWriter().enqueue({
        kind: 'tool_call',
        ts: started,
        actorKey: ctx.actorKey,
        clientName: ctx.clientName,
        clientVersion: ctx.clientVersion,
        tool: toolName,
        outcome: metricsError ? 'error' : 'ok',
        durationMs: Date.now() - started,
        settlement: ctx.settlement,
        amountMicroUsdc: ctx.amountMicroUsdc,
        asset: ctx.asset,
        forkId: forkFacts.forkId,
        eipsJson: forkFacts.eipsJson,
        ...(diagnostic !== undefined ? { errorJson: JSON.stringify(diagnostic) } : {}),
      })
      if (metricsError && diagnostic !== undefined) {
        logToolErrorStderr(toolName, diagnostic)
      }
    }
    return result
  })
}
