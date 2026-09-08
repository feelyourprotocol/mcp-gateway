import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { runToolHandler } from '../errors/toMcpError.js'
import { runTransactionInputShape } from '../schemas/runTransaction.schema.js'
import { TOOL_RUN_TRANSACTION } from '../server/constants.js'
import { RUN_TRANSACTION_DESCRIPTION } from './toolDescriptions.js'

export function registerRunTransactionTool(server: McpServer, processor: TaskProcessor): void {
  server.registerTool(
    TOOL_RUN_TRANSACTION,
    {
      description: RUN_TRANSACTION_DESCRIPTION,
      inputSchema: runTransactionInputShape,
    },
    async (input) =>
      runToolHandler(async () => {
        return processor.submit({ kind: 'transaction', payload: input })
      }),
  )
}
