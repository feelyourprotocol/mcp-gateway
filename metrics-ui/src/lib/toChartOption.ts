import type { LineSeriesOption, BarSeriesOption } from 'echarts/charts'

import type { CardDefinition, CardQueryResult } from '@/types/metrics'

const PAID_COLOR = '#06b6d4'
const SINGLE_SERIES = 'value'

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

function visibleSeriesNames(result: CardQueryResult): string[] {
  return [...new Set(result.series.map((row) => row.series))]
    .filter((name) => name !== SINGLE_SERIES)
    .sort()
}

function bucketStarts(result: CardQueryResult): number[] {
  return [...new Set(result.series.map((row) => row.bucketStart))].sort((a, b) => a - b)
}

export function headlineValue(result: CardQueryResult, card: CardDefinition): string {
  const value = result.summary
  if (card.measure === 'sum_micro_usdc') {
    return (value / 1_000_000).toFixed(2)
  }
  return String(value)
}

export function axisTooltipTotal(
  result: CardQueryResult,
  bucketStart: number,
  seriesNames: string[],
): number {
  const lookup = new Map<string, number>()
  for (const row of result.series) {
    lookup.set(`${row.bucketStart}:${row.series}`, row.value)
  }
  return seriesNames.reduce((sum, name) => sum + (lookup.get(`${bucketStart}:${name}`) ?? 0), 0)
}

export function toChartOption(
  card: CardDefinition,
  result: CardQueryResult,
): Record<string, unknown> {
  const names = visibleSeriesNames(result)
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

  const showLegend = names.length > 1

  return {
    animation: chartAnimationEnabled(),
    grid: { left: 48, right: 16, top: 32, bottom: showLegend ? 48 : 24 },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? params : [params]
        if (items.length === 0) {
          return ''
        }
        const first = items[0] as { axisValue?: string; dataIndex?: number }
        const idx = first.dataIndex ?? 0
        const bucket = buckets[idx]
        if (bucket === undefined) {
          return ''
        }
        const lines = items
          .filter((item) => {
            const row = item as { seriesName?: string; value?: number }
            return row.seriesName !== SINGLE_SERIES && (row.value ?? 0) > 0
          })
          .map((item) => {
            const row = item as { marker?: string; seriesName?: string; value?: number }
            return `${row.marker ?? ''}${row.seriesName}: ${row.value ?? 0}`
          })
        const total = axisTooltipTotal(result, bucket, names)
        lines.push(`<strong>Total</strong>: ${total}`)
        return `${first.axisValue ?? ''}<br/>${lines.join('<br/>')}`
      },
    },
    legend: showLegend ? { type: 'plain', bottom: 0, width: '100%' } : { show: false },
    xAxis: { type: 'category', data: categories, boundaryGap: card.chart === 'stacked-bar' },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e2e8f0' } } },
    series: names.map((name, index) => buildSeries(name, index)),
  }
}
