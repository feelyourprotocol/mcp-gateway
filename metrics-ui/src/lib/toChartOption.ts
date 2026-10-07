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

function seriesColor(name: string, index: number): string {
  if (name === 'up') {
    return '#16a34a'
  }
  if (name === 'down') {
    return '#dc2626'
  }
  if (name === 'paid') {
    return PAID_COLOR
  }
  if (name === 'unpaid') {
    return '#94a3b8'
  }
  return SERIES_PALETTE[index % SERIES_PALETTE.length] ?? SERIES_PALETTE[0]
}

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
  const names = [...new Set(result.series.map((row) => row.series))]
  const split = names.filter((name) => name !== SINGLE_SERIES).sort()
  if (split.length > 0) {
    return split
  }
  return names.includes(SINGLE_SERIES) ? [SINGLE_SERIES] : []
}

function bucketStarts(result: CardQueryResult): number[] {
  return [...new Set(result.series.map((row) => row.bucketStart))].sort((a, b) => a - b)
}

export function headlineValue(result: CardQueryResult, card: CardDefinition): string {
  const value = result.summary
  if (card.measure === 'sum_micro_usdc') {
    return (value / 1_000_000).toFixed(2)
  }
  if (card.measure === 'uptime_percent') {
    return value.toFixed(1)
  }
  return String(value)
}

/** Two names per line once a single line would run past the card. */
function legendRows(names: string[]): string[][] {
  if (names.length <= 3) {
    return [names]
  }
  const rows: string[][] = []
  for (let i = 0; i < names.length; i += 2) {
    rows.push(names.slice(i, i + 2))
  }
  return rows
}

function chartLegend(names: string[]): {
  legend: Record<string, unknown> | Record<string, unknown>[]
  gridBottom: number
} {
  const shown = names.filter((name) => name !== SINGLE_SERIES)
  if (shown.length < 2) {
    return { legend: { show: false }, gridBottom: 24 }
  }
  const rows = legendRows(shown)
  const rowHeight = 20
  const legend = rows.map((data, index) => ({
    type: 'plain',
    data,
    left: 'center',
    bottom: (rows.length - 1 - index) * rowHeight,
    icon: 'roundRect',
    itemWidth: 16,
    itemHeight: 10,
    itemGap: 12,
    padding: 0,
    selectedMode: true,
    textStyle: { color: '#64748b', fontSize: 13 },
  }))
  return { legend, gridBottom: 28 + rows.length * rowHeight }
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

function uptimeLineOption(result: CardQueryResult): Record<string, unknown> {
  const buckets = bucketStarts(result)
  const categories = buckets.map((ts) => formatBucketLabel(ts, result.grain))
  const lookup = new Map(result.series.map((row) => [row.bucketStart, row.value]))
  const data = buckets.map((bucket) => lookup.get(bucket) ?? 0)

  return {
    animation: chartAnimationEnabled(),
    grid: { left: 48, right: 16, top: 24, bottom: 28 },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? params : [params]
        const first = items[0] as { axisValue?: string; data?: number } | undefined
        if (!first) {
          return ''
        }
        return `${first.axisValue ?? ''}<br/>${first.data ?? 0}% up`
      },
    },
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: false,
      axisLabel: { hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
    },
    series: [
      {
        type: 'line',
        name: 'uptime',
        data,
        showSymbol: data.length <= 40,
        symbolSize: 6,
        smooth: false,
        lineStyle: { width: 2, color: '#2563eb' },
        itemStyle: { color: '#2563eb' },
      },
    ],
  }
}

export function toChartOption(
  card: CardDefinition,
  result: CardQueryResult,
): Record<string, unknown> {
  if (card.measure === 'uptime_percent' && card.chart === 'line') {
    return uptimeLineOption(result)
  }
  const names = visibleSeriesNames(result)
  const buckets = bucketStarts(result)
  const categories = buckets.map((ts) => formatBucketLabel(ts, result.grain))

  const lookup = new Map<string, number>()
  for (const row of result.series) {
    lookup.set(`${row.bucketStart}:${row.series}`, row.value)
  }

  const buildSeries = (name: string, index: number): LineSeriesOption | BarSeriesOption => {
    const color = seriesColor(name, index)
    const data = buckets.map((b) => lookup.get(`${b}:${name}`) ?? 0)
    const base = {
      name,
      data,
      emphasis: { focus: 'series' as const },
      itemStyle: { color },
    }
    if (card.chart === 'stacked-bar') {
      return { ...base, type: 'bar', stack: 'total', barCategoryGap: '30%', barGap: '0%' }
    }
    return { ...base, type: 'line', smooth: true, showSymbol: false }
  }

  const { legend, gridBottom } = chartLegend(names)

  return {
    animation: chartAnimationEnabled(),
    grid: { left: 48, right: 16, top: 32, bottom: gridBottom },
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
            if (names.length === 1 && names[0] === SINGLE_SERIES) {
              return true
            }
            return row.seriesName !== SINGLE_SERIES && (row.value ?? 0) > 0
          })
          .map((item) => {
            const row = item as { marker?: string; seriesName?: string; value?: number }
            if (row.seriesName === SINGLE_SERIES) {
              return `${row.value ?? 0}`
            }
            return `${row.marker ?? ''}${row.seriesName}: ${row.value ?? 0}`
          })
        if (!(names.length === 1 && names[0] === SINGLE_SERIES)) {
          const total = axisTooltipTotal(result, bucket, names)
          lines.push(`<strong>Total</strong>: ${total}`)
        }
        return `${first.axisValue ?? ''}<br/>${lines.join('<br/>')}`
      },
    },
    legend,
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: card.chart === 'stacked-bar',
      axisLabel: { hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      min: 0,
      name: card.chart === 'line' ? `per ${result.grain}` : '',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
    },
    series: names.map((name, index) => buildSeries(name, index)),
  }
}
