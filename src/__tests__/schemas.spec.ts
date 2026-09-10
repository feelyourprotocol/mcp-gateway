import { describe, expect, it } from 'vitest'

import { parseRunBlockInput, runBlockInputSchema } from '../schemas/runBlock.schema.js'
import { parseRunBytecodeInput, runBytecodeInputSchema } from '../schemas/runBytecode.schema.js'
import {
  parseRunTransactionInput,
  runTransactionInputSchema,
} from '../schemas/runTransaction.schema.js'

describe('runBytecodeInputSchema', () => {
  it('requires bytecode', () => {
    expect(() => runBytecodeInputSchema.parse({})).toThrow()
  })

  it('rejects empty bytecode string', () => {
    expect(() => runBytecodeInputSchema.parse({ bytecode: '' })).toThrow()
  })

  it('rejects fork without baseHardfork', () => {
    expect(() =>
      runBytecodeInputSchema.parse({
        bytecode: '0x600100',
        fork: { eips: [8024] },
      }),
    ).toThrow()
  })

  it('rejects unknown top-level fields', () => {
    expect(() =>
      runBytecodeInputSchema.parse({
        bytecode: '0x600100',
        extra: true,
      }),
    ).toThrow()
  })

  it('accepts minimal valid input', () => {
    const parsed = parseRunBytecodeInput({ bytecode: '0x600100' })
    expect(parsed.bytecode).toBe('0x600100')
  })

  it('accepts full lab-shaped input', () => {
    const parsed = parseRunBytecodeInput({
      bytecode: '0x600100',
      fork: { baseHardfork: 'amsterdam', eips: [] },
      gasLimit: '1000000',
      trace: true,
    })

    expect(parsed.fork?.baseHardfork).toBe('amsterdam')
    expect(parsed.trace).toBe(true)
  })

  it('rejects non-string gasLimit', () => {
    expect(() =>
      runBytecodeInputSchema.parse({
        bytecode: '0x600100',
        gasLimit: 1_000_000,
      }),
    ).toThrow()
  })

  it('rejects messageCall leftovers', () => {
    expect(() =>
      runBytecodeInputSchema.parse({
        bytecode: '0x600100',
        messageCall: { caller: '0x00', to: '0x00' },
      }),
    ).toThrow()
  })
})

describe('runTransactionInputSchema', () => {
  it('requires from and to', () => {
    expect(() => runTransactionInputSchema.parse({})).toThrow()
    expect(() => runTransactionInputSchema.parse({ from: '0x00' })).toThrow()
  })

  it('accepts a minimal value transfer', () => {
    const parsed = parseRunTransactionInput({
      from: '0x00000000000000000000000000000000000000ee',
      to: '0x00000000000000000000000000000000000000aa',
      value: '1',
    })
    expect(parsed.value).toBe('1')
  })

  it('rejects unknown top-level fields', () => {
    expect(() =>
      runTransactionInputSchema.parse({
        from: '0x00000000000000000000000000000000000000ee',
        to: '0x00000000000000000000000000000000000000aa',
        extra: true,
      }),
    ).toThrow()
  })
})

describe('runBlockInputSchema', () => {
  it('requires at least one transaction', () => {
    expect(() => runBlockInputSchema.parse({})).toThrow()
    expect(() => runBlockInputSchema.parse({ transactions: [] })).toThrow()
  })

  it('accepts a one-tx lab block', () => {
    const parsed = parseRunBlockInput({
      transactions: [
        {
          from: '0x00000000000000000000000000000000000000ee',
          to: '0x00000000000000000000000000000000000000aa',
          value: '1',
        },
      ],
    })
    expect(parsed.transactions).toHaveLength(1)
  })

  it('accepts an optional header slot', () => {
    const parsed = parseRunBlockInput({
      transactions: [
        {
          from: '0x00000000000000000000000000000000000000ee',
          to: '0x00000000000000000000000000000000000000aa',
        },
      ],
      header: { slotNumber: '42' },
    })
    expect(parsed.header?.slotNumber).toBe('42')
  })

  it('rejects more than eight transactions', () => {
    const transactions = Array.from({ length: 9 }, () => ({
      from: '0x00000000000000000000000000000000000000ee',
      to: '0x00000000000000000000000000000000000000aa',
    }))
    expect(() => runBlockInputSchema.parse({ transactions })).toThrow()
  })

  it('rejects unknown top-level fields', () => {
    expect(() =>
      runBlockInputSchema.parse({
        transactions: [
          {
            from: '0x00000000000000000000000000000000000000ee',
            to: '0x00000000000000000000000000000000000000aa',
          },
        ],
        extra: true,
      }),
    ).toThrow()
  })
})
