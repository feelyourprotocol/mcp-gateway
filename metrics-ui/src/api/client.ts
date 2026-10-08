import { resolveApiUrl, useLiveMetricsApi } from '@/api/resolveApiUrl'
import { DEMO_CARDS } from '@/fixtures/demoCatalog'
import { DEMO_LIVENESS } from '@/fixtures/demoLiveness'
import { demoQueryForCard } from '@/fixtures/demoQueries'
import { demoErrorsForWindow } from '@/fixtures/demoErrors'
import type { ErrorsQueryResult } from '@/types/errors'
import type { CardDefinition, CardQueryResult, MetricsGrain, MetricsWindow } from '@/types/metrics'
import type { LivenessStatus } from '@/types/liveness'

export async function fetchCards(): Promise<CardDefinition[]> {
  if (!useLiveMetricsApi()) {
    return DEMO_CARDS
  }
  const res = await fetch(resolveApiUrl('/api/cards'))
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
  if (!useLiveMetricsApi()) {
    const card = DEMO_CARDS.find((c) => c.id === cardId)
    if (!card) {
      throw new Error('unknown card')
    }
    return demoQueryForCard(card, window, grain)
  }
  const params = new URLSearchParams({ window, grain })
  const res = await fetch(resolveApiUrl(`/api/cards/${cardId}/query?${params}`))
  if (!res.ok) {
    throw new Error('query failed')
  }
  return (await res.json()) as CardQueryResult
}

export async function fetchErrors(window: MetricsWindow): Promise<ErrorsQueryResult> {
  if (!useLiveMetricsApi()) {
    return demoErrorsForWindow(window)
  }
  const params = new URLSearchParams({ window })
  const res = await fetch(resolveApiUrl(`/api/errors?${params}`))
  if (!res.ok) {
    throw new Error('errors query failed')
  }
  return (await res.json()) as ErrorsQueryResult
}

export async function fetchLivenessCurrent(): Promise<LivenessStatus> {
  if (!useLiveMetricsApi()) {
    return { ...DEMO_LIVENESS, lastCheckTs: Date.now() - 45_000 }
  }
  const res = await fetch(resolveApiUrl('/api/liveness/current'))
  if (!res.ok) {
    throw new Error('liveness failed')
  }
  return (await res.json()) as LivenessStatus
}
