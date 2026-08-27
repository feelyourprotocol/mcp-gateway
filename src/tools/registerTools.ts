import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { registerCompareEvmVariantsTool } from './compareEvmVariants.js'
import { registerDescribeCapabilitiesTool } from './describeCapabilities.js'
import { registerSimulateEvmBytecodeTool } from './simulateEvmBytecode.js'

export function registerTools(server: McpServer, processor: TaskProcessor): void {
  registerDescribeCapabilitiesTool(server, processor)
  registerSimulateEvmBytecodeTool(server, processor)
  registerCompareEvmVariantsTool(server, processor)
}
