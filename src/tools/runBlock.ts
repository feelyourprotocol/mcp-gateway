import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { parseRunBlockInput, runBlockInputShape } from '../schemas/runBlock.schema.js'
import { TOOL_RUN_BLOCK } from '../server/constants.js'
import { registerObservedTool } from './registerObservedTool.js'
import { RUN_BLOCK_DESCRIPTION } from './toolDescriptions.js'

export function registerRunBlockTool(server: McpServer, processor: TaskProcessor): void {
  registerObservedTool(
    server,
    TOOL_RUN_BLOCK,
    {
      description: RUN_BLOCK_DESCRIPTION,
      inputSchema: runBlockInputShape,
    },
    async (input, signal) =>
      processor.submit({ kind: 'block', payload: parseRunBlockInput(input) }, { signal }),
  )
}
