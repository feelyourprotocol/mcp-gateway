import { describe, expect, it } from 'vitest'

import { reorderPinnedCardIds, reorderVisiblePinnedIds } from '@/lib/pinnedCards'

describe('pinnedCards reorder', () => {
  it('moves an item within the list', () => {
    expect(reorderPinnedCardIds(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    expect(reorderPinnedCardIds(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })

  it('returns null for invalid indices', () => {
    expect(reorderPinnedCardIds(['a'], 0, 2)).toBeNull()
    expect(reorderPinnedCardIds(['a'], -1, 0)).toBeNull()
  })

  it('reorders visible pins and keeps unknown ids at the end', () => {
    const catalog = new Set(['sessions', 'tool-calls', 'eip-numbers'])
    const next = reorderVisiblePinnedIds(
      ['mcp-liveness-timeline', 'gone-card', 'sessions', 'tool-calls'],
      catalog,
      0,
      1,
    )
    expect(next).toEqual(['tool-calls', 'sessions', 'mcp-liveness-timeline', 'gone-card'])
  })
})
