import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { runToolHandler } from '../errors/toMcpError.js'
import { TOOL_DESCRIBE_CAPABILITIES } from '../server/constants.js'
import { DESCRIBE_CAPABILITIES_DESCRIPTION } from './toolDescriptions.js'

export function registerDescribeCapabilitiesTool(
  server: McpServer,
  processor: TaskProcessor,
): void {
  server.registerTool(
    TOOL_DESCRIBE_CAPABILITIES,
    {
      description: DESCRIBE_CAPABILITIES_DESCRIPTION,
    },
    async () =>
      runToolHandler(async () => {
        return processor.submit({ kind: 'probe' })
      }),
  )
}
