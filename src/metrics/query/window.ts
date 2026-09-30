import type { MetricsGrain, MetricsWindow } from './types.js'

const MS_HOUR = 60 * 60 * 1000
const MS_DAY = 24 * MS_HOUR
const MS_WEEK = 7 * MS_DAY

export function windowToMs(window: MetricsWindow): number {
  switch (window) {
    case '24h':
      return MS_DAY
    case '7d':
      return 7 * MS_DAY
    case '30d':
      return 30 * MS_DAY
  }
}

export function defaultGrainForWindow(window: MetricsWindow): MetricsGrain {
  switch (window) {
    case '24h':
      return 'hour'
    case '7d':
      return 'day'
    case '30d':
      return 'day'
  }
}

export function bucketStartUtc(ts: number, grain: MetricsGrain): number {
  const d = new Date(ts)
  if (grain === 'hour') {
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours())
  }
  if (grain === 'day') {
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  }
  const dayStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  const dayOfWeek = d.getUTCDay()
  const mondayOffset = (dayOfWeek + 6) % 7
  return dayStart - mondayOffset * MS_DAY
}

export function grainStepMs(grain: MetricsGrain): number {
  switch (grain) {
    case 'hour':
      return MS_HOUR
    case 'day':
      return MS_DAY
    case 'week':
      return MS_WEEK
  }
}
