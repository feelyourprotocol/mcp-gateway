import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import {
  parseRunTransactionInput,
  runTransactionInputShape,
} from '../schemas/runTransaction.schema.js'
import { TOOL_RUN_TRANSACTION } from '../server/constants.js'
import { registerObservedTool } from './registerObservedTool.js'
import { RUN_TRANSACTION_DESCRIPTION } from './toolDescriptions.js'

export function registerRunTransactionTool(server: McpServer, processor: TaskProcessor): void {
  registerObservedTool(
    server,
    TOOL_RUN_TRANSACTION,
    {
      description: RUN_TRANSACTION_DESCRIPTION,
      inputSchema: runTransactionInputShape,
    },
    async (input, signal) =>
      processor.submit(
        { kind: 'transaction', payload: parseRunTransactionInput(input) },
        { signal },
      ),
  )
}
