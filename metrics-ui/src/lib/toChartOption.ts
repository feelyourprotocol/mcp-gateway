import type { LineSeriesOption, BarSeriesOption } from 'echarts/charts'

import type { CardDefinition, CardQueryResult } from '@/types/metrics'

const PAID_COLOR = '#06b6d4'

function chartAnimationEnabled(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
const SERIES_PALETTE = ['#7c3aed', '#2563eb', '#0891b2', '#64748b', '#ea580c', '#16a34a']

function formatBucketLabel(ts: number, grain: CardQueryResult['grain']): string {
  const d = new Date(ts)
  if (grain === 'hour') {
    return d.toISOString().slice(11, 16)
  }
  if (grain === 'week') {
    return d.toISOString().slice(0, 10)
  }
  return d.toISOString().slice(5, 10)
}

function seriesNames(result: CardQueryResult): string[] {
  return [...new Set(result.series.map((row) => row.series))].sort()
}

function bucketStarts(result: CardQueryResult): number[] {
  return [...new Set(result.series.map((row) => row.bucketStart))].sort((a, b) => a - b)
}

export function headlineValue(result: CardQueryResult, card: CardDefinition): string {
  const total = result.series.reduce((sum, row) => sum + row.value, 0)
  if (card.measure === 'sum_micro_usdc') {
    return (total / 1_000_000).toFixed(2)
  }
  return String(total)
}

export function toChartOption(
  card: CardDefinition,
  result: CardQueryResult,
): Record<string, unknown> {
  const names = seriesNames(result)
  const buckets = bucketStarts(result)
  const categories = buckets.map((ts) => formatBucketLabel(ts, result.grain))

  const lookup = new Map<string, number>()
  for (const row of result.series) {
    lookup.set(`${row.bucketStart}:${row.series}`, row.value)
  }

  const buildSeries = (name: string, index: number): LineSeriesOption | BarSeriesOption => {
    const color =
      name === 'paid'
        ? PAID_COLOR
        : name === 'unpaid'
          ? '#94a3b8'
          : SERIES_PALETTE[index % SERIES_PALETTE.length]
    const data = buckets.map((b) => lookup.get(`${b}:${name}`) ?? 0)
    const base = {
      name,
      data,
      emphasis: { focus: 'series' as const },
      itemStyle: { color },
    }
    if (card.chart === 'stacked-bar') {
      return { ...base, type: 'bar', stack: 'total' }
    }
    return { ...base, type: 'line', smooth: true, showSymbol: false }
  }

  return {
    animation: chartAnimationEnabled(),
    grid: { left: 48, right: 16, top: 32, bottom: 48 },
    tooltip: { trigger: 'axis' },
    legend: { type: 'scroll', bottom: 0 },
    xAxis: { type: 'category', data: categories, boundaryGap: card.chart === 'stacked-bar' },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e2e8f0' } } },
    series: names.map((name, index) => buildSeries(name, index)),
  }
}
