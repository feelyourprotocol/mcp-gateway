import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { parseRunBytecodeInput, runBytecodeInputShape } from '../schemas/runBytecode.schema.js'
import { TOOL_RUN_BYTECODE } from '../server/constants.js'
import { registerObservedTool } from './registerObservedTool.js'
import { RUN_BYTECODE_DESCRIPTION } from './toolDescriptions.js'

export function registerRunBytecodeTool(server: McpServer, processor: TaskProcessor): void {
  registerObservedTool(
    server,
    TOOL_RUN_BYTECODE,
    {
      description: RUN_BYTECODE_DESCRIPTION,
      inputSchema: runBytecodeInputShape,
    },
    async (input) => processor.submit({ kind: 'simulate', payload: parseRunBytecodeInput(input) }),
  )
}
