import type { DatabaseSync } from 'node:sqlite'

const CREATE_EVENTS_TABLE = `
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  kind TEXT NOT NULL,
  actor_key TEXT,
  client_name TEXT,
  client_version TEXT,
  tool TEXT,
  outcome TEXT,
  duration_ms INTEGER,
  settlement TEXT,
  amount_micro_usdc INTEGER,
  asset TEXT,
  fork_id TEXT,
  eips_json TEXT
);
`

const CREATE_TOOL_ALIAS_TABLE = `
CREATE TABLE IF NOT EXISTS tool_alias (
  from_name TEXT PRIMARY KEY,
  to_name TEXT NOT NULL
);
`

const CREATE_HEALTH_SAMPLES_TABLE = `
CREATE TABLE IF NOT EXISTS health_samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  ok INTEGER NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER NOT NULL
);
`

const EVENT_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts)',
  'CREATE INDEX IF NOT EXISTS idx_events_kind_ts ON events(kind, ts)',
  'CREATE INDEX IF NOT EXISTS idx_events_tool_ts ON events(tool, ts)',
  'CREATE INDEX IF NOT EXISTS idx_events_settlement_ts ON events(settlement, ts)',
]

const HEALTH_INDEXES = ['CREATE INDEX IF NOT EXISTS idx_health_samples_ts ON health_samples(ts)']

/** Columns added after first deploy — guarded ALTER for existing SQLite files. */
const COLUMN_MIGRATIONS: { name: string; ddl: string }[] = [
  { name: 'actor_key', ddl: 'TEXT' },
  { name: 'client_name', ddl: 'TEXT' },
  { name: 'client_version', ddl: 'TEXT' },
  { name: 'tool', ddl: 'TEXT' },
  { name: 'outcome', ddl: 'TEXT' },
  { name: 'duration_ms', ddl: 'INTEGER' },
  { name: 'settlement', ddl: 'TEXT' },
  { name: 'amount_micro_usdc', ddl: 'INTEGER' },
  { name: 'asset', ddl: 'TEXT' },
  { name: 'fork_id', ddl: 'TEXT' },
  { name: 'eips_json', ddl: 'TEXT' },
]

function ensureEventColumns(db: DatabaseSync): void {
  const rows = db.prepare('PRAGMA table_info(events)').all() as { name: string }[]
  const existing = new Set(rows.map((row) => row.name))
  for (const column of COLUMN_MIGRATIONS) {
    if (!existing.has(column.name)) {
      db.exec(`ALTER TABLE events ADD COLUMN ${column.name} ${column.ddl}`)
    }
  }
}

export function applyMetricsSchema(db: DatabaseSync): void {
  db.exec(CREATE_EVENTS_TABLE)
  db.exec(CREATE_TOOL_ALIAS_TABLE)
  db.exec(CREATE_HEALTH_SAMPLES_TABLE)
  ensureEventColumns(db)
  for (const indexSql of EVENT_INDEXES) {
    db.exec(indexSql)
  }
  for (const indexSql of HEALTH_INDEXES) {
    db.exec(indexSql)
  }
}

/** @deprecated Use applyMetricsSchema — kept for tests that referenced the old export. */
export const METRICS_SCHEMA_SQL = `${CREATE_EVENTS_TABLE}${CREATE_TOOL_ALIAS_TABLE}${EVENT_INDEXES.join('')}`
