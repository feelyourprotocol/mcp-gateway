import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { runToolHandler } from '../errors/toMcpError.js'
import { generateInputShape } from '../schemas/generate.schema.js'
import { TOOL_GENERATE } from '../server/constants.js'
import { GENERATE_DESCRIPTION } from './toolDescriptions.js'

export function registerGenerateTool(server: McpServer, processor: TaskProcessor): void {
  server.registerTool(
    TOOL_GENERATE,
    {
      description: GENERATE_DESCRIPTION,
      inputSchema: generateInputShape,
    },
    async (input) =>
      runToolHandler(async () => {
        return processor.submit({ kind: 'generate', payload: input })
      }),
  )
}
