import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { AnySchema, ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

import { runToolHandler } from '../errors/toMcpError.js'
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
  run: (input: unknown) => Promise<unknown>,
): void {
  server.registerTool(toolName, config, async (input: unknown) => {
    const started = Date.now()
    const result: CallToolResult = await runToolHandler(async () => run(input))
    const ctx = getRequestMetricsContext()
    if (ctx) {
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
      })
    }
    return result
  })
}
