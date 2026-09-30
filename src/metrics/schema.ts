import type { DatabaseSync } from 'node:sqlite'

export const METRICS_SCHEMA_SQL = `
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
  asset TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_kind_ts ON events(kind, ts);
CREATE INDEX IF NOT EXISTS idx_events_tool_ts ON events(tool, ts);
CREATE INDEX IF NOT EXISTS idx_events_settlement_ts ON events(settlement, ts);

CREATE TABLE IF NOT EXISTS tool_alias (
  from_name TEXT PRIMARY KEY,
  to_name TEXT NOT NULL
);
`

export function applyMetricsSchema(db: DatabaseSync): void {
  db.exec(METRICS_SCHEMA_SQL)
}
