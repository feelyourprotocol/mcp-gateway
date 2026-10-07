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
    const legends = option.legend as { type?: string; data?: string[] }[]
    expect(Array.isArray(legends)).toBe(true)
    expect(legends.every((row) => row.type === 'plain')).toBe(true)
    expect(legends.flatMap((row) => row.data ?? []).sort()).toEqual(names)
    expect(legends.length).toBeGreaterThan(1)
    expect(legends.every((row) => (row.data ?? []).length <= 2)).toBe(true)
  })

  it('uses summary for headline not bucket sum', () => {
    const card = DEMO_CARDS.find((c) => c.id === 'distinct-fingerprints')!
    const result = demoQueryForCard(card, '7d', 'day')
    const bucketSum = result.series.reduce((sum, row) => sum + row.value, 0)
    expect(headlineValue(result, card)).toBe(String(result.summary))
    expect(result.summary).not.toBe(bucketSum)
  })

  it('draws the liveness timeline as one line on a 0–100 scale', () => {
    const card = DEMO_CARDS.find((c) => c.id === 'mcp-liveness-timeline')!
    const result = demoQueryForCard(card, '7d', 'day')
    const option = toChartOption(card, result)
    const series = option.series as { type: string; data: number[] }[]
    const yAxis = option.yAxis as { min: number; max: number }
    expect(series).toHaveLength(1)
    expect(series[0]?.type).toBe('line')
    expect(series[0]?.data.some((value) => value < 80)).toBe(true)
    expect(series[0]?.data.some((value) => value === 100)).toBe(true)
    expect(yAxis.min).toBe(0)
    expect(yAxis.max).toBe(100)
  })

  it('plots the single session series', () => {
    const card = DEMO_CARDS.find((c) => c.id === 'sessions')!
    const result = demoQueryForCard(card, '7d', 'day')
    const option = toChartOption(card, result)
    const series = option.series as { data: number[] }[]
    expect(series).toHaveLength(1)
    expect(series[0]?.data.length).toBeGreaterThan(1)
  })

  it('formats uptime headline with one decimal', () => {
    const card = DEMO_CARDS.find((c) => c.id === 'mcp-liveness-timeline')!
    const result = demoQueryForCard(card, '7d', 'day')
    expect(headlineValue(result, card)).toBe(result.summary.toFixed(1))
  })

  it('returns zero headline for empty revenue card', () => {
    const card = DEMO_CARDS.find((c) => c.id === 'revenue-over-time')!
    const result = demoQueryForCard(card, '7d', 'day')
    expect(headlineValue(result, card)).toBe('0.00')
  })

  it('aligns stacked bar slot counts and category gap', () => {
    const ids = ['tool-calls', 'hardforks', 'eip-numbers', 'tool-errors', 'settlement-mix']
    const lengths = ids.map((id) => {
      const card = DEMO_CARDS.find((c) => c.id === id)!
      const option = toChartOption(card, demoQueryForCard(card, '7d', 'hour'))
      const series = option.series as { data: number[]; barCategoryGap?: string; barGap?: string }[]
      expect(series.length).toBeGreaterThan(0)
      expect(series.every((row) => row.barCategoryGap === '30%' && row.barGap === '0%')).toBe(true)
      const lengthsForCard = new Set(series.map((row) => row.data.length))
      expect(lengthsForCard.size).toBe(1)
      return series[0]!.data.length
    })
    expect(new Set(lengths).size).toBe(1)

    const errors = DEMO_CARDS.find((c) => c.id === 'tool-errors')!
    const day = toChartOption(errors, demoQueryForCard(errors, '7d', 'day'))
    const daySeries = day.series as { data: number[] }[]
    expect(lengths[0]).toBeGreaterThan(daySeries[0]!.data.length)
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
