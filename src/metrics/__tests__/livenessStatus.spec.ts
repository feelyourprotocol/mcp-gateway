import { describe, expect, it } from 'vitest'

import { deriveLivenessStatus } from '../livenessStatus.js'

describe('deriveLivenessStatus', () => {
  const now = Date.UTC(2026, 3, 1, 12, 0, 0)
  const options = { pollIntervalMs: 60_000, staleMs: 120_000, slowMs: 3_000 }

  it('returns down when no samples exist', () => {
    expect(deriveLivenessStatus(null, now, options).state).toBe('down')
  })

  it('returns up for a fresh successful check', () => {
    expect(
      deriveLivenessStatus(
        { ts: now - 30_000, ok: true, durationMs: 40, statusCode: 200 },
        now,
        options,
      ).state,
    ).toBe('up')
  })

  it('returns degraded when check is slow but OK', () => {
    expect(
      deriveLivenessStatus(
        { ts: now - 30_000, ok: true, durationMs: 4_000, statusCode: 200 },
        now,
        options,
      ).state,
    ).toBe('degraded')
  })

  it('returns down when the latest check failed', () => {
    expect(
      deriveLivenessStatus(
        { ts: now - 30_000, ok: false, durationMs: 100, statusCode: 503 },
        now,
        options,
      ).state,
    ).toBe('down')
  })

  it('returns down when the latest sample is stale', () => {
    expect(
      deriveLivenessStatus(
        { ts: now - 130_000, ok: true, durationMs: 50, statusCode: 200 },
        now,
        options,
      ).state,
    ).toBe('down')
  })
})
