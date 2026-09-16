import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'

import {
  SERVER_NAME,
  TOOL_DESCRIBE_CAPABILITIES,
  TOOL_GENERATE,
  TOOL_INSPECT,
  TOOL_RUN_BLOCK,
  TOOL_RUN_BYTECODE,
  TOOL_RUN_TRANSACTION,
} from '../server/constants.js'
import { EXCHANGE_AMSTERDAM_BYTECODE, extractTextContent, readEngineLabInput } from './helpers.js'

const gatewayRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const serverEntry = path.join(gatewayRoot, 'dist/index.js')

describe('MCP gateway (stdio integration)', () => {
  let client: Client | undefined

  afterEach(async () => {
    await client?.close()
    client = undefined
  })

  it('lists gateway tools', async () => {
    client = await connectClient()
    const { tools } = await client.listTools()
    const names = tools.map((tool) => tool.name)

    expect(names).toContain(TOOL_DESCRIBE_CAPABILITIES)
    expect(names).toContain(TOOL_RUN_BYTECODE)
    expect(names).toContain(TOOL_RUN_TRANSACTION)
    expect(names).toContain(TOOL_RUN_BLOCK)
    expect(names).toContain(TOOL_GENERATE)
    expect(names).toContain(TOOL_INSPECT)
    expect(names).toHaveLength(6)
    expect(tools.find((tool) => tool.name === TOOL_DESCRIBE_CAPABILITIES)?.description).toMatch(
      /Berlin→Amsterdam lineage/i,
    )
    expect(tools.find((tool) => tool.name === TOOL_RUN_BYTECODE)?.description).toMatch(
      /generic hardfork runs/i,
    )
    expect(tools.find((tool) => tool.name === TOOL_RUN_TRANSACTION)?.description).toMatch(
      /any lineage fork/i,
    )
    expect(tools.find((tool) => tool.name === TOOL_RUN_BLOCK)?.description).toMatch(
      /any lineage fork/i,
    )
  })

  it('returns capability registry via describe_capabilities', async () => {
    client = await connectClient()
    const result = await client.callTool(
      {
        name: TOOL_DESCRIBE_CAPABILITIES,
        arguments: {},
      },
      CallToolResultSchema,
    )

    expect(result.isError).not.toBe(true)

    const payload = JSON.parse(extractTextContent(result)) as {
      engineVersion: string
      baselineForkId: string
      namedForks: {
        id: string
        role?: string
        aliases?: string[]
        summary?: string
        relatedEips?: number[]
        plannedEips?: number[]
        shapes?: string[]
      }[]
      eips: {
        eip: number
        runnable?: boolean
        opcodes?: { name: string }[]
        summary?: string
        shapes?: string[]
        comparison?: { baselineForkId: string; previewForkId: string }
      }[]
      ceilings: { maxGasLimit: string }
    }

    expect(payload.engineVersion).toBe('0.1.0')
    expect(payload.baselineForkId).toBe('osaka')
    expect(payload.namedForks.some((fork) => fork.id === 'osaka' && fork.role === 'current')).toBe(
      true,
    )
    expect(
      payload.namedForks.some((fork) => fork.id === 'paris' && fork.role === 'historical'),
    ).toBe(true)
    expect(payload.namedForks.some((fork) => fork.id === 'prague')).toBe(true)
    expect(payload.namedForks.some((fork) => fork.id === 'amsterdam')).toBe(true)
    const amsterdam = payload.namedForks.find((fork) => fork.id === 'amsterdam')
    expect(amsterdam?.aliases).toContain('glamsterdam')
    expect(amsterdam?.summary).toMatch(/You do not need to name an EIP/i)
    expect(amsterdam?.relatedEips).toEqual([7708, 7843, 7928, 8024, 8037, 8038])
    expect(amsterdam?.plannedEips).toBeUndefined()
    expect(amsterdam?.shapes).toEqual(['simulate', 'transaction', 'block'])
    expect(payload.eips).toHaveLength(9)
    expect(payload.eips.some((e) => e.eip === 7702 && e.shapes?.includes('transaction'))).toBe(true)
    expect(payload.eips.some((e) => e.eip === 7928)).toBe(true)
    expect(payload.eips.some((e) => e.eip === 8037)).toBe(true)
    expect(payload.eips.some((e) => e.eip === 8038)).toBe(true)
    expect(payload.eips.some((e) => e.eip === 7843)).toBe(true)
    const e7843 = payload.eips.find((e) => e.eip === 7843)
    expect(e7843?.runnable).toBe(true)
    expect(e7843?.shapes).toEqual(['block'])
    expect(e7843?.opcodes?.some((op) => op.name === 'SLOTNUM')).toBe(true)
    const e8024 = payload.eips.find((e) => e.eip === 8024)
    expect(e8024?.runnable).toBe(true)
    expect(e8024?.summary).toMatch(/Amsterdam/)
    expect(e8024?.comparison?.baselineForkId).toBe('osaka')
    expect(e8024?.opcodes?.some((op) => op.name === 'DUPN')).toBe(true)
    const e7708 = payload.eips.find((e) => e.eip === 7708)
    expect(e7708?.runnable).toBe(true)
    expect(e7708?.comparison?.previewForkId).toBe('amsterdam')
    expect(payload.eips.find((e) => e.eip === 8037)?.shapes).toEqual(
      expect.arrayContaining(['transaction']),
    )
    expect(payload.eips.some((e) => e.eip === 7883)).toBe(true)
    expect(payload.eips.some((e) => e.eip === 7951)).toBe(true)
    expect(BigInt(payload.ceilings.maxGasLimit)).toBe(30_000_000n)
  })

  it('runs PUSH1 STOP via run_bytecode', async () => {
    client = await connectClient()
    const input = readEngineLabInput('simulate', '01-push1-stop')
    const result = await client.callTool(
      {
        name: TOOL_RUN_BYTECODE,
        arguments: { ...input },
      },
      CallToolResultSchema,
    )

    expect(result.isError).not.toBe(true)

    const payload = JSON.parse(extractTextContent(result)) as {
      success: boolean
      gasUsed: string
      provenance: {
        engineVersion: string
        forkConfig: { baseHardfork: string; eips?: number[] }
        perEip?: { eip: number }[]
        caveat?: string
      }
      steps?: { op: string }[]
    }

    expect(payload.success).toBe(true)
    expect(BigInt(payload.gasUsed)).toBeGreaterThan(0n)
    expect(payload.provenance.engineVersion).toBe('0.1.0')
    expect(payload.provenance.forkConfig.baseHardfork).toBe('amsterdam')
    expect(payload.provenance.forkConfig.eips).toEqual([])
    expect(payload.provenance.perEip?.map((entry) => entry.eip)).toEqual([
      7708, 7843, 7928, 8024, 8037, 8038,
    ])
    expect(payload.provenance.caveat).toMatch(/advertised modules/)
    expect(payload.steps?.[0]?.op).toBe('PUSH1')
  })

  it('runs DUPN on osaka baseline and fails with invalid opcode', async () => {
    client = await connectClient()
    const input = readEngineLabInput('simulate', '02-dupn-amsterdam')
    const result = await client.callTool(
      {
        name: TOOL_RUN_BYTECODE,
        arguments: {
          ...input,
          fork: { baseHardfork: 'osaka', eips: [] },
        },
      },
      CallToolResultSchema,
    )

    expect(result.isError).not.toBe(true)

    const payload = JSON.parse(extractTextContent(result)) as {
      success: boolean
      error: string | null
      provenance: { forkConfig: { baseHardfork: string }; stabilityRollup?: string }
    }

    expect(payload.success).toBe(false)
    expect(payload.error).toMatch(/invalid/i)
    expect(payload.provenance.forkConfig.baseHardfork).toBe('osaka')
    expect(payload.provenance.stabilityRollup).toBe('firm')
  })

  it('runs DUPN amsterdam via run_bytecode', async () => {
    client = await connectClient()
    const input = readEngineLabInput('simulate', '02-dupn-amsterdam')
    const result = await client.callTool(
      {
        name: TOOL_RUN_BYTECODE,
        arguments: { ...input },
      },
      CallToolResultSchema,
    )

    expect(result.isError).not.toBe(true)

    const payload = JSON.parse(extractTextContent(result)) as {
      success: boolean
      finalStack: string[]
      steps?: { op: string }[]
    }

    expect(payload.success).toBe(true)
    expect(payload.finalStack.slice(0, 3)).toEqual(['0x1', '0x11', '0x10'])
    expect(payload.steps?.some((step) => step.op === 'DUPN')).toBe(true)
  })

  it('returns MCP error for invalid run_bytecode input', async () => {
    client = await connectClient()
    const result = await client.callTool(
      {
        name: TOOL_RUN_BYTECODE,
        arguments: { bytecode: '' },
      },
      CallToolResultSchema,
    )

    expect(result.isError).toBe(true)
    expect(extractTextContent(result)).toMatch(/bytecode/i)
  })

  it('simulates EIP-8024 EXCHANGE under amsterdam with trace', async () => {
    client = await connectClient()
    const result = await client.callTool(
      {
        name: TOOL_RUN_BYTECODE,
        arguments: {
          bytecode: EXCHANGE_AMSTERDAM_BYTECODE,
          fork: { baseHardfork: 'amsterdam', eips: [] },
          trace: true,
        },
      },
      CallToolResultSchema,
    )

    expect(result.isError).not.toBe(true)

    const payload = JSON.parse(extractTextContent(result)) as {
      success: boolean
      gasUsed: string
      finalStack: string[]
      provenance: { forkConfig: { baseHardfork: string } }
      steps?: { op: string }[]
    }

    expect(payload.success).toBe(true)
    expect(BigInt(payload.gasUsed)).toBeGreaterThan(0n)
    expect(payload.provenance.forkConfig.baseHardfork).toBe('amsterdam')
    expect(payload.finalStack).toHaveLength(4)
    expect(new Set(payload.finalStack)).toEqual(new Set(['0x1', '0x2', '0x3', '0x4']))
    expect(payload.steps?.some((step) => step.op === 'EXCHANGE')).toBe(true)
  })

  it('returns MCP error for unsupported hardfork via engine', async () => {
    client = await connectClient()
    const result = await client.callTool(
      {
        name: TOOL_RUN_BYTECODE,
        arguments: {
          bytecode: '0x600100',
          fork: { baseHardfork: 'not-a-real-fork', eips: [] },
        },
      },
      CallToolResultSchema,
    )

    expect(result.isError).toBe(true)
    expect(extractTextContent(result)).toMatch(/unsupported_hardfork/i)
  })

  it('returns execution failure in payload for shallow DUPN stack underflow', async () => {
    client = await connectClient()
    const result = await client.callTool(
      {
        name: TOOL_RUN_BYTECODE,
        arguments: {
          bytecode: '0x600160026003e68000',
          fork: { baseHardfork: 'amsterdam', eips: [] },
        },
      },
      CallToolResultSchema,
    )

    expect(result.isError).not.toBe(true)

    const payload = JSON.parse(extractTextContent(result)) as {
      success: boolean
      error: string | null
      provenance: { engineVersion: string }
    }

    expect(payload.success).toBe(false)
    expect(payload.error).toMatch(/stack/i)
    expect(payload.provenance.engineVersion).toBe('0.1.0')
  })

  it('runs a first-touch value transfer via run_transaction', async () => {
    client = await connectClient()
    const result = await client.callTool(
      {
        name: TOOL_RUN_TRANSACTION,
        arguments: {
          from: '0x00000000000000000000000000000000000000ee',
          to: '0x00000000000000000000000000000000000000aa',
          value: '1',
          fork: { baseHardfork: 'amsterdam' },
        },
      },
      CallToolResultSchema,
    )

    expect(result.isError).not.toBe(true)

    const payload = JSON.parse(extractTextContent(result)) as {
      success: boolean
      gasUsed: string
      gasUsedScope: string
      txStateGas?: string
    }

    expect(payload.success).toBe(true)
    expect(payload.gasUsedScope).toBe('transaction')
    expect(payload.gasUsed).toBe('204600')
    expect(payload.txStateGas).toBe('183600')
  })

  it('runs a first-touch value transfer via run_block', async () => {
    client = await connectClient()
    const input = readEngineLabInput('block', '01-first-touch')
    const result = await client.callTool(
      {
        name: TOOL_RUN_BLOCK,
        arguments: { ...input },
      },
      CallToolResultSchema,
    )

    expect(result.isError).not.toBe(true)

    const payload = JSON.parse(extractTextContent(result)) as {
      success: boolean
      gasUsedScope: string
      header: { number: string; gasUsed: string }
      transactions: { gasUsed: string; txStateGas?: string }[]
    }

    expect(payload.success).toBe(true)
    expect(payload.gasUsedScope).toBe('block')
    expect(payload.header.number).toBe('1')
    expect(payload.transactions).toHaveLength(1)
    expect(payload.transactions[0]?.gasUsed).toBe('204600')
    expect(payload.transactions[0]?.txStateGas).toBe('183600')
  })

  it('generates BAL JSON on Amsterdam via generate', async () => {
    client = await connectClient()
    const result = await client.callTool(
      {
        name: TOOL_GENERATE,
        arguments: {
          fork: { baseHardfork: 'amsterdam' },
          transactions: [
            {
              from: '0xb6e610921b0a0f6f608c0e1f29a845552bc6db2c',
              to: '0x16abcdab9880c2d58230998de45c493c478dc0d8',
              value: '1',
            },
          ],
          accounts: [
            {
              address: '0xb6e610921b0a0f6f608c0e1f29a845552bc6db2c',
              balance: '1000000000000000000',
            },
          ],
        },
      },
      CallToolResultSchema,
    )

    expect(result.isError).not.toBe(true)
    const payload = JSON.parse(extractTextContent(result)) as {
      success: boolean
      artifactKind: string
      hash: string
      bal: unknown[]
    }
    expect(payload.success).toBe(true)
    expect(payload.artifactKind).toBe('block-access-list')
    expect(payload.hash).toMatch(/^0x/i)
    expect(payload.bal.length).toBeGreaterThan(0)
  })

  it('returns MCP error for an empty run_block transaction list', async () => {
    client = await connectClient()
    const result = await client.callTool(
      {
        name: TOOL_RUN_BLOCK,
        arguments: { transactions: [] },
      },
      CallToolResultSchema,
    )

    expect(result.isError).toBe(true)
    expect(extractTextContent(result)).toMatch(/transaction/i)
  })
})

async function connectClient(): Promise<Client> {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverEntry],
    cwd: gatewayRoot,
    stderr: 'pipe',
  })

  const nextClient = new Client({ name: 'fyp-gateway-test', version: '1.0.0' })
  await nextClient.connect(transport)

  const serverInfo = nextClient.getServerVersion()
  expect(serverInfo?.name).toBe(SERVER_NAME)
  expect(nextClient.getInstructions()).toMatch(/even if they do not name an EIP/i)

  return nextClient
}
