import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { afterEach, describe, expect, it } from 'vitest'

import { applyMetricsSchema } from '../schema.js'

describe('applyMetricsSchema migration', () => {
  const tempPaths: string[] = []

  afterEach(() => {
    for (const p of tempPaths) {
      fs.rmSync(p, { force: true })
    }
    tempPaths.length = 0
  })

  it('adds fork_id and eips_json to an existing events table', () => {
    const dbPath = path.join(os.tmpdir(), `fyp-metrics-old-${Date.now()}.sqlite`)
    tempPaths.push(dbPath)
    const db = new DatabaseSync(dbPath)
    db.exec(`
      CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts INTEGER NOT NULL,
        kind TEXT NOT NULL
      );
    `)
    applyMetricsSchema(db)
    const columns = db
      .prepare('PRAGMA table_info(events)')
      .all()
      .map((row) => (row as { name: string }).name)
    expect(columns).toContain('fork_id')
    expect(columns).toContain('eips_json')
    db.close()
  })
})
