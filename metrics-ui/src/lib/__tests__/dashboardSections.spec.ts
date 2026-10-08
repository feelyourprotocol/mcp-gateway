import { describe, expect, it } from 'vitest'

import { DEMO_CARDS } from '@/fixtures/demoCatalog'
import { ALL_SECTION_CARD_IDS, DASHBOARD_SECTIONS } from '@/lib/dashboardSections'

describe('dashboardSections', () => {
  it('covers every demo catalog card exactly once', () => {
    const catalogIds = DEMO_CARDS.map((card) => card.id).sort()
    const sectionIds = [...ALL_SECTION_CARD_IDS].sort()
    expect(sectionIds).toEqual(catalogIds)
  })

  it('defines four sections', () => {
    expect(DASHBOARD_SECTIONS.map((s) => s.id)).toEqual(['usage', 'tools', 'errors', 'payment'])
  })
})
