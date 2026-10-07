export type MetricsWindow = '24h' | '7d' | '30d'

export type MetricsGrain = 'hour' | 'day' | 'week'

export type CardMeasure = 'count' | 'count_distinct_actor' | 'sum_micro_usdc' | 'uptime_percent'

export type CardDataSource = 'events' | 'health'

export type CardSplit = 'tool' | 'settlement' | 'outcome' | 'client' | 'fork' | 'eip'

export type CardFilter = {
  settlement?: 'paid' | 'unpaid'
  kind?: 'session_open' | 'tool_call'
  outcome?: 'ok' | 'error'
}

export type CardDefinition = {
  id: string
  title: string
  dataSource?: CardDataSource
  measure: CardMeasure
  split?: CardSplit
  filter?: CardFilter
  grains: MetricsGrain[]
  defaultGrain: MetricsGrain
  chart: 'line' | 'stacked-bar' | 'table'
  emptyHint?: string
  helpText?: string
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
