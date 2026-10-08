import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import MetricCardGrid from '@/components/MetricCardGrid.vue'
import { DEMO_CARDS } from '@/fixtures/demoCatalog'
import { reorderVisiblePinnedIds, savePinnedCardIds } from '@/lib/pinnedCards'
import HomeView from '@/views/HomeView.vue'

describe('HomeView', () => {
  it('persists pin order after reorder', async () => {
    const pinnedCardIds = ref(['mcp-liveness-timeline', 'sessions', 'tool-calls', 'eip-numbers'])
    const reorderPinned = (from: number, to: number): void => {
      const catalog = new Set(DEMO_CARDS.map((c) => c.id))
      const next = reorderVisiblePinnedIds(pinnedCardIds.value, catalog, from, to)
      if (next === null) {
        return
      }
      pinnedCardIds.value = next
      savePinnedCardIds(next)
    }

    const wrapper = mount(HomeView, {
      global: {
        provide: {
          dashboardCards: ref(DEMO_CARDS),
          metricsWindow: ref('7d'),
          pinnedCardIds,
          togglePin: () => {},
          reorderPinned,
        },
        stubs: { MetricCard: { template: '<div />' } },
      },
    })
    await flushPromises()

    const grid = wrapper.findComponent(MetricCardGrid)
    await grid.vm.$emit('reorder', 0, 1)
    await wrapper.vm.$nextTick()

    expect(pinnedCardIds.value.slice(0, 2)).toEqual(['sessions', 'mcp-liveness-timeline'])
  })
})
