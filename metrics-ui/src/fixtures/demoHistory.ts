import type { CardQueryResult, MetricsGrain, MetricsWindow } from '@/types/metrics'

const MS_HOUR = 3_600_000
const MS_DAY = 24 * MS_HOUR
const MS_WEEK = 7 * MS_DAY
const CHECKS_PER_HOUR = 60

export const DEMO_NOW = Date.UTC(2026, 2, 18, 16, 0, 0)

const TOOLS = [
  'describe_capabilities',
  'run_bytecode',
  'run_transaction',
  'run_block',
  'generate_artifact',
  'inspect_artifact',
] as const

export function windowToMs(window: MetricsWindow): number {
  if (window === '24h') {
    return MS_DAY
  }
  if (window === '7d') {
    return 7 * MS_DAY
  }
  return 30 * MS_DAY
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
  const mondayOffset = (d.getUTCDay() + 6) % 7
  return dayStart - mondayOffset * MS_DAY
}

function grainStepMs(grain: MetricsGrain): number {
  if (grain === 'hour') {
    return MS_HOUR
  }
  if (grain === 'day') {
    return MS_DAY
  }
  return MS_WEEK
}

export function bucketStarts(window: MetricsWindow, grain: MetricsGrain): number[] {
  const from = DEMO_NOW - windowToMs(window)
  const out: number[] = []
  for (let t = bucketStartUtc(from, grain); t < DEMO_NOW; t += grainStepMs(grain)) {
    out.push(t)
  }
  return out
}

function hoursInBucket(bucket: number, grain: MetricsGrain, from: number): number[] {
  const end = Math.min(bucket + grainStepMs(grain), DEMO_NOW)
  const start = Math.max(bucket, from)
  const hours: number[] = []
  for (let t = bucketStartUtc(start, 'hour'); t < end; t += MS_HOUR) {
    if (t >= from && t < DEMO_NOW) {
      hours.push(t)
    }
  }
  return hours
}

/** Share of health checks that passed during this hour. 1 is fully up. */
function uptimeFraction(hour: number): number {
  const d = new Date(hour)
  const month = d.getUTCMonth()
  const date = d.getUTCDate()
  const h = d.getUTCHours()
  if (month === 2 && date === 15 && h >= 2 && h < 5) {
    return 0
  }
  if (month === 2 && date === 16 && h >= 8 && h < 14) {
    return 0
  }
  if (month === 2 && date === 18 && h >= 4 && h < 7) {
    return 0
  }
  if (month === 2 && date === 11 && h >= 1 && h < 9) {
    return 0
  }
  if (month === 2 && date === 3 && h >= 12 && h < 20) {
    return 0.35
  }
  if (month === 1 && date === 19 && h < 12) {
    return 0
  }
  if (month === 1 && date === 27 && h >= 18 && h < 22) {
    return 0.7
  }
  return 1
}

type HourActivity = {
  actors: string[]
  sessions: { client: string; version: string }[]
  tools: Record<string, number>
  errors: Record<string, number>
  forks: Record<string, number>
  eips: Record<string, number>
}

const GUEST_CLIENTS: { client: string; version: string }[] = [
  { client: 'claude-code', version: '0.9.0' },
  { client: 'claude-code', version: '1.0.2' },
  { client: 'claude-code', version: '0.8.4' },
  { client: 'continue', version: '1.1.40' },
  { client: 'windsurf', version: '1.12.5' },
  { client: 'cline', version: '3.4.0' },
  { client: 'zed', version: '0.178.0' },
  { client: 'goose', version: '1.0.25' },
  { client: 'codex', version: '0.12.0' },
]

function clientForActor(actor: string, hour: number): { client: string; version: string } {
  const d = new Date(hour)
  if (actor === 'fp-cursor-lab') {
    return { client: 'cursor-agent', version: '1.2.3' }
  }
  if (actor === 'fp-cursor-main') {
    if (d.getUTCMonth() === 1 || d.getUTCDate() < 8) {
      return { client: 'cursor-agent', version: '1.1.8' }
    }
    return { client: 'cursor-agent', version: '1.3.0' }
  }
  if (actor === 'fp-claude-weekly') {
    return { client: 'claude-code', version: '0.9.0' }
  }
  return GUEST_CLIENTS[(d.getUTCDate() + d.getUTCMonth()) % GUEST_CLIENTS.length]!
}

function emptyTools(): Record<string, number> {
  return Object.fromEntries(TOOLS.map((name) => [name, 0]))
}

function activity(hour: number): HourActivity {
  const d = new Date(hour)
  const h = d.getUTCHours()
  const dow = d.getUTCDay()
  const date = d.getUTCDate()
  const weekend = dow === 0 || dow === 6
  const daytime = h >= 8 && h <= 18
  const evening = h >= 6 && h <= 22
  let pace = 1
  if (daytime) {
    pace = weekend ? 2 : 4
  } else if (evening) {
    pace = weekend ? 1 : 2
  }
  pace += (date + h) % 4 === 0 ? 1 : 0

  const day = d.toISOString().slice(0, 10)
  const actors = ['fp-cursor-main', 'fp-cursor-lab']
  if (daytime) {
    actors.push(`fp-guest-${day}`)
  }
  if (dow === 3 && h >= 10 && h <= 16) {
    actors.push('fp-claude-weekly')
  }
  const sessions = actors.map((actor) => clientForActor(actor, hour))
  const n = Math.max(pace, 1)
  const tools = emptyTools()
  const errors = emptyTools()
  tools.describe_capabilities = n + (h < 12 ? 1 : 0)
  tools.run_bytecode = n * 2 + (h % 3)
  tools.run_transaction = n + (h % 2)
  tools.run_block = 1 + (dow === 2 ? 1 : 0)
  tools.generate_artifact = h % 4 === 0 ? 2 : 1
  tools.inspect_artifact = h % 3 === 0 ? 1 : 0
  errors.run_bytecode = (h * 3 + date) % 5 === 0 ? 1 + (h % 2) : 0
  errors.run_transaction = (h + date * 2) % 8 === 0 ? 1 : 0
  errors.describe_capabilities = (h + date) % 13 === 0 ? 1 : 0
  errors.run_block = dow === 2 && h % 6 === 0 ? 1 : 0
  errors.generate_artifact = date % 3 === 0 && h % 7 === 2 ? 1 : 0
  errors.inspect_artifact = date % 4 === 1 && h === 19 ? 1 : 0
  const forkCalls =
    tools.run_bytecode +
    tools.run_transaction +
    tools.run_block +
    tools.generate_artifact +
    tools.inspect_artifact
  const forks: Record<string, number> = {
    glamsterdam: Math.max(1, Math.round(forkCalls * 0.55)),
    omitted: Math.max(1, Math.round(forkCalls * 0.25)),
    fusaka: 0,
  }
  forks.fusaka = Math.max(1, forkCalls - forks.glamsterdam - forks.omitted)
  const eips: Record<string, number> = {
    '7928': 1 + (h % 3 === 0 ? 1 : 0),
    '8024': h % 4 === 1 || date % 6 === 0 ? 1 : 0,
  }
  return { actors, sessions, tools, errors, forks, eips }
}

function eachHour(window: MetricsWindow, visit: (hour: number) => void): void {
  const from = DEMO_NOW - windowToMs(window)
  for (let t = bucketStartUtc(from, 'hour'); t < DEMO_NOW; t += MS_HOUR) {
    if (t >= from) {
      visit(t)
    }
  }
}

function uptimePercent(up: number, down: number): number {
  const total = up + down
  if (total === 0) {
    return 100
  }
  return Math.round((up / total) * 1000) / 10
}

export function demoLiveness(
  cardId: string,
  window: MetricsWindow,
  grain: MetricsGrain,
): CardQueryResult {
  const from = DEMO_NOW - windowToMs(window)
  let upAll = 0
  let downAll = 0
  const series: CardQueryResult['series'] = []

  for (const bucket of bucketStarts(window, grain)) {
    let up = 0
    let down = 0
    for (const hour of hoursInBucket(bucket, grain, from)) {
      const fraction = uptimeFraction(hour)
      const ok = Math.round(CHECKS_PER_HOUR * fraction)
      up += ok
      down += CHECKS_PER_HOUR - ok
    }
    upAll += up
    downAll += down
    series.push({ bucketStart: bucket, series: 'uptime', value: uptimePercent(up, down) })
  }

  return {
    cardId,
    window,
    grain,
    series,
    summary: uptimePercent(upAll, downAll),
    isEmpty: upAll + downAll === 0,
  }
}

export function demoSessions(
  cardId: string,
  window: MetricsWindow,
  grain: MetricsGrain,
): CardQueryResult {
  const from = DEMO_NOW - windowToMs(window)
  let summary = 0
  const series: CardQueryResult['series'] = []
  for (const bucket of bucketStarts(window, grain)) {
    let count = 0
    for (const hour of hoursInBucket(bucket, grain, from)) {
      count += activity(hour).sessions.length
    }
    summary += count
    series.push({ bucketStart: bucket, series: 'value', value: count })
  }
  return { cardId, window, grain, series, summary, isEmpty: summary === 0 }
}

export function demoFingerprints(
  cardId: string,
  window: MetricsWindow,
  grain: MetricsGrain,
): CardQueryResult {
  const from = DEMO_NOW - windowToMs(window)
  const all = new Set<string>()
  const series: CardQueryResult['series'] = []
  for (const bucket of bucketStarts(window, grain)) {
    const actors = new Set<string>()
    for (const hour of hoursInBucket(bucket, grain, from)) {
      for (const actor of activity(hour).actors) {
        actors.add(actor)
        all.add(actor)
      }
    }
    series.push({ bucketStart: bucket, series: 'value', value: actors.size })
  }
  return { cardId, window, grain, series, summary: all.size, isEmpty: all.size === 0 }
}

export function demoSplit(
  cardId: string,
  window: MetricsWindow,
  grain: MetricsGrain,
  pick: (hour: HourActivity) => Record<string, number>,
  fill?: readonly string[],
): CardQueryResult {
  const from = DEMO_NOW - windowToMs(window)
  const totals = new Map<string, number>()
  const names = new Set<string>(fill ?? [])
  const perBucket: { bucket: number; totals: Map<string, number> }[] = []
  for (const bucket of bucketStarts(window, grain)) {
    const bucketTotals = new Map<string, number>()
    for (const hour of hoursInBucket(bucket, grain, from)) {
      for (const [name, value] of Object.entries(pick(activity(hour)))) {
        if (value === 0) {
          continue
        }
        bucketTotals.set(name, (bucketTotals.get(name) ?? 0) + value)
        totals.set(name, (totals.get(name) ?? 0) + value)
        names.add(name)
      }
    }
    perBucket.push({ bucket, totals: bucketTotals })
  }
  const ordered = [
    ...(fill ?? []),
    ...[...names].filter((name) => !(fill ?? []).includes(name)).sort(),
  ]
  const series: CardQueryResult['series'] = []
  for (const { bucket, totals: bucketTotals } of perBucket) {
    for (const name of ordered) {
      series.push({ bucketStart: bucket, series: name, value: bucketTotals.get(name) ?? 0 })
    }
  }
  const summary = [...totals.values()].reduce((sum, value) => sum + value, 0)
  return { cardId, window, grain, series, summary, isEmpty: summary === 0 }
}

export function demoClients(
  cardId: string,
  window: MetricsWindow,
  grain: MetricsGrain,
): CardQueryResult {
  const counts = new Map<string, number>()
  eachHour(window, (hour) => {
    for (const session of activity(hour).sessions) {
      const key = `${session.client}\t${session.version}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  })
  const series = [...counts.entries()]
    .map(([seriesName, value]) => ({ bucketStart: DEMO_NOW, series: seriesName, value }))
    .sort((a, b) => b.value - a.value)
  return { cardId, window, grain, series, summary: series.length, isEmpty: series.length === 0 }
}

export function demoTools(
  cardId: string,
  window: MetricsWindow,
  grain: MetricsGrain,
): CardQueryResult {
  return demoSplit(cardId, window, grain, (hour) => hour.tools, TOOLS)
}
