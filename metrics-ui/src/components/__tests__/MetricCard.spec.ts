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
    await wrapper.get('[aria-label="About the scale"]').trigger('click')
    expect(wrapper.text()).toContain('Hour, Day, and Week redraw the chart')
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
    expect(wrapper.text()).toContain('Client / Versions')
    expect(wrapper.text()).toContain('cursor-agent')
    expect(wrapper.text()).toContain('claude-code')
    const versionRows = wrapper.findAll('tbody tr')
    expect(versionRows.length).toBeGreaterThan(2)
    expect(wrapper.get('p.font-mono').text()).toBe(String(versionRows.length))
    const cursorVersions = versionRows.filter((row) => row.text().includes('cursor-agent'))
    expect(cursorVersions.length).toBeGreaterThan(1)
    await wrapper.get('button[aria-pressed="false"]').trigger('click')
    const clientRows = wrapper.findAll('tbody tr')
    expect(clientRows.length).toBeLessThan(versionRows.length)
    expect(wrapper.get('p.font-mono').text()).toBe(String(clientRows.length))
    expect(clientRows.filter((row) => row.text().includes('cursor-agent'))).toHaveLength(1)
    expect(wrapper.find('.h-64.overflow-hidden').exists()).toBe(true)
  })

  it('renders the liveness timeline as a line chart on day grain', async () => {
    const card = DEMO_CARDS.find((c) => c.id === 'mcp-liveness-timeline')!
    const wrapper = mount(MetricCard, {
      props: { card, window: '7d' },
      global: {
        stubs: { MetricChart: { template: '<div data-test="uptime-line" />' } },
      },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('%')
    expect(wrapper.text()).toContain('day')
    expect(wrapper.find('[data-test="uptime-line"]').exists()).toBe(true)
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
