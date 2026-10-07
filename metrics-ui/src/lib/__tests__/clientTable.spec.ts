import { describe, expect, it } from 'vitest'

import { DEMO_CARDS } from '@/fixtures/demoCatalog'
import { demoQueryForCard } from '@/fixtures/demoQueries'
import { clientTableRows } from '@/lib/clientTable'

describe('clientTableRows', () => {
  const result = demoQueryForCard(DEMO_CARDS.find((c) => c.id === 'clients')!, '7d', 'day')

  it('keeps one row per name and version', () => {
    const rows = clientTableRows(result, 'version')
    expect(rows.length).toBe(result.series.length)
    expect(rows.filter((row) => row.client === 'cursor-agent').length).toBeGreaterThan(1)
  })

  it('rolls versions of one name into a single client row', () => {
    const versions = clientTableRows(result, 'version')
    const clients = clientTableRows(result, 'client')
    const cursorVersions = versions.filter((row) => row.client === 'cursor-agent')
    const cursor = clients.find((row) => row.client === 'cursor-agent')
    expect(clients.length).toBeLessThan(versions.length)
    expect(cursor?.versions).toBe(cursorVersions.length)
    expect(cursor?.sessions).toBe(cursorVersions.reduce((sum, row) => sum + row.sessions, 0))
  })
})
