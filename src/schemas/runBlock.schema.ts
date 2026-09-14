import { z } from 'zod'
import type { RunBlockInput } from '@feelyourprotocol/mcp-execution-engine'

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

const transactionSchema = z
  .object({
    from: z.string().min(1).describe('Hex sender address (impersonated — no private key).'),
    to: z.string().min(1).describe('Hex recipient address.'),
    value: z.string().optional().describe('Value in wei as decimal string. Default 0.'),
    data: z.string().optional().describe('Optional calldata hex.'),
    code: z
      .string()
      .optional()
      .describe('Optional runtime bytecode installed at to before the block.'),
    gasLimit: z
      .string()
      .optional()
      .describe('Transaction gas limit as decimal string. Default 1000000.'),
  })
  .strict()

const headerSchema = z
  .object({
    slotNumber: z
      .string()
      .optional()
      .describe('Beacon slot as a decimal string. Amsterdam / EIP-7843 only.'),
    number: z.string().optional().describe('Block number as a decimal string. Default 1.'),
    timestamp: z.string().optional().describe('Unix timestamp as a decimal string. Default 1.'),
  })
  .strict()

export const runBlockInputShape = {
  transactions: z
    .array(transactionSchema)
    .min(1)
    .max(8)
    .describe('1–8 impersonated transactions to execute as one lab block.'),
  header: headerSchema.optional().describe('Optional lab header fields (slot, number, timestamp).'),
  accounts: z.array(accountSchema).optional().describe('Extra accounts to prefund.'),
  fork: forkSchema.optional(),
} as const

export const runBlockInputSchema = z.object(runBlockInputShape).strict()

export type RunBlockToolInput = z.infer<typeof runBlockInputSchema>

export function parseRunBlockInput(input: unknown): RunBlockInput {
  return runBlockInputSchema.parse(input)
}
