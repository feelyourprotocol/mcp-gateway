import { z } from "zod";
import type { SimulateBytecodeInput } from "@feelyourprotocol/mcp-execution-engine";

const forkSchema = z
  .object({
    baseHardfork: z
      .string()
      .min(1)
      .describe("Base hardfork id (e.g. amsterdam)."),
    eips: z
      .array(z.number().int().positive())
      .optional()
      .describe("Optional à-la-carte EIP numbers to activate."),
  })
  .describe("Fork capability set. Omit to use engine default (amsterdam).");

export const simulateEvmBytecodeInputShape = {
  bytecode: z
    .string()
    .min(1)
    .describe(
      "Hex-encoded EVM bytecode (0x prefix optional). Max 24576 bytes. No Solidity compilation — raw bytecode only.",
    ),
  fork: forkSchema.optional(),
  gasLimit: z
    .string()
    .optional()
    .describe(
      "Execution gas limit as decimal string. Default 1000000. Max 30000000.",
    ),
  trace: z
    .boolean()
    .optional()
    .describe(
      "When true, include stack-only opcode trace steps (max 10000). Expensive — enable only when needed.",
    ),
} as const;

export const simulateEvmBytecodeInputSchema = z
  .object(simulateEvmBytecodeInputShape)
  .strict();

export type SimulateEvmBytecodeToolInput = z.infer<
  typeof simulateEvmBytecodeInputSchema
>;

export function parseSimulateEvmBytecodeInput(
  input: unknown,
): SimulateBytecodeInput {
  return simulateEvmBytecodeInputSchema.parse(input);
}
