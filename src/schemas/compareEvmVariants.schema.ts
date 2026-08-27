import { z } from "zod";
import type { CompareVariantsInput } from "@feelyourprotocol/mcp-execution-engine";

const forkSchema = z
  .object({
    baseHardfork: z
      .string()
      .min(1)
      .describe(
        "Base hardfork id (e.g. amsterdam). Alias glamsterdam is accepted.",
      ),
    eips: z
      .array(z.number().int().positive())
      .optional()
      .describe("Optional à-la-carte EIP numbers to activate."),
  })
  .describe("Fork capability set for this variant.");

const variantSchema = z
  .object({
    label: z
      .string()
      .min(1)
      .describe("Unique label for this variant (used as a diff column)."),
    bytecode: z
      .string()
      .min(1)
      .describe("Hex-encoded EVM bytecode (0x prefix optional)."),
    fork: forkSchema,
    gasLimit: z
      .string()
      .optional()
      .describe("Per-variant gas limit as decimal string."),
    trace: z
      .boolean()
      .optional()
      .describe("When true, include stack-only opcode trace for this variant."),
  })
  .strict();

export const compareEvmVariantsInputShape = {
  variants: z
    .array(variantSchema)
    .min(2)
    .describe(
      "At least two labelled variants. Each has its own fork + bytecode.",
    ),
} as const;

export const compareEvmVariantsInputSchema = z
  .object(compareEvmVariantsInputShape)
  .strict();

export type CompareEvmVariantsToolInput = z.infer<
  typeof compareEvmVariantsInputSchema
>;

export function parseCompareEvmVariantsInput(
  input: unknown,
): CompareVariantsInput {
  return compareEvmVariantsInputSchema.parse(input);
}
