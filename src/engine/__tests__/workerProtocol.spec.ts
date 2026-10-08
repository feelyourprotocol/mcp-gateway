import { describe, expect, it } from 'vitest'
import { EngineError } from '@feelyourprotocol/mcp-execution-engine'

import { deserializeError, serializeError } from '../workerProtocol.js'

describe('workerProtocol', () => {
  it('round-trips EngineError field and facts', () => {
    const original = new EngineError('Provide bytecode', 'invalid_input', {
      field: 'bytecode',
      facts: { 'bytecode.shape': 'empty', 'bytecode.chars': 0 },
    })
    const serialized = serializeError(original)
    const rebuilt = deserializeError(serialized)
    expect(rebuilt).toBeInstanceOf(EngineError)
    const err = rebuilt as EngineError
    expect(err.code).toBe('invalid_input')
    expect(err.field).toBe('bytecode')
    expect(err.facts?.['bytecode.shape']).toBe('empty')
  })
})
