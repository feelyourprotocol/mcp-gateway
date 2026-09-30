import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { TOOL_DESCRIBE_CAPABILITIES } from '../server/constants.js'
import { registerObservedTool } from './registerObservedTool.js'
import { DESCRIBE_CAPABILITIES_DESCRIPTION } from './toolDescriptions.js'

export function registerDescribeCapabilitiesTool(
  server: McpServer,
  processor: TaskProcessor,
): void {
  registerObservedTool(
    server,
    TOOL_DESCRIBE_CAPABILITIES,
    {
      description: DESCRIBE_CAPABILITIES_DESCRIPTION,
    },
    async () => processor.submit({ kind: 'probe' }),
  )
}
