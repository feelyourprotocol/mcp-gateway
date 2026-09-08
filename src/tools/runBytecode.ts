import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { runToolHandler } from '../errors/toMcpError.js'
import { runBytecodeInputShape } from '../schemas/runBytecode.schema.js'
import { TOOL_RUN_BYTECODE } from '../server/constants.js'
import { RUN_BYTECODE_DESCRIPTION } from './toolDescriptions.js'

export function registerRunBytecodeTool(server: McpServer, processor: TaskProcessor): void {
  server.registerTool(
    TOOL_RUN_BYTECODE,
    {
      description: RUN_BYTECODE_DESCRIPTION,
      inputSchema: runBytecodeInputShape,
    },
    async (input) =>
      runToolHandler(async () => {
        return processor.submit({ kind: 'simulate', payload: input })
      }),
  )
}
