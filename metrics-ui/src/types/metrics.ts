export type MetricsWindow = '24h' | '7d' | '30d'

export type MetricsGrain = 'hour' | 'day' | 'week'

export type CardMeasure = 'count' | 'count_distinct_actor' | 'sum_micro_usdc'

export type CardDefinition = {
  id: string
  title: string
  measure: CardMeasure
  split?: 'tool' | 'settlement' | 'outcome' | 'client' | 'fork' | 'eip'
  filter?: Record<string, string>
  grains: MetricsGrain[]
  defaultGrain: MetricsGrain
  chart: 'line' | 'stacked-bar' | 'table'
  emptyHint?: string
  subtitle?: string
  note?: string
  fillSeries?: string[]
  hideGrainControls?: boolean
  fullWidth?: boolean
}

export type QuerySeriesRow = {
  bucketStart: number
  series: string
  value: number
}

export type CardQueryResult = {
  cardId: string
  window: MetricsWindow
  grain: MetricsGrain
  series: QuerySeriesRow[]
  summary: number
  isEmpty: boolean
}
