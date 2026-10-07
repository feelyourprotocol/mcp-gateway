import { describe, expect, it } from 'vitest'

import { DEMO_CARDS } from '@/fixtures/demoCatalog'
import { demoQueryForCard } from '@/fixtures/demoQueries'
import { axisTooltipTotal, headlineValue, toChartOption } from '@/lib/toChartOption'

describe('toChartOption', () => {
  it('builds series for each tool name including artifact tools', () => {
    const card = DEMO_CARDS.find((c) => c.id === 'tool-calls')!
    const result = demoQueryForCard(card, '7d', 'day')
    const option = toChartOption(card, result)
    const series = option.series as { name: string }[]
    const names = series.map((s) => s.name).sort()
    expect(names).toContain('run_bytecode')
    expect(names).toContain('describe_capabilities')
    expect(names).toContain('generate_artifact')
    expect(names).toContain('inspect_artifact')
    expect(names).not.toContain('total')
  })

  it('uses summary for headline not bucket sum', () => {
    const card = DEMO_CARDS.find((c) => c.id === 'distinct-fingerprints')!
    const result = demoQueryForCard(card, '7d', 'day')
    const bucketSum = result.series.reduce((sum, row) => sum + row.value, 0)
    expect(headlineValue(result, card)).toBe(String(result.summary))
    expect(result.summary).not.toBe(bucketSum)
  })

  it('returns zero headline for empty revenue card', () => {
    const card = DEMO_CARDS.find((c) => c.id === 'revenue-over-time')!
    const result = demoQueryForCard(card, '7d', 'day')
    expect(headlineValue(result, card)).toBe('0.00')
  })

  it('computes axis tooltip total from visible series', () => {
    const card = DEMO_CARDS.find((c) => c.id === 'tool-calls')!
    const result = demoQueryForCard(card, '7d', 'day')
    const bucket = result.series[0]!.bucketStart
    const names = [...new Set(result.series.map((row) => row.series))].filter((n) => n !== 'value')
    const total = axisTooltipTotal(result, bucket, names)
    expect(total).toBeGreaterThan(0)
  })
})
