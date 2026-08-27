import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { TaskProcessor } from "../engine/TaskProcessor.js";
import { runToolHandler } from "../errors/toMcpError.js";
import { TOOL_DESCRIBE_CAPABILITIES } from "../server/constants.js";

const DESCRIBE_CAPABILITIES_DESCRIPTION =
  "Probe what this Feel Your Protocol EVM server supports before running simulations. Returns engine version, gas/trace/bytecode ceilings, named forks (amsterdam; alias glamsterdam), and registered runnable EIP modules (what became possible: opcodes, encoding rules, keywords). Live coverage: EIP-8024 DUPN/SWAPN/EXCHANGE on Amsterdam. Does not list unimplemented EIPs and does not ship demo programs — callers supply bytecode. Call this first for support questions (is EIP-8024 available? can I run Amsterdam bytecode with the new stack opcodes?) then use simulate_evm_bytecode or compare_evm_variants.";

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
