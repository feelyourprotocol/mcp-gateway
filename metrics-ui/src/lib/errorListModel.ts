import type { ErrorEventRow } from '@/types/errors'

export type CountRow = { key: string; count: number }

export type ErrorListStats = {
  totalLoaded: number
  totalInWindow: number
  truncated: boolean
  withoutDiagnostic: number
  byTool: CountRow[]
  byCode: CountRow[]
}

export type ErrorListFilters = {
  tool: string | null
  code: string | null
}

const NOT_RECORDED = '(not recorded)'

function sortedCounts(map: Map<string, number>): CountRow[] {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
}

export function errorCodeForRow(row: ErrorEventRow): string {
  return row.diagnostic?.code ?? NOT_RECORDED
}

export function aggregateErrorStats(
  rows: ErrorEventRow[],
  meta: { totalInWindow: number; truncated: boolean },
): ErrorListStats {
  const byTool = new Map<string, number>()
  const byCode = new Map<string, number>()
  let withoutDiagnostic = 0
  for (const row of rows) {
    byTool.set(row.tool, (byTool.get(row.tool) ?? 0) + 1)
    const code = errorCodeForRow(row)
    byCode.set(code, (byCode.get(code) ?? 0) + 1)
    if (!row.diagnostic) {
      withoutDiagnostic += 1
    }
  }
  return {
    totalLoaded: rows.length,
    totalInWindow: meta.totalInWindow,
    truncated: meta.truncated,
    withoutDiagnostic,
    byTool: sortedCounts(byTool),
    byCode: sortedCounts(byCode),
  }
}

export function filterErrorRows(rows: ErrorEventRow[], filters: ErrorListFilters): ErrorEventRow[] {
  return rows.filter((row) => {
    if (filters.tool !== null && row.tool !== filters.tool) {
      return false
    }
    if (filters.code !== null && errorCodeForRow(row) !== filters.code) {
      return false
    }
    return true
  })
}

export function paginateRows<T>(
  rows: T[],
  page: number,
  pageSize: number,
): { rows: T[]; page: number; totalPages: number; total: number } {
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    rows: rows.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
  }
}

export type ToolErrorGroup = {
  tool: string
  rows: ErrorEventRow[]
}

export function groupErrorsByTool(rows: ErrorEventRow[]): ToolErrorGroup[] {
  const map = new Map<string, ErrorEventRow[]>()
  for (const row of rows) {
    const list = map.get(row.tool) ?? []
    list.push(row)
    map.set(row.tool, list)
  }
  return [...map.entries()]
    .map(([tool, toolRows]) => ({
      tool,
      rows: [...toolRows].sort((a, b) => b.ts - a.ts),
    }))
    .sort((a, b) => b.rows.length - a.rows.length || a.tool.localeCompare(b.tool))
}

export function truncateMessage(message: string, max = 72): string {
  if (message.length <= max) {
    return message
  }
  return `${message.slice(0, max - 1)}…`
}

export function formatErrorTime(ts: number): string {
  return new Date(ts).toISOString().replace('T', ' ').slice(0, 19)
}
