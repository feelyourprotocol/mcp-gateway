import { describe, expect, it } from 'vitest'

import { SERVER_INSTRUCTIONS } from '../server/instructions.js'

describe('MCP server instructions', () => {
  it('claims generic hardfork prompts without requiring an EIP', () => {
    expect(SERVER_INSTRUCTIONS).toMatch(/even if they do not name an EIP/i)
    expect(SERVER_INSTRUCTIONS).toMatch(/Amsterdam/)
    expect(SERVER_INSTRUCTIONS).toMatch(/namedForks are first-class capabilities/i)
    expect(SERVER_INSTRUCTIONS).toMatch(/Omit fork to use Amsterdam/)
    expect(SERVER_INSTRUCTIONS).not.toMatch(/run_amsterdam/)
  })
})
