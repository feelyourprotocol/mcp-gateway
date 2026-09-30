export type MetricsWindow = '24h' | '7d' | '30d'

export type MetricsGrain = 'hour' | 'day' | 'week'

export type CardMeasure = 'count' | 'count_distinct_actor' | 'sum_micro_usdc'

export type CardSplit = 'tool' | 'settlement' | 'outcome'

export type CardFilter = {
  settlement?: 'paid' | 'unpaid'
  kind?: 'session_open' | 'tool_call'
  outcome?: 'ok' | 'error'
}

export type CardDefinition = {
  id: string
  title: string
  measure: CardMeasure
  split?: CardSplit
  filter?: CardFilter
  grains: MetricsGrain[]
  defaultGrain: MetricsGrain
  chart: 'line' | 'stacked-bar'
  emptyHint?: string
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
  isEmpty: boolean
}
