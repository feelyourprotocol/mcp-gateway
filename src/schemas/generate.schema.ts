import { z } from 'zod'
import type { GenerateInput } from '@feelyourprotocol/mcp-execution-engine'

import { runBlockInputShape } from './runBlock.schema.js'

export const generateInputShape = {
  ...runBlockInputShape,
  kind: z
    .enum(['block-access-list'])
    .optional()
    .describe('Artifact to derive from the lab block. Default block-access-list (EIP-7928).'),
} as const

export const generateInputSchema = z.object(generateInputShape).strict()

export type GenerateToolInput = z.infer<typeof generateInputSchema>

export function parseGenerateInput(input: unknown): GenerateInput {
  return generateInputSchema.parse(input)
}
