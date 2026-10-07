import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { AnySchema, ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

import { runToolHandler } from '../errors/toMcpError.js'
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
    const result: CallToolResult = await runToolHandler(async () => run(input, signal))
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
        outcome: result.isError ? 'error' : 'ok',
        durationMs: Date.now() - started,
        settlement: ctx.settlement,
        amountMicroUsdc: ctx.amountMicroUsdc,
        asset: ctx.asset,
        forkId: forkFacts.forkId,
        eipsJson: forkFacts.eipsJson,
      })
    }
    return result
  })
}
