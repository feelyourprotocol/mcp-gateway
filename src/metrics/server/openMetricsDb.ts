import { DatabaseSync } from 'node:sqlite'

import { applyMetricsSchema } from '../schema.js'

export function openMetricsDb(dbPath: string, readOnly = false): DatabaseSync {
  const db = readOnly ? new DatabaseSync(dbPath, { readOnly: true }) : new DatabaseSync(dbPath)
  if (!readOnly) {
    db.exec('PRAGMA journal_mode = WAL')
    db.exec('PRAGMA synchronous = NORMAL')
    applyMetricsSchema(db)
  }
  return db
}
