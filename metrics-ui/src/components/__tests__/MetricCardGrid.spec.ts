import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { DEMO_CARDS } from '@/fixtures/demoCatalog'
import MetricCardGrid from '@/components/MetricCardGrid.vue'

describe('MetricCardGrid', () => {
  it('emits reorder when move down is clicked', async () => {
    const cards = DEMO_CARDS.filter((c) => ['mcp-liveness-timeline', 'sessions'].includes(c.id))
    const wrapper = mount(MetricCardGrid, {
      props: { cards, window: '7d', reorderable: true },
      global: {
        stubs: {
          MetricCard: {
            template: '<div class="metric-stub">{{ card.title }}</div>',
            props: ['card'],
          },
        },
      },
    })
    await flushPromises()
    const downButtons = wrapper.findAll('[aria-label="Move down"]')
    expect(downButtons.length).toBe(2)
    await downButtons[0]!.trigger('click')
    expect(wrapper.emitted('reorder')).toEqual([[0, 1]])
  })

  it('emits reorder on drop after drag', async () => {
    const cards = DEMO_CARDS.filter((c) => ['sessions', 'tool-calls'].includes(c.id))
    const wrapper = mount(MetricCardGrid, {
      props: { cards, window: '7d', reorderable: true },
      global: {
        stubs: { MetricCard: true },
      },
    })
    const handle = wrapper.find('[aria-label="Drag to reorder"]')
    await handle.trigger('dragstart', {
      dataTransfer: { setData: () => {}, effectAllowed: '' },
    })
    const rows = wrapper.findAll('.grid > div')
    await rows[1]!.trigger('drop', { preventDefault: () => {} })
    expect(wrapper.emitted('reorder')).toEqual([[0, 1]])
  })
})
