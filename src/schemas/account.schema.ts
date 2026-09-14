import { z } from 'zod'

export const accountSchema = z
  .object({
    address: z.string().min(1).describe('Hex address.'),
    balance: z.string().optional().describe('Balance in wei as decimal string.'),
    code: z.string().optional().describe('Optional runtime bytecode at this address.'),
    storage: z
      .array(
        z
          .object({
            slot: z.string().min(1).describe('Storage slot hex (≤32 bytes).'),
            value: z.string().describe('Storage value hex (≤32 bytes).'),
          })
          .strict(),
      )
      .optional()
      .describe('Optional storage slots to seed (existing-slot SSTORE / SLOAD).'),
  })
  .strict()
