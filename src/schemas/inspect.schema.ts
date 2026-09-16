import { z } from 'zod'
import type { InspectInput } from '@feelyourprotocol/mcp-execution-engine'

export const inspectInputShape = {
  kind: z
    .enum(['block-access-list'])
    .optional()
    .describe('Structure kind. Default block-access-list (EIP-7928).'),
  artifact: z
    .union([z.array(z.unknown()), z.string().min(1)])
    .describe('BAL JSON array (Engine API) or RLP-encoded list as hex.'),
  blockGasLimit: z
    .string()
    .optional()
    .describe('Block gas limit for EIP-7928 item cap check. Decimal string.'),
  expectedHash: z
    .string()
    .optional()
    .describe('Optional blockAccessListHash (32-byte hex) for layer-C hash match.'),
} as const

export const inspectInputSchema = z.object(inspectInputShape).strict()

export type InspectToolInput = z.infer<typeof inspectInputSchema>

export function parseInspectInput(input: unknown): InspectInput {
  return inspectInputSchema.parse(input)
}
