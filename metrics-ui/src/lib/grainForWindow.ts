import type { CardDefinition, MetricsGrain, MetricsWindow } from '@/types/metrics'

/** 24h is readable by hour. Longer ranges start on day. Week stays a manual choice. */
export function grainForWindow(card: CardDefinition, window: MetricsWindow): MetricsGrain {
  const preferred: MetricsGrain = window === '24h' ? 'hour' : 'day'
  if (card.grains.includes(preferred)) {
    return preferred
  }
  return card.defaultGrain
}
