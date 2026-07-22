#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { LocalTaskProcessor } from "./engine/LocalTaskProcessor.js";
import {
  SERVER_NAME,
  SERVER_VERSION,
  TOOL_DESCRIBE_CAPABILITIES,
  TOOL_SIMULATE_EVM_BYTECODE,
} from "./server/constants.js";
import { createMcpServer } from "./server/mcpServer.js";
import { registerTools } from "./tools/registerTools.js";

async function main(): Promise<void> {
  const processor = new LocalTaskProcessor();
  const server = createMcpServer();
  registerTools(server, processor);

  // stderr only — visible in Cursor MCP logs; must not write to stdout (stdio transport).
  console.error(
    `[fyp-mcp] ${SERVER_NAME} v${SERVER_VERSION} ready — tools: ${TOOL_DESCRIBE_CAPABILITIES}, ${TOOL_SIMULATE_EVM_BYTECODE}`,
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error("FYP MCP gateway failed to start:", error);
  process.exit(1);
});
