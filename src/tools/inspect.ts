import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { runToolHandler } from '../errors/toMcpError.js'
import { inspectInputShape } from '../schemas/inspect.schema.js'
import { TOOL_INSPECT } from '../server/constants.js'
import { INSPECT_DESCRIPTION } from './toolDescriptions.js'

export function registerInspectTool(server: McpServer, processor: TaskProcessor): void {
  server.registerTool(
    TOOL_INSPECT,
    {
      description: INSPECT_DESCRIPTION,
      inputSchema: inspectInputShape,
    },
    async (input) =>
      runToolHandler(async () => {
        return processor.submit({ kind: 'inspect', payload: input })
      }),
  )
}
