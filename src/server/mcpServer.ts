import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { SERVER_NAME, SERVER_VERSION } from "./constants.js";

export function createMcpServer(): McpServer {
  return new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });
}
