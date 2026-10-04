import { describe, expect, it } from 'vitest'

import { SERVER_INSTRUCTIONS } from '../server/instructions.js'

describe('MCP server instructions', () => {
  it('claims generic hardfork prompts without requiring an EIP', () => {
    expect(SERVER_INSTRUCTIONS).toMatch(/even if they do not name an EIP/i)
    expect(SERVER_INSTRUCTIONS).toMatch(/Glamsterdam/)
    expect(SERVER_INSTRUCTIONS).toMatch(/coverage supported/i)
    expect(SERVER_INSTRUCTIONS).toMatch(/coverage unshown/i)
    expect(SERVER_INSTRUCTIONS).toMatch(/coverage consensus/i)
    expect(SERVER_INSTRUCTIONS).toMatch(/coverage networking/i)
    expect(SERVER_INSTRUCTIONS).toMatch(/coverage informational/i)
    expect(SERVER_INSTRUCTIONS).toMatch(/Berlin/)
    expect(SERVER_INSTRUCTIONS).toMatch(/1559/)
    expect(SERVER_INSTRUCTIONS).toMatch(/Omit fork to use Glamsterdam/)
    expect(SERVER_INSTRUCTIONS).toMatch(/testReleaseName/)
    expect(SERVER_INSTRUCTIONS).toMatch(/cite that snapshot once/)
    expect(SERVER_INSTRUCTIONS).not.toMatch(/run_amsterdam/)
  })

  it('defaults to one run per named fork; compare only when asked', () => {
    expect(SERVER_INSTRUCTIONS).toMatch(/run one simulation on that fork only/i)
    expect(SERVER_INSTRUCTIONS).toMatch(/Do not also run the predecessor fork unless they ask/i)
    expect(SERVER_INSTRUCTIONS).toMatch(/Only when the user asks to compare/i)
    expect(SERVER_INSTRUCTIONS).not.toMatch(/^To compare a protocol change:/)
  })
})
