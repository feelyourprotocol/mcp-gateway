import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { registerDescribeCapabilitiesTool } from './describeCapabilities.js'
import { registerRunEvmBytecodeTool } from './runEvmBytecode.js'

export function registerTools(server: McpServer, processor: TaskProcessor): void {
  registerDescribeCapabilitiesTool(server, processor)
  registerRunEvmBytecodeTool(server, processor)
}
