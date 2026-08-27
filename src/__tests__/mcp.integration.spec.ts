import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'

import {
  SERVER_NAME,
  TOOL_DESCRIBE_CAPABILITIES,
  TOOL_RUN_EVM_BYTECODE,
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
    expect(names).toContain(TOOL_RUN_EVM_BYTECODE)
    expect(names).toHaveLength(2)
    expect(tools.find((tool) => tool.name === TOOL_DESCRIBE_CAPABILITIES)?.description).toMatch(
      /Probe what this Feel Your Protocol MCP server supports/i,
    )
    expect(tools.find((tool) => tool.name === TOOL_RUN_EVM_BYTECODE)?.description).toMatch(
      /Run caller-supplied raw EVM bytecode/i,
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
      namedForks: { id: string; role?: string; aliases?: string[] }[]
      eips: {
        eip: number
        runnable?: boolean
        opcodes?: { name: string }[]
        summary?: string
        comparison?: { baselineForkId: string; previewForkId: string }
      }[]
      ceilings: { maxGasLimit: string }
    }

    expect(payload.engineVersion).toBe('0.1.0')
    expect(payload.baselineForkId).toBe('osaka')
    expect(payload.namedForks.some((fork) => fork.id === 'osaka' && fork.role === 'baseline')).toBe(
      true,
    )
    expect(payload.namedForks.some((fork) => fork.id === 'amsterdam')).toBe(true)
    const amsterdam = payload.namedForks.find((fork) => fork.id === 'amsterdam')
    expect(amsterdam?.aliases).toContain('glamsterdam')
    expect(payload.eips).toHaveLength(1)
    expect(payload.eips[0]?.eip).toBe(8024)
    expect(payload.eips[0]?.runnable).toBe(true)
    expect(payload.eips[0]?.summary).toMatch(/Amsterdam/)
    expect(payload.eips[0]?.comparison?.baselineForkId).toBe('osaka')
    expect(payload.eips[0]?.opcodes?.some((op) => op.name === 'DUPN')).toBe(true)
    expect(BigInt(payload.ceilings.maxGasLimit)).toBe(30_000_000n)
  })

  it('runs PUSH1 STOP via run_evm_bytecode', async () => {
    client = await connectClient()
    const input = readEngineLabInput('simulate', '01-push1-stop')
    const result = await client.callTool(
      {
        name: TOOL_RUN_EVM_BYTECODE,
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
        forkConfig: { baseHardfork: string }
      }
      steps?: { op: string }[]
    }

    expect(payload.success).toBe(true)
    expect(BigInt(payload.gasUsed)).toBeGreaterThan(0n)
    expect(payload.provenance.engineVersion).toBe('0.1.0')
    expect(payload.provenance.forkConfig.baseHardfork).toBe('amsterdam')
    expect(payload.steps?.[0]?.op).toBe('PUSH1')
  })

  it('runs DUPN on osaka baseline and fails with invalid opcode', async () => {
    client = await connectClient()
    const input = readEngineLabInput('simulate', '02-dupn-amsterdam')
    const result = await client.callTool(
      {
        name: TOOL_RUN_EVM_BYTECODE,
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

  it('runs DUPN amsterdam via run_evm_bytecode', async () => {
    client = await connectClient()
    const input = readEngineLabInput('simulate', '02-dupn-amsterdam')
    const result = await client.callTool(
      {
        name: TOOL_RUN_EVM_BYTECODE,
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

  it('returns MCP error for invalid run_evm_bytecode input', async () => {
    client = await connectClient()
    const result = await client.callTool(
      {
        name: TOOL_RUN_EVM_BYTECODE,
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
        name: TOOL_RUN_EVM_BYTECODE,
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
        name: TOOL_RUN_EVM_BYTECODE,
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
        name: TOOL_RUN_EVM_BYTECODE,
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

  return nextClient
}
