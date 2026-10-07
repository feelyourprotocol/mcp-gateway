export type LivenessState = 'up' | 'degraded' | 'down'

export type HealthSampleRow = {
  ts: number
  ok: boolean
  durationMs: number
  statusCode: number | null
}

export type LivenessStatusOptions = {
  pollIntervalMs: number
  staleMs: number
  slowMs: number
}

export type LivenessStatus = {
  state: LivenessState
  lastCheckTs: number | null
  lastOk: boolean | null
  lastDurationMs: number | null
  pollIntervalMs: number
  message: string
}

const DEFAULT_OPTIONS: LivenessStatusOptions = {
  pollIntervalMs: 60_000,
  staleMs: 120_000,
  slowMs: 3_000,
}

export function resolveLivenessOptions(
  env: NodeJS.ProcessEnv = process.env,
): LivenessStatusOptions {
  const pollIntervalMs = Number(env.MCP_HEALTH_POLL_MS ?? DEFAULT_OPTIONS.pollIntervalMs)
  const staleMs = Number(env.MCP_HEALTH_STALE_MS ?? DEFAULT_OPTIONS.staleMs)
  const slowMs = Number(env.MCP_HEALTH_SLOW_MS ?? DEFAULT_OPTIONS.slowMs)
  return {
    pollIntervalMs: Number.isFinite(pollIntervalMs)
      ? pollIntervalMs
      : DEFAULT_OPTIONS.pollIntervalMs,
    staleMs: Number.isFinite(staleMs) ? staleMs : DEFAULT_OPTIONS.staleMs,
    slowMs: Number.isFinite(slowMs) ? slowMs : DEFAULT_OPTIONS.slowMs,
  }
}

export function deriveLivenessStatus(
  latest: HealthSampleRow | null,
  nowMs: number = Date.now(),
  options: LivenessStatusOptions = DEFAULT_OPTIONS,
): LivenessStatus {
  const base = {
    lastCheckTs: latest?.ts ?? null,
    lastOk: latest?.ok ?? null,
    lastDurationMs: latest?.durationMs ?? null,
    pollIntervalMs: options.pollIntervalMs,
  }

  if (!latest) {
    return {
      ...base,
      state: 'down',
      message: 'No health checks recorded yet.',
    }
  }

  const ageMs = nowMs - latest.ts
  if (ageMs > options.staleMs) {
    return {
      ...base,
      state: 'down',
      message: `Last check ${Math.round(ageMs / 1000)}s ago (stale).`,
    }
  }

  if (!latest.ok) {
    return {
      ...base,
      state: 'down',
      message: `Health check failed (HTTP ${latest.statusCode ?? 'error'}).`,
    }
  }

  if (latest.durationMs >= options.slowMs) {
    return {
      ...base,
      state: 'degraded',
      message: `Health OK but slow (${latest.durationMs} ms).`,
    }
  }

  if (ageMs > options.pollIntervalMs * 1.5) {
    return {
      ...base,
      state: 'degraded',
      message: `Health OK; last check ${Math.round(ageMs / 1000)}s ago.`,
    }
  }

  return {
    ...base,
    state: 'up',
    message: 'MCP HTTP health check is OK.',
  }
}
