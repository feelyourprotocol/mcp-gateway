import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { TaskProcessor } from "../engine/TaskProcessor.js";
import { runToolHandler } from "../errors/toMcpError.js";
import { simulateEvmBytecodeInputShape } from "../schemas/simulateEvmBytecode.schema.js";
import { TOOL_SIMULATE_EVM_BYTECODE } from "../server/constants.js";

const SIMULATE_EVM_BYTECODE_DESCRIPTION =
  "Run raw EVM bytecode under a future fork / EIP configuration and return deterministic results: success, gas used, return data, final stack, optional opcode trace, and provenance. Use for gas estimation, opcode behavior (e.g. EIP-8024 DUPN/SWAPN/EXCHANGE), and fork what-if analysis. Limits: max gas 30000000 (default 1000000), max bytecode 24576 bytes, max trace 10000 steps. Call describe_capabilities first to see supported forks and EIPs.";

export function registerSimulateEvmBytecodeTool(
  server: McpServer,
  processor: TaskProcessor,
): void {
  server.registerTool(
    TOOL_SIMULATE_EVM_BYTECODE,
    {
      description: SIMULATE_EVM_BYTECODE_DESCRIPTION,
      inputSchema: simulateEvmBytecodeInputShape,
    },
    async (input) =>
      runToolHandler(async () => {
        return processor.submit({ kind: "simulate", payload: input });
      }),
  );
}
