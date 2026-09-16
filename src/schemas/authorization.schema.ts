import { z } from 'zod'

/** EIP-7702 authorization JSON item (same fields as inspect authorization-list). */
export const authorizationListItemSchema = z
  .object({
    chainId: z.string().min(1),
    address: z.string().min(1),
    nonce: z.string().min(1),
    yParity: z.string().min(1),
    r: z.string().min(1),
    s: z.string().min(1),
  })
  .strict()
