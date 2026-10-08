import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { EngineError } from '@feelyourprotocol/mcp-execution-engine'

import { diagnosticFromZodError, redactMessage, sanitizeDiagnostic } from '../errorDiagnostic.js'

describe('errorDiagnostic', () => {
  it('redacts long hex in messages', () => {
    const msg = `bad ${'0x' + 'a'.repeat(40)} end`
    expect(redactMessage(msg)).toContain('0xaaaa…aaaa')
    expect(redactMessage(msg)).not.toContain('a'.repeat(40))
  })

  it('Zod diagnostic includes field path', () => {
    const error = new ZodError([
      { code: 'custom', message: 'bytecode required', path: ['bytecode'] },
    ])
    const diagnostic = diagnosticFromZodError(error)
    expect(diagnostic.field).toBe('bytecode')
    expect(diagnostic.code).toBe('invalid_input')
  })

  it('sanitize strips long hex fact values on code fields', () => {
    const diagnostic = sanitizeDiagnostic({
      code: 'invalid_bytecode',
      message: 'nope',
      facts: { 'bytecode.shape': 'non_hex', received: '0x' + 'f'.repeat(100) },
    })
    expect(diagnostic.facts?.received).toBe('[hex]')
  })

  it('preserves EngineError facts from worker round-trip shape', () => {
    const err = new EngineError('odd', 'invalid_bytecode', {
      field: 'bytecode',
      facts: { 'bytecode.shape': 'odd_length', 'bytecode.chars': 7 },
    })
    const diagnostic = sanitizeDiagnostic({
      code: err.code,
      field: err.field,
      message: err.message,
      facts: err.facts,
    })
    expect(diagnostic.facts?.['bytecode.chars']).toBe(7)
  })
})
