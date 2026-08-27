import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { runToolHandler } from '../errors/toMcpError.js'
import { compareEvmVariantsInputShape } from '../schemas/compareEvmVariants.schema.js'
import { TOOL_COMPARE_EVM_VARIANTS } from '../server/constants.js'
import { COMPARE_EVM_VARIANTS_DESCRIPTION } from './toolDescriptions.js'

export function registerCompareEvmVariantsTool(server: McpServer, processor: TaskProcessor): void {
  server.registerTool(
    TOOL_COMPARE_EVM_VARIANTS,
    {
      description: COMPARE_EVM_VARIANTS_DESCRIPTION,
      inputSchema: compareEvmVariantsInputShape,
    },
    async (input) =>
      runToolHandler(async () => {
        return processor.submit({ kind: 'compare', payload: input })
      }),
  )
}
