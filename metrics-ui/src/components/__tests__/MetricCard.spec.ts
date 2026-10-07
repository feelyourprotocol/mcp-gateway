import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { DEMO_CARDS } from '@/fixtures/demoCatalog'
import MetricCard from '@/components/MetricCard.vue'

describe('MetricCard', () => {
  it('renders title and tool legend after load', async () => {
    const card = DEMO_CARDS.find((c) => c.id === 'tool-calls')!
    const wrapper = mount(MetricCard, {
      props: { card, window: '7d' },
      global: {
        stubs: { MetricChart: { template: '<div data-test="chart-stub" />' } },
      },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Tool usage')
    expect(wrapper.find('[data-card-id="tool-calls"]').exists()).toBe(true)
  })

  it('shows help text after clicking the info control', async () => {
    const card = DEMO_CARDS.find((c) => c.id === 'distinct-fingerprints')!
    const wrapper = mount(MetricCard, {
      props: { card, window: '7d' },
      global: {
        stubs: { MetricChart: true },
      },
    })
    await flushPromises()
    expect(wrapper.text()).not.toContain('distinct fingerprints across')
    await wrapper.get('[aria-label="About this metric"]').trigger('click')
    expect(wrapper.text()).toContain('distinct fingerprints across')
  })

  it('renders clients table with scroll container', async () => {
    const card = DEMO_CARDS.find((c) => c.id === 'clients')!
    const wrapper = mount(MetricCard, {
      props: { card, window: '7d' },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('cursor-agent')
    expect(wrapper.find('.h-64.overflow-hidden').exists()).toBe(true)
  })

  it('shows empty hint for revenue card', async () => {
    const card = DEMO_CARDS.find((c) => c.id === 'revenue-over-time')!
    const wrapper = mount(MetricCard, {
      props: { card, window: '7d' },
      global: {
        stubs: { MetricChart: true },
      },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('No USDC recorded yet')
  })
})
