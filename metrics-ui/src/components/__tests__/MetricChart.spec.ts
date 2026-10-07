import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import MetricChart from '@/components/MetricChart.vue'
import { DEMO_CARDS } from '@/fixtures/demoCatalog'
import { demoQueryForCard } from '@/fixtures/demoQueries'

vi.mock('vue-echarts', () => ({
  default: {
    name: 'VChart',
    props: ['option'],
    template: '<div data-test="chart-stub" />',
  },
}))

describe('MetricChart', () => {
  it('keeps every tool name in the chart legend without paging', () => {
    const card = DEMO_CARDS.find((c) => c.id === 'tool-calls')!
    const wrapper = mount(MetricChart, {
      props: { card, result: demoQueryForCard(card, '7d', 'day') },
    })
    const option = wrapper.getComponent({ name: 'VChart' }).props('option') as {
      legend: { type?: string; data?: string[] }[]
    }
    const names = option.legend.flatMap((row) => row.data ?? [])
    expect(names).toEqual([
      'describe_capabilities',
      'generate_artifact',
      'inspect_artifact',
      'run_block',
      'run_bytecode',
      'run_transaction',
    ])
    expect(option.legend.every((row) => row.type === 'plain')).toBe(true)
    expect(wrapper.find('li').exists()).toBe(false)
  })
})
