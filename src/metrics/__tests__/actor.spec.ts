import { describe, expect, it } from 'vitest'

import { computeActorKey } from '../actor.js'

describe('computeActorKey', () => {
  it('is stable for the same inputs', () => {
    const params = {
      pepper: 'test-pepper',
      clientName: 'cursor',
      clientVersion: '1.0',
      ip: '203.0.113.1',
    }
    expect(computeActorKey(params)).toBe(computeActorKey(params))
  })

  it('changes when client or ip changes', () => {
    const base = {
      pepper: 'p',
      clientName: 'a',
      clientVersion: '1',
      ip: '1.1.1.1',
    }
    const a = computeActorKey(base)
    const b = computeActorKey({ ...base, clientName: 'b' })
    const c = computeActorKey({ ...base, ip: '2.2.2.2' })
    expect(a).not.toBe(b)
    expect(a).not.toBe(c)
  })
})
