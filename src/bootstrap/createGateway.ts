import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { LocalTaskProcessor } from "../engine/LocalTaskProcessor.js";
import type { TaskProcessor } from "../engine/TaskProcessor.js";
import { createMcpServer } from "../server/mcpServer.js";
import { registerTools } from "../tools/registerTools.js";

export type Gateway = {
  processor: TaskProcessor;
  server: McpServer;
};

export function createGateway(): Gateway {
  const processor = new LocalTaskProcessor();
  const server = createMcpServer();
  registerTools(server, processor);
  return { processor, server };
}

export function createGatewayServer(): McpServer {
  return createGateway().server;
}
