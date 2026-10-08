import { DEFAULT_PINNED_CARD_IDS } from '@/lib/dashboardSections'

const STORAGE_KEY = 'fyp-metrics-pinned-v1'

export function loadPinnedCardIds(): string[] {
  if (typeof localStorage === 'undefined') {
    return [...DEFAULT_PINNED_CARD_IDS]
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return [...DEFAULT_PINNED_CARD_IDS]
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_PINNED_CARD_IDS]
    }
    const ids = parsed.filter((entry): entry is string => typeof entry === 'string')
    return ids.length > 0 ? ids : [...DEFAULT_PINNED_CARD_IDS]
  } catch {
    return [...DEFAULT_PINNED_CARD_IDS]
  }
}

export function savePinnedCardIds(ids: string[]): void {
  if (typeof localStorage === 'undefined') {
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

/** Reorder within a list; returns null when indices are out of range. */
export function reorderPinnedCardIds(
  ids: readonly string[],
  fromIndex: number,
  toIndex: number,
): string[] | null {
  if (fromIndex === toIndex) {
    return [...ids]
  }
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= ids.length || toIndex >= ids.length) {
    return null
  }
  const next = [...ids]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item!)
  return next
}

/** Reorder home pins among catalog-visible ids; unknown ids stay at the tail. */
export function reorderVisiblePinnedIds(
  pinnedIds: readonly string[],
  catalogIds: ReadonlySet<string>,
  fromIndex: number,
  toIndex: number,
): string[] | null {
  const visible = pinnedIds.filter((id) => catalogIds.has(id))
  const hidden = pinnedIds.filter((id) => !catalogIds.has(id))
  const reordered = reorderPinnedCardIds(visible, fromIndex, toIndex)
  if (reordered === null) {
    return null
  }
  return [...reordered, ...hidden]
}
