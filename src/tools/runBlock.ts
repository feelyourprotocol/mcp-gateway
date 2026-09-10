import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { runToolHandler } from '../errors/toMcpError.js'
import { runBlockInputShape } from '../schemas/runBlock.schema.js'
import { TOOL_RUN_BLOCK } from '../server/constants.js'
import { RUN_BLOCK_DESCRIPTION } from './toolDescriptions.js'

export function registerRunBlockTool(server: McpServer, processor: TaskProcessor): void {
  server.registerTool(
    TOOL_RUN_BLOCK,
    {
      description: RUN_BLOCK_DESCRIPTION,
      inputSchema: runBlockInputShape,
    },
    async (input) =>
      runToolHandler(async () => {
        return processor.submit({ kind: 'block', payload: input })
      }),
  )
}
