import { describe, expect, it } from 'vitest'

import { DEMO_CARDS } from '@/fixtures/demoCatalog'
import { bucketStarts } from '@/fixtures/demoHistory'
import { demoQueryForCard } from '@/fixtures/demoQueries'

describe('demoHistory', () => {
  it('fills the selected range at the selected grain', () => {
    expect(bucketStarts('24h', 'hour')).toHaveLength(24)
    expect(bucketStarts('7d', 'day').length).toBeGreaterThanOrEqual(7)
    expect(bucketStarts('30d', 'day').length).toBeGreaterThan(bucketStarts('7d', 'day').length)
    expect(bucketStarts('30d', 'week').length).toBeLessThan(bucketStarts('30d', 'day').length)
  })

  it('keeps liveness headline stable across grains and moves it across windows', () => {
    const card = DEMO_CARDS.find((c) => c.id === 'mcp-liveness-timeline')!
    const day = demoQueryForCard(card, '7d', 'day')
    const hour = demoQueryForCard(card, '7d', 'hour')
    const wider = demoQueryForCard(card, '30d', 'day')
    expect(day.summary).toBe(hour.summary)
    expect(wider.summary).not.toBe(day.summary)
    expect(day.series.some((row) => row.value < 80)).toBe(true)
    expect(day.series.some((row) => row.value === 100)).toBe(true)
    expect(hour.series.filter((row) => row.value === 0).length).toBeGreaterThan(2)
  })

  it('grows session and fingerprint headlines with the range', () => {
    const sessions = DEMO_CARDS.find((c) => c.id === 'sessions')!
    const fingerprints = DEMO_CARDS.find((c) => c.id === 'distinct-fingerprints')!
    const daySessions = demoQueryForCard(sessions, '24h', 'hour').summary
    const weekSessions = demoQueryForCard(sessions, '7d', 'day').summary
    const monthSessions = demoQueryForCard(sessions, '30d', 'day').summary
    expect(weekSessions).toBeGreaterThan(daySessions)
    expect(monthSessions).toBeGreaterThan(weekSessions)
    const weekActors = demoQueryForCard(fingerprints, '7d', 'day')
    const bucketSum = weekActors.series.reduce((sum, row) => sum + row.value, 0)
    expect(weekActors.summary).toBeLessThan(bucketSum)
    expect(demoQueryForCard(fingerprints, '30d', 'day').summary).toBeGreaterThan(weekActors.summary)
  })

  it('uses one time grid for every stacked bar chart', () => {
    const ids = ['tool-calls', 'hardforks', 'eip-numbers', 'tool-errors', 'settlement-mix']
    const counts = (grain: 'hour' | 'day') =>
      ids.map((id) => {
        const card = DEMO_CARDS.find((c) => c.id === id)!
        const result = demoQueryForCard(card, '7d', grain)
        return new Set(result.series.map((row) => row.bucketStart)).size
      })
    const hour = counts('hour')
    const day = counts('day')
    expect(new Set(hour).size).toBe(1)
    expect(hour[0]).toBe(bucketStarts('7d', 'hour').length)
    expect(new Set(day).size).toBe(1)
    expect(hour[0]).toBeGreaterThan(day[0]! * 10)

    const errors = demoQueryForCard(DEMO_CARDS.find((c) => c.id === 'tool-errors')!, '7d', 'hour')
    expect(errors.series.some((row) => row.value === 0)).toBe(true)
    expect(errors.series.some((row) => row.value > 0)).toBe(true)
    expect(errors.summary).toBe(
      demoQueryForCard(DEMO_CARDS.find((c) => c.id === 'tool-errors')!, '7d', 'day').summary,
    )
  })

  it('counts distinct client versions and grows the table with the range', () => {
    const card = DEMO_CARDS.find((c) => c.id === 'clients')!
    const day = demoQueryForCard(card, '24h', 'hour')
    const week = demoQueryForCard(card, '7d', 'day')
    const month = demoQueryForCard(card, '30d', 'day')
    const sessionSum = week.series.reduce((sum, row) => sum + row.value, 0)
    expect(week.summary).toBe(week.series.length)
    expect(week.summary).toBeGreaterThan(2)
    expect(sessionSum).toBeGreaterThan(week.summary)
    expect(week.summary).toBeGreaterThan(day.summary)
    expect(month.summary).toBeGreaterThan(week.summary)
    const names = week.series.map((row) => row.series.split('\t')[0])
    expect(names).toContain('cursor-agent')
    expect(new Set(names).size).toBeGreaterThan(1)
    expect(week.series.filter((row) => row.series.startsWith('cursor-agent\t'))).toHaveLength(2)
  })

  it('keeps calls in every hour and spreads tool errors', () => {
    const tools = DEMO_CARDS.find((c) => c.id === 'tool-calls')!
    const hourTools = demoQueryForCard(tools, '7d', 'hour')
    const totals = new Map<number, number>()
    for (const row of hourTools.series) {
      totals.set(row.bucketStart, (totals.get(row.bucketStart) ?? 0) + row.value)
    }
    expect([...totals.values()].every((value) => value > 0)).toBe(true)

    const errors = DEMO_CARDS.find((c) => c.id === 'tool-errors')!
    const week = demoQueryForCard(errors, '7d', 'day')
    const hour = demoQueryForCard(errors, '7d', 'hour')
    expect(week.summary).toBeGreaterThan(20)
    expect(week.summary).toBe(hour.summary)
    const errorTools = new Set(hour.series.filter((row) => row.value > 0).map((row) => row.series))
    expect(errorTools.size).toBeGreaterThan(1)
    expect(errorTools.has('run_bytecode')).toBe(true)
    const errorHours = new Set(
      hour.series.filter((row) => row.value > 0).map((row) => row.bucketStart),
    )
    expect(errorHours.size).toBeGreaterThan(12)
    expect(demoQueryForCard(errors, '30d', 'day').summary).toBeGreaterThan(week.summary)
  })

  it('includes every tool on a 30 day chart', () => {
    const card = DEMO_CARDS.find((c) => c.id === 'tool-calls')!
    const result = demoQueryForCard(card, '30d', 'day')
    const names = new Set(result.series.map((row) => row.series))
    expect(names.has('generate_artifact')).toBe(true)
    expect(names.has('inspect_artifact')).toBe(true)
    expect(result.summary).toBeGreaterThan(demoQueryForCard(card, '7d', 'day').summary)
  })
})
