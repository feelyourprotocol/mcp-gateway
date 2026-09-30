import type { CardDefinition, CardQueryResult, MetricsGrain, MetricsWindow } from '@/types/metrics'

const MS_DAY = 86_400_000

function daySeries(
  cardId: string,
  window: MetricsWindow,
  grain: MetricsGrain,
  series: Record<string, number[]>,
  now: number,
): CardQueryResult {
  const days = window === '24h' ? 1 : window === '7d' ? 7 : 14
  const rows: CardQueryResult['series'] = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const bucketStart = now - i * MS_DAY
    for (const [name, values] of Object.entries(series)) {
      const idx = days - 1 - i
      rows.push({
        bucketStart,
        series: name,
        value: values[idx] ?? 0,
      })
    }
  }
  const isEmpty = Object.keys(series).length === 0
  return { cardId, window, grain, series: rows, isEmpty }
}

const DEMO_NOW = Date.UTC(2026, 2, 15, 12, 0, 0)

export function demoQueryForCard(
  card: CardDefinition,
  window: MetricsWindow,
  grain: MetricsGrain,
): CardQueryResult {
  switch (card.id) {
    case 'distinct-fingerprints':
      return daySeries(
        card.id,
        window,
        grain,
        { total: [2, 3, 2, 4, 5, 3, 6, 4, 5, 7, 6, 8, 5, 9] },
        DEMO_NOW,
      )
    case 'sessions':
      return daySeries(
        card.id,
        window,
        grain,
        { total: [5, 8, 6, 9, 11, 7, 12, 10, 13, 15, 14, 16, 12, 18] },
        DEMO_NOW,
      )
    case 'tool-calls':
      return daySeries(
        card.id,
        window,
        grain,
        {
          run_bytecode: [12, 14, 10, 18, 20, 15, 22, 19, 21, 24, 23, 26, 20, 28],
          run_transaction: [4, 5, 3, 6, 7, 5, 8, 6, 7, 9, 8, 10, 7, 11],
          describe_capabilities: [8, 9, 7, 10, 11, 9, 12, 10, 11, 13, 12, 14, 11, 15],
        },
        DEMO_NOW,
      )
    case 'tool-errors':
      return daySeries(
        card.id,
        window,
        grain,
        {
          run_bytecode: [1, 0, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1],
        },
        DEMO_NOW,
      )
    case 'settlement-mix':
      return daySeries(
        card.id,
        window,
        grain,
        {
          unpaid: [20, 22, 18, 25, 28, 24, 30, 26, 28, 32, 30, 34, 28, 36],
          paid: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
        DEMO_NOW,
      )
    case 'revenue-over-time':
    case 'revenue-by-tool':
      return {
        cardId: card.id,
        window,
        grain,
        series: [],
        isEmpty: true,
      }
    default:
      return { cardId: card.id, window, grain, series: [], isEmpty: true }
  }
}
