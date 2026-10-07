import { describe, expect, it } from 'vitest'

import { forkFactsFromToolInput } from '../forkFactsFromToolInput.js'

describe('forkFactsFromToolInput', () => {
  it('returns null fork for describe_capabilities', () => {
    expect(
      forkFactsFromToolInput('describe_capabilities', { fork: { baseHardfork: 'x' } }),
    ).toEqual({ forkId: null, eipsJson: null })
  })

  it('marks omitted fork when fork field is absent', () => {
    expect(forkFactsFromToolInput('run_bytecode', { bytecode: '0x00' })).toEqual({
      forkId: 'omitted',
      eipsJson: null,
    })
  })

  it('reads baseHardfork and eips list', () => {
    expect(
      forkFactsFromToolInput('generate_artifact', {
        fork: { baseHardfork: 'glamsterdam', eips: [7928, 8024] },
        transactions: [],
      }),
    ).toEqual({ forkId: 'glamsterdam', eipsJson: '[7928,8024]' })
  })

  it('drops invalid eip entries', () => {
    expect(
      forkFactsFromToolInput('run_bytecode', {
        fork: { baseHardfork: 'fusaka', eips: [0, -1, 1.5, '8024', 7708] },
      }),
    ).toEqual({ forkId: 'fusaka', eipsJson: '[7708]' })
  })

  it('does not read bytecode into fork facts', () => {
    const facts = forkFactsFromToolInput('run_bytecode', {
      bytecode: '0xdeadbeef',
      fork: { baseHardfork: 'glamsterdam' },
    })
    expect(facts.forkId).toBe('glamsterdam')
    expect(JSON.stringify(facts)).not.toContain('dead')
  })

  it('returns null fork id for malformed fork object', () => {
    expect(forkFactsFromToolInput('run_transaction', { fork: { baseHardfork: '' } })).toEqual({
      forkId: null,
      eipsJson: null,
    })
  })
})
