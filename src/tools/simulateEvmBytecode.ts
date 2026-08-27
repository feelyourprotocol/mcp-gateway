import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { runToolHandler } from '../errors/toMcpError.js'
import { simulateEvmBytecodeInputShape } from '../schemas/simulateEvmBytecode.schema.js'
import { TOOL_SIMULATE_EVM_BYTECODE } from '../server/constants.js'
import { SIMULATE_EVM_BYTECODE_DESCRIPTION } from './toolDescriptions.js'

export function registerSimulateEvmBytecodeTool(server: McpServer, processor: TaskProcessor): void {
  server.registerTool(
    TOOL_SIMULATE_EVM_BYTECODE,
    {
      description: SIMULATE_EVM_BYTECODE_DESCRIPTION,
      inputSchema: simulateEvmBytecodeInputShape,
    },
    async (input) =>
      runToolHandler(async () => {
        return processor.submit({ kind: 'simulate', payload: input })
      }),
  )
}
