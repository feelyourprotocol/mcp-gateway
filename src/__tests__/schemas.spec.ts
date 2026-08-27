import { describe, expect, it } from 'vitest'

import {
  parseRunEvmBytecodeInput,
  runEvmBytecodeInputSchema,
} from '../schemas/runEvmBytecode.schema.js'

describe('runEvmBytecodeInputSchema', () => {
  it('requires bytecode', () => {
    expect(() => runEvmBytecodeInputSchema.parse({})).toThrow()
  })

  it('rejects empty bytecode string', () => {
    expect(() => runEvmBytecodeInputSchema.parse({ bytecode: '' })).toThrow()
  })

  it('rejects fork without baseHardfork', () => {
    expect(() =>
      runEvmBytecodeInputSchema.parse({
        bytecode: '0x600100',
        fork: { eips: [8024] },
      }),
    ).toThrow()
  })

  it('rejects unknown top-level fields', () => {
    expect(() =>
      runEvmBytecodeInputSchema.parse({
        bytecode: '0x600100',
        extra: true,
      }),
    ).toThrow()
  })

  it('accepts minimal valid input', () => {
    const parsed = parseRunEvmBytecodeInput({ bytecode: '0x600100' })
    expect(parsed.bytecode).toBe('0x600100')
  })

  it('accepts full lab-shaped input', () => {
    const parsed = parseRunEvmBytecodeInput({
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
      runEvmBytecodeInputSchema.parse({
        bytecode: '0x600100',
        gasLimit: 1_000_000,
      }),
    ).toThrow()
  })

  it('rejects non-boolean trace flag', () => {
    expect(() =>
      runEvmBytecodeInputSchema.parse({
        bytecode: '0x600100',
        trace: 'true',
      }),
    ).toThrow()
  })

  it('rejects non-numeric eip entries', () => {
    expect(() =>
      runEvmBytecodeInputSchema.parse({
        bytecode: '0x600100',
        fork: { baseHardfork: 'amsterdam', eips: ['8024'] },
      }),
    ).toThrow()
  })

  it('rejects non-positive eip numbers', () => {
    expect(() =>
      runEvmBytecodeInputSchema.parse({
        bytecode: '0x600100',
        fork: { baseHardfork: 'amsterdam', eips: [0] },
      }),
    ).toThrow()
  })
})
