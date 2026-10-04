import { z } from 'zod'

export const accessListEntrySchema = z
  .object({
    address: z.string().min(1).describe('Hex address listed in the EIP-2930 access list.'),
    storageKeys: z
      .array(z.string())
      .optional()
      .describe('Storage key hex strings (≤32 bytes each). Default empty.'),
  })
  .strict()

export const accessListSchema = z
  .array(accessListEntrySchema)
  .min(1)
  .describe(
    'EIP-2930 access list — builds a type-2 transaction. On Glamsterdam, list bytes pay the calldata floor (EIP-7981). Mutually exclusive with authorizationList.',
  )
