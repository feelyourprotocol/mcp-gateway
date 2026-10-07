import type { DatabaseSync } from 'node:sqlite'

import { resolveLivenessOptions } from './livenessStatus.js'

const DEFAULT_HEALTH_URL = 'http://127.0.0.1:3000/healthz'
const DEFAULT_TIMEOUT_MS = 10_000
const RETENTION_DAYS = 30

export type HealthPollerOptions = {
  db: DatabaseSync
  healthUrl?: string
  pollIntervalMs?: number
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export type HealthPollerHandle = {
  tick(): Promise<void>
  stop(): void
}

export function insertHealthSample(
  db: DatabaseSync,
  sample: {
    ts: number
    ok: boolean
    statusCode: number | null
    durationMs: number
  },
): void {
  db.prepare(
    `INSERT INTO health_samples (ts, ok, status_code, duration_ms) VALUES (?, ?, ?, ?)`,
  ).run(sample.ts, sample.ok ? 1 : 0, sample.statusCode, sample.durationMs)
}

export function purgeOldHealthSamples(db: DatabaseSync, nowMs: number = Date.now()): number {
  const cutoff = nowMs - RETENTION_DAYS * 24 * 60 * 60 * 1000
  const result = db.prepare('DELETE FROM health_samples WHERE ts < ?').run(cutoff)
  return Number(result.changes ?? 0)
}

export async function probeHealthUrl(
  healthUrl: string,
  timeoutMs: number,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; statusCode: number | null; durationMs: number }> {
  const started = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(healthUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    const durationMs = Date.now() - started
    let bodyOk = false
    try {
      const body = (await response.json()) as { status?: string }
      bodyOk = body.status === 'ok'
    } catch {
      bodyOk = false
    }
    return {
      ok: response.ok && bodyOk,
      statusCode: response.status,
      durationMs,
    }
  } catch {
    return {
      ok: false,
      statusCode: null,
      durationMs: Date.now() - started,
    }
  } finally {
    clearTimeout(timer)
  }
}

export function startHealthPoller(options: HealthPollerOptions): HealthPollerHandle {
  const livenessOptions = resolveLivenessOptions()
  const healthUrl = options.healthUrl ?? process.env.MCP_HEALTHZ_URL ?? DEFAULT_HEALTH_URL
  const pollIntervalMs = options.pollIntervalMs ?? livenessOptions.pollIntervalMs
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const fetchImpl = options.fetchImpl ?? fetch

  const runTick = async (): Promise<void> => {
    const result = await probeHealthUrl(healthUrl, timeoutMs, fetchImpl)
    insertHealthSample(options.db, {
      ts: Date.now(),
      ok: result.ok,
      statusCode: result.statusCode,
      durationMs: result.durationMs,
    })
    purgeOldHealthSamples(options.db)
  }

  void runTick()
  const timer = setInterval(() => {
    void runTick()
  }, pollIntervalMs)
  timer.unref()

  return {
    tick: runTick,
    stop: () => clearInterval(timer),
  }
}
