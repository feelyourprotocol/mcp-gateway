import { z } from 'zod'
import type { GenerateInput } from '@feelyourprotocol/mcp-execution-engine'

import { runBlockInputShape } from './runBlock.schema.js'

export const generateArtifactInputShape = {
  ...runBlockInputShape,
  kind: z
    .enum(['block-access-list'])
    .optional()
    .describe('Artifact to derive from the lab block. Default block-access-list (EIP-7928).'),
} as const

export const generateArtifactInputSchema = z.object(generateArtifactInputShape).strict()

export type GenerateArtifactToolInput = z.infer<typeof generateArtifactInputSchema>

export function parseGenerateArtifactInput(input: unknown): GenerateInput {
  return generateArtifactInputSchema.parse(input)
}
