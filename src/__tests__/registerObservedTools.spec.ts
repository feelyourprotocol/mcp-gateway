import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

import { TOOL_NAMES } from '../server/constants.js'

describe('registerObservedTool coverage', () => {
  it('every TOOL_NAMES entry is registered via registerObservedTool', () => {
    const toolDir = new URL('../tools/', import.meta.url)
    const files = fs.readdirSync(toolDir).filter((name) => name.endsWith('.ts'))
    const sources = files.map((name) => fs.readFileSync(new URL(name, toolDir), 'utf8')).join('\n')

    for (const toolName of TOOL_NAMES) {
      expect(sources).toContain(toolName)
    }
    expect(sources.match(/registerObservedTool/g)?.length).toBeGreaterThanOrEqual(TOOL_NAMES.length)
  })
})
