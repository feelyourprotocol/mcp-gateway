import { z } from 'zod'
import type { SimulateBytecodeInput } from '@feelyourprotocol/mcp-execution-engine'

import { accountSchema } from './account.schema.js'

const forkSchema = z
  .object({
    baseHardfork: z.string().min(1).describe('Base hardfork id (e.g. osaka, amsterdam).'),
    eips: z
      .array(z.number().int().positive())
      .optional()
      .describe('Optional à-la-carte EIP numbers to activate.'),
  })
  .describe('Fork capability set. Omit to use engine default (amsterdam).')

export const runBytecodeInputShape = {
  bytecode: z
    .string()
    .min(1)
    .describe('Hex-encoded EVM bytecode (0x prefix optional). Max 24576 bytes.'),
  accounts: z
    .array(accountSchema)
    .optional()
    .describe(
      'Optional prestate: code/balance/storage at other addresses, or storage on the lab execution account 0x00000000000000000000000000000000000000b1.',
    ),
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

export const runBytecodeInputSchema = z.object(runBytecodeInputShape).strict()

export type RunBytecodeToolInput = z.infer<typeof runBytecodeInputSchema>

export function parseRunBytecodeInput(input: unknown): SimulateBytecodeInput {
  return runBytecodeInputSchema.parse(input)
}
