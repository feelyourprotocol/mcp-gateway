#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { LocalTaskProcessor } from "./engine/LocalTaskProcessor.js";
import { createMcpServer } from "./server/mcpServer.js";
import { registerTools } from "./tools/registerTools.js";

async function main(): Promise<void> {
  const processor = new LocalTaskProcessor();
  const server = createMcpServer();
  registerTools(server, processor);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error("FYP MCP gateway failed to start:", error);
  process.exit(1);
});
