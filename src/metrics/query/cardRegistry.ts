import type { CardDefinition } from './types.js'

export const METRICS_CARD_REGISTRY: CardDefinition[] = [
  {
    id: 'distinct-fingerprints',
    title: 'Distinct agent fingerprints',
    measure: 'count_distinct_actor',
    filter: { kind: 'session_open' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'line',
  },
  {
    id: 'sessions',
    title: 'Sessions',
    measure: 'count',
    filter: { kind: 'session_open' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'line',
  },
  {
    id: 'tool-calls',
    title: 'Tool usage',
    measure: 'count',
    split: 'tool',
    filter: { kind: 'tool_call' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'stacked-bar',
  },
  {
    id: 'tool-errors',
    title: 'Tool errors',
    measure: 'count',
    split: 'tool',
    filter: { kind: 'tool_call', outcome: 'error' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'stacked-bar',
  },
  {
    id: 'settlement-mix',
    title: 'Paid vs unpaid calls',
    measure: 'count',
    split: 'settlement',
    filter: { kind: 'tool_call' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'stacked-bar',
    emptyHint: 'No payment data yet — x402 not wired.',
  },
  {
    id: 'revenue-over-time',
    title: 'USDC revenue',
    measure: 'sum_micro_usdc',
    filter: { kind: 'tool_call', settlement: 'paid' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'line',
    emptyHint: 'No USDC recorded yet.',
  },
  {
    id: 'revenue-by-tool',
    title: 'USDC by tool',
    measure: 'sum_micro_usdc',
    split: 'tool',
    filter: { kind: 'tool_call', settlement: 'paid' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'stacked-bar',
    emptyHint: 'No USDC recorded yet.',
  },
]

export function getCardDefinition(cardId: string): CardDefinition | undefined {
  return METRICS_CARD_REGISTRY.find((card) => card.id === cardId)
}
