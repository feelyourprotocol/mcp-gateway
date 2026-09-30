import { describe, expect, it } from 'vitest'

import { resolveApiUrl } from '../resolveApiUrl'

describe('resolveApiUrl', () => {
  it('prefixes paths with Vite BASE_URL', () => {
    expect(resolveApiUrl('/api/cards')).toBe(`${import.meta.env.BASE_URL}api/cards`)
  })
})
