import type { CardDefinition, CardQueryResult, MetricsGrain, MetricsWindow } from '@/types/metrics'

import {
  demoClients,
  demoFingerprints,
  demoLiveness,
  demoSessions,
  demoSplit,
  demoTools,
} from '@/fixtures/demoHistory'

export function demoQueryForCard(
  card: CardDefinition,
  window: MetricsWindow,
  grain: MetricsGrain,
): CardQueryResult {
  switch (card.id) {
    case 'mcp-liveness-timeline':
      return demoLiveness(card.id, window, grain)
    case 'distinct-fingerprints':
      return demoFingerprints(card.id, window, grain)
    case 'sessions':
      return demoSessions(card.id, window, grain)
    case 'clients':
      return demoClients(card.id, window, grain)
    case 'tool-calls':
      return demoTools(card.id, window, grain)
    case 'hardforks':
      return demoSplit(card.id, window, grain, (hour) => hour.forks)
    case 'eip-numbers':
      return demoSplit(card.id, window, grain, (hour) => hour.eips)
    case 'tool-errors':
      return demoSplit(card.id, window, grain, (hour) => hour.errors)
    case 'settlement-mix':
      return demoSplit(
        card.id,
        window,
        grain,
        (hour) => ({
          unpaid: Object.values(hour.tools).reduce((sum, value) => sum + value, 0),
          paid: 0,
        }),
        ['unpaid', 'paid'],
      )
    case 'revenue-over-time':
    case 'revenue-by-tool':
      return { cardId: card.id, window, grain, series: [], summary: 0, isEmpty: true }
    default:
      return { cardId: card.id, window, grain, series: [], summary: 0, isEmpty: true }
  }
}
