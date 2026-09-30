import { describe, expect, it } from 'vitest'

import { DEMO_CARDS } from '@/fixtures/demoCatalog'
import { demoQueryForCard } from '@/fixtures/demoQueries'
import { headlineValue, toChartOption } from '@/lib/toChartOption'

describe('toChartOption', () => {
  it('builds series for each tool name', () => {
    const card = DEMO_CARDS.find((c) => c.id === 'tool-calls')!
    const result = demoQueryForCard(card, '7d', 'day')
    const option = toChartOption(card, result)
    const series = option.series as { name: string }[]
    const names = series.map((s) => s.name).sort()
    expect(names).toContain('run_bytecode')
    expect(names).toContain('describe_capabilities')
  })

  it('returns zero headline for empty revenue card', () => {
    const card = DEMO_CARDS.find((c) => c.id === 'revenue-over-time')!
    const result = demoQueryForCard(card, '7d', 'day')
    expect(headlineValue(result, card)).toBe('0.00')
  })
})
