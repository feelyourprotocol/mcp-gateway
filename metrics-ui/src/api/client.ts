import { DEMO_CARDS } from '@/fixtures/demoCatalog'
import { demoQueryForCard } from '@/fixtures/demoQueries'
import type { CardDefinition, CardQueryResult, MetricsGrain, MetricsWindow } from '@/types/metrics'

const useLiveApi = import.meta.env.MODE === 'live'

export async function fetchCards(): Promise<CardDefinition[]> {
  if (!useLiveApi) {
    return DEMO_CARDS
  }
  const res = await fetch('/api/cards')
  if (!res.ok) {
    throw new Error('failed to load cards')
  }
  const body = (await res.json()) as { cards: CardDefinition[] }
  return body.cards
}

export async function fetchCardQuery(
  cardId: string,
  window: MetricsWindow,
  grain: MetricsGrain,
): Promise<CardQueryResult> {
  if (!useLiveApi) {
    const card = DEMO_CARDS.find((c) => c.id === cardId)
    if (!card) {
      throw new Error('unknown card')
    }
    return demoQueryForCard(card, window, grain)
  }
  const params = new URLSearchParams({ window, grain })
  const res = await fetch(`/api/cards/${cardId}/query?${params}`)
  if (!res.ok) {
    throw new Error('query failed')
  }
  return (await res.json()) as CardQueryResult
}
