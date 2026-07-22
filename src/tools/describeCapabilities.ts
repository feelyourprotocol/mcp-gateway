import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { TaskProcessor } from "../engine/TaskProcessor.js";
import { runToolHandler } from "../errors/toMcpError.js";
import { TOOL_DESCRIBE_CAPABILITIES } from "../server/constants.js";

const DESCRIBE_CAPABILITIES_DESCRIPTION =
  "Probe what this server supports before running simulations. Returns engine version, gas/trace/bytecode ceilings, named forks (e.g. amsterdam), registered EIP capabilities with query shapes, and seed presets. Call this first to learn limits and available fork configurations.";

export function registerDescribeCapabilitiesTool(
  server: McpServer,
  processor: TaskProcessor,
): void {
  server.registerTool(
    TOOL_DESCRIBE_CAPABILITIES,
    {
      description: DESCRIBE_CAPABILITIES_DESCRIPTION,
    },
    async () =>
      runToolHandler(async () => {
        return processor.submit({ kind: "probe" });
      }),
  );
}
