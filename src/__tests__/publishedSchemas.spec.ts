import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { TOOL_NAMES } from '../server/constants.js'

const gatewayRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const schemasDir = path.join(gatewayRoot, 'schemas')
const manifestPath = path.join(schemasDir, 'manifest.json')

type SchemaManifest = {
  tools: Record<string, string>
}

function readManifest(): SchemaManifest {
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as SchemaManifest
}

function websitePublishedSchemasDir(): string | undefined {
  const candidate = path.resolve(gatewayRoot, '../website/mcp-docs/public/schemas')
  try {
    readdirSync(candidate)
    return candidate
  } catch {
    return undefined
  }
}

describe('published MCP input JSON schemas', () => {
  const manifest = readManifest()
  const manifestTools = Object.keys(manifest.tools).sort()
  const manifestFiles = Object.values(manifest.tools).sort()

  it('lists every registered MCP tool', () => {
    expect(manifestTools).toEqual([...TOOL_NAMES].sort())
  })

  it('covers every *.input.json in schemas/ (excluding manifest)', () => {
    const onDisk = readdirSync(schemasDir)
      .filter((name) => name.endsWith('.input.json'))
      .sort()
    expect(onDisk).toEqual(manifestFiles)
  })

  it('uses mcp-docs $id URLs on each published schema', () => {
    for (const fileName of manifestFiles) {
      const doc = JSON.parse(readFileSync(path.join(schemasDir, fileName), 'utf8')) as {
        $id?: string
      }
      expect(doc.$id).toBe(`https://mcp-docs.feelyourprotocol.org/schemas/${fileName}`)
    }
  })

  it.each(manifestFiles)(
    'matches website copy of %s when the sibling checkout exists',
    (fileName) => {
      const websiteDir = websitePublishedSchemasDir()
      if (websiteDir === undefined) {
        return
      }

      const gatewayText = readFileSync(path.join(schemasDir, fileName), 'utf8')
      const websiteText = readFileSync(path.join(websiteDir, fileName), 'utf8')
      expect(websiteText).toBe(gatewayText)
    },
  )
})
