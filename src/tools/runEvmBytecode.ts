import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { runToolHandler } from '../errors/toMcpError.js'
import { runEvmBytecodeInputShape } from '../schemas/runEvmBytecode.schema.js'
import { TOOL_RUN_EVM_BYTECODE } from '../server/constants.js'
import { RUN_EVM_BYTECODE_DESCRIPTION } from './toolDescriptions.js'

export function registerRunEvmBytecodeTool(server: McpServer, processor: TaskProcessor): void {
  server.registerTool(
    TOOL_RUN_EVM_BYTECODE,
    {
      description: RUN_EVM_BYTECODE_DESCRIPTION,
      inputSchema: runEvmBytecodeInputShape,
    },
    async (input) =>
      runToolHandler(async () => {
        return processor.submit({ kind: 'simulate', payload: input })
      }),
  )
}
