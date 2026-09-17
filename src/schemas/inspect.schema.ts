import { z } from 'zod'
import type { InspectInput } from '@feelyourprotocol/mcp-execution-engine'

const forkSchema = z
  .object({
    baseHardfork: z.string().min(1),
    eips: z.array(z.number().int().positive()).optional(),
  })
  .optional()

export const inspectInputShape = {
  kind: z
    .enum([
      'block-access-list',
      'authorization-list',
      'typed-transaction',
      'withdrawals',
      'execution-requests',
    ])
    .optional()
    .describe('Structure kind. Default block-access-list. See describe_capabilities inspectKinds.'),
  artifact: z
    .union([z.array(z.unknown()), z.string().min(1), z.record(z.string(), z.unknown())])
    .describe('Payload shape depends on kind (JSON array, object, or hex string).'),
  blockGasLimit: z
    .string()
    .optional()
    .describe('Block gas limit for EIP-7928 BAL item cap check. Decimal string.'),
  expectedHash: z
    .string()
    .optional()
    .describe('Optional 32-byte commitment hex (BAL, tx, withdrawalsRoot, requestsHash).'),
  fork: forkSchema.describe('Fork for typed-transaction decode (default pectra).'),
} as const

export const inspectInputSchema = z.object(inspectInputShape).strict()

export type InspectToolInput = z.infer<typeof inspectInputSchema>

export function parseInspectInput(input: unknown): InspectInput {
  return inspectInputSchema.parse(input)
}
