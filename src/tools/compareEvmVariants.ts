import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { TaskProcessor } from "../engine/TaskProcessor.js";
import { runToolHandler } from "../errors/toMcpError.js";
import { compareEvmVariantsInputShape } from "../schemas/compareEvmVariants.schema.js";
import { TOOL_COMPARE_EVM_VARIANTS } from "../server/constants.js";

const COMPARE_EVM_VARIANTS_DESCRIPTION =
  "Compare labelled EVM bytecode variants (each with its own fork + bytecode). Returns per-variant simulate results plus diffs (success, gasUsed, error, bytecode length) and provenance. Use for gas deltas, semantic equivalence, rewrites vs original, and fork what-if analysis. Call describe_capabilities first for runnable EIP modules. Callers supply bytecode — this server does not ship demo programs. Limits match simulate_evm_bytecode.";

export function registerCompareEvmVariantsTool(
  server: McpServer,
  processor: TaskProcessor,
): void {
  server.registerTool(
    TOOL_COMPARE_EVM_VARIANTS,
    {
      description: COMPARE_EVM_VARIANTS_DESCRIPTION,
      inputSchema: compareEvmVariantsInputShape,
    },
    async (input) =>
      runToolHandler(async () => {
        return processor.submit({ kind: "compare", payload: input });
      }),
  );
}
