#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createGateway } from "./bootstrap/createGateway.js";
import { SERVER_NAME, SERVER_VERSION, TOOL_NAMES } from "./server/constants.js";

async function main(): Promise<void> {
  const { server } = createGateway();

  console.error(
    `[fyp-mcp] ${SERVER_NAME} v${SERVER_VERSION} ready — tools: ${TOOL_NAMES.join(", ")}`,
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error("FYP MCP gateway failed to start:", error);
  process.exit(1);
});
