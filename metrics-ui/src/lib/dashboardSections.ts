export type DashboardSectionId = 'usage' | 'tools' | 'errors' | 'payment'

export type DashboardSection = {
  id: DashboardSectionId
  label: string
  path: string
  cardIds: readonly string[]
}

/** Keep in sync with METRICS_CARD_REGISTRY order groupings. */
export const DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: 'usage',
    label: 'Usage',
    path: '/usage',
    cardIds: ['mcp-liveness-timeline', 'distinct-fingerprints', 'sessions', 'clients'],
  },
  {
    id: 'tools',
    label: 'Tools',
    path: '/tools',
    cardIds: ['tool-calls', 'hardforks', 'eip-numbers'],
  },
  {
    id: 'errors',
    label: 'Errors',
    path: '/errors',
    cardIds: ['tool-errors'],
  },
  {
    id: 'payment',
    label: 'Payment / x402',
    path: '/payment',
    cardIds: ['settlement-mix', 'revenue-over-time', 'revenue-by-tool'],
  },
]

export const ALL_SECTION_CARD_IDS = DASHBOARD_SECTIONS.flatMap((section) => section.cardIds)

export const DEFAULT_PINNED_CARD_IDS = [
  'mcp-liveness-timeline',
  'sessions',
  'tool-calls',
  'eip-numbers',
] as const

export function cardsForSection(sectionId: DashboardSectionId, catalogIds: string[]): string[] {
  const section = DASHBOARD_SECTIONS.find((s) => s.id === sectionId)
  if (!section) {
    return []
  }
  const allowed = new Set(catalogIds)
  return section.cardIds.filter((id) => allowed.has(id))
}
