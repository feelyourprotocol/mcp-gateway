import type { CardDefinition, CardQueryResult, MetricsGrain, MetricsWindow } from '@/types/metrics'

const MS_DAY = 86_400_000

function daySeries(
  cardId: string,
  window: MetricsWindow,
  grain: MetricsGrain,
  series: Record<string, number[]>,
  now: number,
  summary: number,
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
  return { cardId, window, grain, series: rows, summary, isEmpty }
}

const DEMO_NOW = Date.UTC(2026, 2, 15, 12, 0, 0)

export function demoQueryForCard(
  card: CardDefinition,
  window: MetricsWindow,
  grain: MetricsGrain,
): CardQueryResult {
  switch (card.id) {
    case 'mcp-liveness':
      return daySeries(
        card.id,
        window,
        grain,
        {
          up: [1438, 1439, 1437, 1440, 1436, 1438, 1439],
          down: [2, 1, 3, 0, 4, 2, 1],
        },
        DEMO_NOW,
        99.8,
      )
    case 'distinct-fingerprints':
      return daySeries(card.id, window, grain, { value: [2, 3, 2, 4, 5, 3, 6] }, DEMO_NOW, 9)
    case 'sessions':
      return daySeries(card.id, window, grain, { value: [5, 8, 6, 9, 11, 7, 12] }, DEMO_NOW, 58)
    case 'clients':
      return {
        cardId: card.id,
        window,
        grain,
        summary: 42,
        isEmpty: false,
        series: [
          { bucketStart: DEMO_NOW, series: 'cursor-agent\t1.2.3', value: 28 },
          { bucketStart: DEMO_NOW, series: 'claude-code\t0.9.0', value: 14 },
        ],
      }
    case 'tool-calls':
      return daySeries(
        card.id,
        window,
        grain,
        {
          run_bytecode: [12, 14, 10, 18, 20, 15, 22],
          run_transaction: [4, 5, 3, 6, 7, 5, 8],
          describe_capabilities: [8, 9, 7, 10, 11, 9, 12],
          run_block: [1, 0, 2, 1, 3, 2, 1],
          generate_artifact: [0, 1, 0, 2, 3, 1, 2],
          inspect_artifact: [0, 0, 1, 0, 1, 0, 1],
        },
        DEMO_NOW,
        186,
      )
    case 'hardforks':
      return daySeries(
        card.id,
        window,
        grain,
        {
          glamsterdam: [10, 12, 8, 15, 18, 14, 20],
          omitted: [3, 4, 2, 5, 6, 4, 7],
          fusaka: [2, 1, 3, 2, 4, 3, 2],
        },
        DEMO_NOW,
        120,
      )
    case 'eip-numbers':
      return daySeries(
        card.id,
        window,
        grain,
        {
          '7928': [2, 3, 1, 4, 5, 3, 6],
          '8024': [1, 2, 1, 2, 3, 2, 3],
        },
        DEMO_NOW,
        42,
      )
    case 'tool-errors':
      return daySeries(
        card.id,
        window,
        grain,
        {
          run_bytecode: [1, 0, 2, 1, 0, 1, 2],
        },
        DEMO_NOW,
        7,
      )
    case 'settlement-mix':
      return daySeries(
        card.id,
        window,
        grain,
        {
          unpaid: [20, 22, 18, 25, 28, 24, 30],
          paid: [0, 0, 0, 0, 0, 0, 0],
        },
        DEMO_NOW,
        167,
      )
    case 'revenue-over-time':
    case 'revenue-by-tool':
      return {
        cardId: card.id,
        window,
        grain,
        series: [],
        summary: 0,
        isEmpty: true,
      }
    default:
      return { cardId: card.id, window, grain, series: [], summary: 0, isEmpty: true }
  }
}
