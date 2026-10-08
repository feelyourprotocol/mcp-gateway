import { describe, expect, it } from 'vitest'

import {
  aggregateErrorStats,
  filterErrorRows,
  groupErrorsByTool,
  paginateRows,
} from '@/lib/errorListModel'
import type { ErrorEventRow } from '@/types/errors'

const sample: ErrorEventRow[] = [
  {
    id: 1,
    ts: 1,
    tool: 'run_bytecode',
    forkId: null,
    eips: [],
    diagnostic: { code: 'invalid_bytecode', message: 'a' },
  },
  {
    id: 2,
    ts: 2,
    tool: 'run_bytecode',
    forkId: null,
    eips: [],
    diagnostic: { code: 'invalid_bytecode', message: 'b' },
  },
  {
    id: 3,
    ts: 3,
    tool: 'run_transaction',
    forkId: null,
    eips: [],
    diagnostic: { code: 'invalid_gas_limit', message: 'c' },
  },
]

describe('errorListModel', () => {
  it('aggregates by tool and code', () => {
    const stats = aggregateErrorStats(sample, { totalInWindow: 10, truncated: true })
    expect(stats.totalLoaded).toBe(3)
    expect(stats.totalInWindow).toBe(10)
    expect(stats.truncated).toBe(true)
    expect(stats.byTool[0]).toEqual({ key: 'run_bytecode', count: 2 })
    expect(stats.byCode[0]).toEqual({ key: 'invalid_bytecode', count: 2 })
  })

  it('filters by tool and code', () => {
    const filtered = filterErrorRows(sample, { tool: 'run_bytecode', code: 'invalid_bytecode' })
    expect(filtered).toHaveLength(2)
  })

  it('paginates', () => {
    const page = paginateRows(sample, 1, 2)
    expect(page.rows).toHaveLength(2)
    expect(page.totalPages).toBe(2)
  })

  it('groups by tool descending count', () => {
    const groups = groupErrorsByTool(sample)
    expect(groups[0]?.tool).toBe('run_bytecode')
    expect(groups[0]?.rows).toHaveLength(2)
  })
})
