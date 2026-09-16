import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { registerDescribeCapabilitiesTool } from './describeCapabilities.js'
import { registerGenerateTool } from './generate.js'
import { registerInspectTool } from './inspect.js'
import { registerRunBlockTool } from './runBlock.js'
import { registerRunBytecodeTool } from './runBytecode.js'
import { registerRunTransactionTool } from './runTransaction.js'

export function registerTools(server: McpServer, processor: TaskProcessor): void {
  registerDescribeCapabilitiesTool(server, processor)
  registerRunBytecodeTool(server, processor)
  registerRunTransactionTool(server, processor)
  registerRunBlockTool(server, processor)
  registerGenerateTool(server, processor)
  registerInspectTool(server, processor)
}
