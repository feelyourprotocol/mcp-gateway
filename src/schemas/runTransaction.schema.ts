import { z } from 'zod'
import type { RunTransactionInput } from '@feelyourprotocol/mcp-execution-engine'

import { accountSchema } from './account.schema.js'
import { authorizationListItemSchema } from './authorization.schema.js'

const forkSchema = z
  .object({
    baseHardfork: z.string().min(1).describe('Base hardfork id (e.g. fusaka, glamsterdam).'),
    eips: z
      .array(z.number().int().positive())
      .optional()
      .describe('Optional à-la-carte EIP numbers to activate.'),
  })
  .describe('Fork capability set. Omit to use engine default (glamsterdam).')

export const runTransactionInputShape = {
  from: z.string().min(1).describe('Hex sender address (impersonated — no private key).'),
  to: z
    .string()
    .min(1)
    .optional()
    .describe('Hex recipient address. Omit for contract creation; then data is initcode.'),
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
      'Transaction gas limit as decimal string. Default 1000000. Maximum 110000000; large Glamsterdam deployments use the EIP-8037 state-gas reservoir.',
    ),
  authorizationList: z
    .array(authorizationListItemSchema)
    .optional()
    .describe(
      'Signed EIP-7702 authorization JSON items — type-4 set-code tx on pectra+. Validate with inspect authorization-list first.',
    ),
} as const

export const runTransactionInputSchema = z.object(runTransactionInputShape).strict()

export type RunTransactionToolInput = z.infer<typeof runTransactionInputSchema>

export function parseRunTransactionInput(input: unknown): RunTransactionInput {
  return runTransactionInputSchema.parse(input) as RunTransactionInput
}
