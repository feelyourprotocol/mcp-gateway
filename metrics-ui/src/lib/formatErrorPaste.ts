import type { ErrorEventRow } from '@/types/errors'

export function formatErrorPaste(row: ErrorEventRow): string {
  const when = new Date(row.ts).toISOString()
  const lines: string[] = [`tool: ${row.tool}`, `when: ${when}`]
  if (row.diagnostic) {
    lines.push(`code: ${row.diagnostic.code}`)
    if (row.diagnostic.field) {
      lines.push(`field: ${row.diagnostic.field}`)
    }
  }
  if (row.forkId) {
    lines.push(`fork: ${row.forkId}`)
  }
  if (row.eips.length > 0) {
    lines.push(`eips: ${row.eips.join(', ')}`)
  }
  if (row.diagnostic) {
    lines.push(`message: ${row.diagnostic.message}`)
    for (const [key, value] of Object.entries(row.diagnostic.facts ?? {})) {
      lines.push(`${key}: ${value}`)
    }
  } else {
    lines.push('message: (not recorded before error diagnostics deploy)')
  }
  return lines.join('\n')
}
