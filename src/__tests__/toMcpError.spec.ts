import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { EngineError } from '@feelyourprotocol/mcp-execution-engine'

import { jsonToolResult, runToolHandler, toMcpToolError, toolError } from '../errors/toMcpError.js'
import { extractTextContent } from './helpers.js'

describe('toMcpError', () => {
  it('jsonToolResult serializes payload as formatted JSON text', () => {
    const result = jsonToolResult({ ok: true, n: 1 })
    expect(extractTextContent(result)).toBe(JSON.stringify({ ok: true, n: 1 }, null, 2))
  })

  it('toolError sets isError and optional code suffix', () => {
    const result = toolError('bad input', 'invalid_input')
    expect(result.isError).toBe(true)
    expect(extractTextContent(result)).toBe('bad input (invalid_input)')
  })

  it('maps ZodError to invalid_input', () => {
    const error = new ZodError([
      {
        code: 'custom',
        message: 'bytecode required',
        path: ['bytecode'],
      },
    ])

    const result = toMcpToolError(error)
    expect(result.isError).toBe(true)
    expect(extractTextContent(result)).toBe('bytecode required (invalid_input)')
  })

  it('maps EngineError to isError with engine code', () => {
    const result = toMcpToolError(new EngineError('Bytecode too large', 'bytecode_too_large'))

    expect(result.isError).toBe(true)
    expect(extractTextContent(result)).toBe('Bytecode too large (bytecode_too_large)')
  })

  it('maps generic Error without code suffix', () => {
    const result = toMcpToolError(new Error('boom'))
    expect(result.isError).toBe(true)
    expect(extractTextContent(result)).toBe('boom')
  })

  it('runToolHandler returns JSON result on success', async () => {
    const result = await runToolHandler(async () => ({ value: 42 }))
    expect(result.isError).not.toBe(true)
    expect(JSON.parse(extractTextContent(result))).toEqual({ value: 42 })
  })

  it('runToolHandler catches EngineError into MCP isError', async () => {
    const result = await runToolHandler(async () => {
      throw new EngineError('Unsupported base hardfork: bogus', 'unsupported_hardfork')
    })

    expect(result.isError).toBe(true)
    expect(extractTextContent(result)).toMatch(/unsupported_hardfork/i)
  })
})
