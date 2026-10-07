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

  it('shows fingerprint subtitle', async () => {
    const card = DEMO_CARDS.find((c) => c.id === 'distinct-fingerprints')!
    const wrapper = mount(MetricCard, {
      props: { card, window: '7d' },
      global: {
        stubs: { MetricChart: true },
      },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('unique for the whole window')
  })

  it('renders clients table', async () => {
    const card = DEMO_CARDS.find((c) => c.id === 'clients')!
    const wrapper = mount(MetricCard, {
      props: { card, window: '7d' },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('cursor-agent')
    expect(wrapper.text()).toContain('Sessions')
    expect(wrapper.text()).toContain('hosted HTTP server')
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
