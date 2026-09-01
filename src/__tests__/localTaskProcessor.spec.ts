import { describe, expect, it } from 'vitest'
import { ENGINE_CEILINGS, EngineError } from '@feelyourprotocol/mcp-execution-engine'

import { LocalTaskProcessor } from '../engine/LocalTaskProcessor.js'
import { readEngineLabInput } from './helpers.js'

describe('LocalTaskProcessor', () => {
  const processor = new LocalTaskProcessor()

  it('probe returns capability registry snapshot', async () => {
    const result = (await processor.submit({ kind: 'probe' })) as {
      engineVersion: string
      baselineForkId: string
      namedForks: { id: string }[]
      eips: { eip: number }[]
    }

    expect(result.engineVersion).toBe('0.1.0')
    expect(result.baselineForkId).toBe('osaka')
    expect(result.namedForks.some((fork) => fork.id === 'prague')).toBe(true)
    expect(result.namedForks.some((fork) => fork.id === 'osaka')).toBe(true)
    expect(result.namedForks.some((fork) => fork.id === 'amsterdam')).toBe(true)
    expect(result.eips).toHaveLength(4)
    expect(result.eips.map((e) => e.eip).sort()).toEqual([7708, 7883, 7951, 8024])
  })

  it('simulate runs PUSH1 STOP lab fixture', async () => {
    const input = readEngineLabInput('simulate', '01-push1-stop')
    const result = (await processor.submit({
      kind: 'simulate',
      payload: input,
    })) as {
      success: boolean
      gasUsed: string
      provenance: { engineVersion: string }
      steps?: { op: string }[]
    }

    expect(result.success).toBe(true)
    expect(BigInt(result.gasUsed)).toBeGreaterThan(0n)
    expect(result.provenance.engineVersion).toBe('0.1.0')
    expect(result.steps?.[0]?.op).toBe('PUSH1')
  })

  it('simulate runs DUPN amsterdam lab fixture', async () => {
    const input = readEngineLabInput('simulate', '02-dupn-amsterdam')
    const result = (await processor.submit({
      kind: 'simulate',
      payload: input,
    })) as {
      success: boolean
      finalStack: string[]
      steps?: { op: string }[]
    }

    expect(result.success).toBe(true)
    expect(result.finalStack.slice(0, 3)).toEqual(['0x1', '0x11', '0x10'])
    expect(result.steps?.some((step) => step.op === 'DUPN')).toBe(true)
  })

  it('simulate propagates EngineError for bytecode above size ceiling', async () => {
    const huge = '0x' + '00'.repeat(ENGINE_CEILINGS.maxBytecodeBytes + 1)

    await expect(
      processor.submit({
        kind: 'simulate',
        payload: { bytecode: huge, fork: { baseHardfork: 'amsterdam' } },
      }),
    ).rejects.toThrow(EngineError)
  })

  it('simulate propagates EngineError for unsupported hardfork', async () => {
    await expect(
      processor.submit({
        kind: 'simulate',
        payload: {
          bytecode: '0x600100',
          fork: { baseHardfork: 'not-a-real-fork', eips: [] },
        },
      }),
    ).rejects.toThrow(EngineError)
  })
})
