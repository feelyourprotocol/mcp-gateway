import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { afterEach, describe, expect, it } from 'vitest'

import { runErrorsQuery } from '../query/runErrorsQuery.js'
import { applyMetricsSchema } from '../schema.js'

describe('runErrorsQuery', () => {
  const tempPaths: string[] = []

  afterEach(() => {
    for (const p of tempPaths) {
      fs.rmSync(p, { force: true })
    }
    tempPaths.length = 0
  })

  it('returns error rows with parsed diagnostic', () => {
    const dbPath = path.join(os.tmpdir(), `fyp-errors-${Date.now()}.sqlite`)
    tempPaths.push(dbPath)
    const db = new DatabaseSync(dbPath)
    applyMetricsSchema(db)
    const now = Date.now()
    const diagnostic = JSON.stringify({
      code: 'invalid_gas_limit',
      field: 'gasLimit',
      message: 'gasLimit must be positive',
    })
    db.prepare(
      `INSERT INTO events (ts, kind, tool, outcome, fork_id, error_json) VALUES (?, 'tool_call', 'run_transaction', 'error', 'glamsterdam', ?)`,
    ).run(now - 1000, diagnostic)

    const result = runErrorsQuery(db, '24h', now)
    expect(result.errors).toHaveLength(1)
    expect(result.totalInWindow).toBe(1)
    expect(result.truncated).toBe(false)
    expect(result.errors[0]?.diagnostic?.code).toBe('invalid_gas_limit')
    db.close()
  })
})
