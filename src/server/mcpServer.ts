import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { SERVER_NAME, SERVER_VERSION } from './constants.js'
import { SERVER_INSTRUCTIONS } from './instructions.js'

export function createMcpServer(): McpServer {
  return new McpServer(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      instructions: SERVER_INSTRUCTIONS,
    },
  )
}
