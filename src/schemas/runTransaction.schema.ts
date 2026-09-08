import { z } from 'zod'
import type { RunTransactionInput } from '@feelyourprotocol/mcp-execution-engine'

const forkSchema = z
  .object({
    baseHardfork: z.string().min(1).describe('Base hardfork id (e.g. osaka, amsterdam).'),
    eips: z
      .array(z.number().int().positive())
      .optional()
      .describe('Optional à-la-carte EIP numbers to activate.'),
  })
  .describe('Fork capability set. Omit to use engine default (amsterdam).')

const accountSchema = z
  .object({
    address: z.string().min(1).describe('Hex address.'),
    balance: z.string().optional().describe('Balance in wei as decimal string.'),
    code: z.string().optional().describe('Optional runtime bytecode at this address.'),
  })
  .strict()

export const runTransactionInputShape = {
  from: z.string().min(1).describe('Hex sender address (impersonated — no private key).'),
  to: z.string().min(1).describe('Hex recipient address.'),
  value: z.string().optional().describe('Value in wei as decimal string. Default 0.'),
  data: z.string().optional().describe('Optional calldata hex.'),
  code: z
    .string()
    .optional()
    .describe('Optional runtime bytecode installed at to before the transaction.'),
  accounts: z.array(accountSchema).optional().describe('Extra accounts to prefund.'),
  fork: forkSchema.optional(),
  gasLimit: z
    .string()
    .optional()
    .describe(
      'Transaction gas limit as decimal string. Default 1000000. Pass 21000 for the wallet-era simple-transfer limit.',
    ),
} as const

export const runTransactionInputSchema = z.object(runTransactionInputShape).strict()

export type RunTransactionToolInput = z.infer<typeof runTransactionInputSchema>

export function parseRunTransactionInput(input: unknown): RunTransactionInput {
  return runTransactionInputSchema.parse(input)
}
