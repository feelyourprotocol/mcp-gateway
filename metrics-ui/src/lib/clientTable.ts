import type { CardQueryResult } from '@/types/metrics'

export type ClientGroup = 'client' | 'version'

export type ClientTableRow = {
  client: string
  version: string
  versions: number
  sessions: number
}

export function clientTableRows(result: CardQueryResult, group: ClientGroup): ClientTableRow[] {
  if (group === 'version') {
    return result.series.map((row) => {
      const [client, version] = row.series.split('\t')
      return {
        client: client ?? row.series,
        version: version ?? '—',
        versions: 1,
        sessions: row.value,
      }
    })
  }

  const byClient = new Map<string, { versions: number; sessions: number }>()
  for (const row of result.series) {
    const client = row.series.split('\t')[0] || row.series
    const current = byClient.get(client) ?? { versions: 0, sessions: 0 }
    current.versions += 1
    current.sessions += row.value
    byClient.set(client, current)
  }
  return [...byClient.entries()]
    .map(([client, totals]) => ({
      client,
      version: '',
      versions: totals.versions,
      sessions: totals.sessions,
    }))
    .sort((a, b) => b.sessions - a.sessions || a.client.localeCompare(b.client))
}
