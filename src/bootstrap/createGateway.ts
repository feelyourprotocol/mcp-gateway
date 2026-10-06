import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { LocalTaskProcessor } from '../engine/LocalTaskProcessor.js'
import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { createMcpServer } from '../server/mcpServer.js'
import { registerTools } from '../tools/registerTools.js'

export type Gateway = {
  processor: TaskProcessor
  server: McpServer
}

/** Stdio uses the in-process default. Hosted HTTP passes one shared worker pool. */
export function createGateway(processor: TaskProcessor = new LocalTaskProcessor()): Gateway {
  const server = createMcpServer()
  registerTools(server, processor)
  return { processor, server }
}

export function createGatewayServer(processor?: TaskProcessor): McpServer {
  return createGateway(processor).server
}
