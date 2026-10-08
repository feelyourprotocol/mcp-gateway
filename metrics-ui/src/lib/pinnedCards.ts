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
