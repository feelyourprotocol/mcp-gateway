import { describe, expect, it } from 'vitest'

import { SERVER_INSTRUCTIONS } from '../server/instructions.js'

describe('MCP server instructions', () => {
  it('claims generic hardfork prompts without requiring an EIP', () => {
    expect(SERVER_INSTRUCTIONS).toMatch(/even if they do not name an EIP/i)
    expect(SERVER_INSTRUCTIONS).toMatch(/Glamsterdam/)
    expect(SERVER_INSTRUCTIONS).toMatch(/eipIntroductions/i)
    expect(SERVER_INSTRUCTIONS).toMatch(/Berlin/)
    expect(SERVER_INSTRUCTIONS).toMatch(/1559/)
    expect(SERVER_INSTRUCTIONS).toMatch(/Omit fork to use Glamsterdam/)
    expect(SERVER_INSTRUCTIONS).toMatch(/testReleaseName/)
    expect(SERVER_INSTRUCTIONS).toMatch(/cite that snapshot once/)
    expect(SERVER_INSTRUCTIONS).not.toMatch(/run_amsterdam/)
  })
})
