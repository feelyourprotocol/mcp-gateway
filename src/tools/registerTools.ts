import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { TaskProcessor } from "../engine/TaskProcessor.js";
import { registerDescribeCapabilitiesTool } from "./describeCapabilities.js";

export function registerTools(
  server: McpServer,
  processor: TaskProcessor,
): void {
  registerDescribeCapabilitiesTool(server, processor);
}
