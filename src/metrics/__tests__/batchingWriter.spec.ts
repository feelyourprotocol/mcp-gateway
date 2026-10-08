import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { afterEach, describe, expect, it } from 'vitest'

import { createBatchingSqliteWriter } from '../batchingSqliteWriter.js'

describe('batchingSqliteWriter', () => {
  const tempPaths: string[] = []

  afterEach(() => {
    for (const p of tempPaths) {
      fs.rmSync(p, { force: true })
    }
    tempPaths.length = 0
  })

  it('persists session and tool_call rows after flush', () => {
    const dbPath = path.join(os.tmpdir(), `fyp-metrics-${Date.now()}.sqlite`)
    tempPaths.push(dbPath)

    const writer = createBatchingSqliteWriter({ dbPath, flushIntervalMs: 60_000 })
    writer.enqueue({
      kind: 'session_open',
      ts: 1_700_000_000_000,
      actorKey: 'abc',
      clientName: 'cursor',
      clientVersion: '1',
    })
    writer.enqueue({
      kind: 'tool_call',
      ts: 1_700_000_100_000,
      actorKey: 'abc',
      clientName: 'cursor',
      clientVersion: '1',
      tool: 'run_bytecode',
      outcome: 'ok',
      durationMs: 12,
      settlement: 'unpaid',
      amountMicroUsdc: null,
      asset: null,
      forkId: 'glamsterdam',
      eipsJson: '[7928]',
    })
    writer.flush()
    writer.close()

    const db = new DatabaseSync(dbPath, { readOnly: true })
    const kinds = db.prepare('SELECT kind, tool FROM events ORDER BY ts').all() as {
      kind: string
      tool: string | null
    }[]
    expect(kinds).toEqual([
      { kind: 'session_open', tool: null },
      { kind: 'tool_call', tool: 'run_bytecode' },
    ])
    const forkRow = db
      .prepare('SELECT fork_id, eips_json FROM events WHERE kind = ?')
      .get('tool_call') as { fork_id: string; eips_json: string }
    expect(forkRow.fork_id).toBe('glamsterdam')
    expect(forkRow.eips_json).toBe('[7928]')
    db.close()
  })

  it('persists error_json on failed tool calls', () => {
    const dbPath = path.join(os.tmpdir(), `fyp-metrics-err-${Date.now()}.sqlite`)
    tempPaths.push(dbPath)
    const writer = createBatchingSqliteWriter({ dbPath, flushIntervalMs: 60_000 })
    writer.enqueue({
      kind: 'tool_call',
      ts: 1_700_000_200_000,
      actorKey: 'abc',
      clientName: 'cursor',
      clientVersion: '1',
      tool: 'run_bytecode',
      outcome: 'error',
      durationMs: 3,
      settlement: 'unpaid',
      amountMicroUsdc: null,
      asset: null,
      forkId: 'glamsterdam',
      eipsJson: null,
      errorJson: JSON.stringify({ code: 'invalid_input', message: 'Provide bytecode' }),
    })
    writer.flush()
    writer.close()

    const db = new DatabaseSync(dbPath, { readOnly: true })
    const row = db.prepare('SELECT error_json FROM events WHERE outcome = ?').get('error') as {
      error_json: string
    }
    expect(JSON.parse(row.error_json).code).toBe('invalid_input')
    db.close()
  })
})
