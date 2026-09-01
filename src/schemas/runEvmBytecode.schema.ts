import { z } from 'zod'
import type { SimulateBytecodeInput } from '@feelyourprotocol/mcp-execution-engine'

const forkSchema = z
  .object({
    baseHardfork: z.string().min(1).describe('Base hardfork id (e.g. osaka, amsterdam).'),
    eips: z
      .array(z.number().int().positive())
      .optional()
      .describe('Optional à-la-carte EIP numbers to activate.'),
  })
  .describe('Fork capability set. Omit to use engine default (amsterdam).')

const messageCallSchema = z
  .object({
    caller: z.string().min(1).describe('Hex sender address.'),
    to: z.string().min(1).describe('Hex call target address.'),
    value: z
      .string()
      .optional()
      .describe('Value in wei as decimal string. Default 0.'),
    data: z.string().optional().describe('Optional calldata hex.'),
    code: z
      .string()
      .optional()
      .describe('Optional runtime bytecode installed at to before the call.'),
  })
  .describe('Value-bearing message call — use for plain ETH moves and EIP-7708 logs without wrapper bytecode.')

export const runEvmBytecodeInputShape = {
  bytecode: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Hex-encoded EVM bytecode (0x prefix optional). Max 24576 bytes. Required unless messageCall is set.',
    ),
  messageCall: messageCallSchema.optional(),
  fork: forkSchema.optional(),
  gasLimit: z
    .string()
    .optional()
    .describe('Execution gas limit as decimal string. Default 1000000. Max 30000000.'),
  trace: z
    .boolean()
    .optional()
    .describe(
      'When true, include stack-only opcode trace steps (max 10000). Expensive — enable only when needed.',
    ),
} as const

export const runEvmBytecodeInputSchema = z
  .object(runEvmBytecodeInputShape)
  .strict()
  .superRefine((value, ctx) => {
    const hasBytecode = value.bytecode !== undefined && value.bytecode.trim() !== ''
    const hasMessageCall = value.messageCall !== undefined
    if (!hasBytecode && !hasMessageCall) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide bytecode or messageCall',
      })
    }
    if (hasBytecode && hasMessageCall) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide bytecode or messageCall, not both',
      })
    }
  })

export type RunEvmBytecodeToolInput = z.infer<typeof runEvmBytecodeInputSchema>

export function parseRunEvmBytecodeInput(input: unknown): SimulateBytecodeInput {
  return runEvmBytecodeInputSchema.parse(input)
}
