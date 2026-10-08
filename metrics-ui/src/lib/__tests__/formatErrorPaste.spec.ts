import { describe, expect, it } from 'vitest'

import { formatErrorPaste } from '@/lib/formatErrorPaste'

describe('formatErrorPaste', () => {
  it('includes code, field, and facts for paste', () => {
    const text = formatErrorPaste({
      id: 9,
      ts: Date.parse('2026-10-07T10:07:00.000Z'),
      tool: 'run_bytecode',
      forkId: 'glamsterdam',
      eips: [7928],
      diagnostic: {
        code: 'invalid_bytecode',
        field: 'bytecode',
        message: 'Bytecode hex must have an even number of digits',
        facts: { 'bytecode.shape': 'odd_length' },
      },
    })
    expect(text).toContain('tool: run_bytecode')
    expect(text).toContain('code: invalid_bytecode')
    expect(text).toContain('field: bytecode')
    expect(text).toContain('bytecode.shape: odd_length')
    expect(text).toContain('fork: glamsterdam')
  })
})
