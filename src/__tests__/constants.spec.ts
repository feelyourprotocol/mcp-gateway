import { describe, expect, it } from 'vitest'
import { QUERY_SHAPE_CATALOG } from '@feelyourprotocol/mcp-execution-engine'

import { TOOL_NAMES } from '../server/constants.js'

describe('MCP tool name join', () => {
  it('registers the same tool names the engine probe advertises', () => {
    expect([...TOOL_NAMES]).toEqual(QUERY_SHAPE_CATALOG.map((row) => row.mcpTool))
  })
})
