import { DatabaseSync } from 'node:sqlite'

import type { MetricsWriter } from './MetricsWriter.js'
import { applyMetricsSchema } from './schema.js'
import type { MetricsEvent } from './types.js'

const DEFAULT_QUEUE_MAX = 10_000
const DEFAULT_FLUSH_MS = 500
const DEFAULT_BATCH_SIZE = 100

export type BatchingSqliteWriterOptions = {
  dbPath: string
  queueMax?: number
  flushIntervalMs?: number
  batchSize?: number
}

export function createBatchingSqliteWriter(options: BatchingSqliteWriterOptions): MetricsWriter {
  const queueMax = options.queueMax ?? DEFAULT_QUEUE_MAX
  const flushIntervalMs = options.flushIntervalMs ?? DEFAULT_FLUSH_MS
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE

  const db = new DatabaseSync(options.dbPath)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA synchronous = NORMAL')
  applyMetricsSchema(db)

  const insertSession = db.prepare(`
    INSERT INTO events (ts, kind, actor_key, client_name, client_version)
    VALUES (?, 'session_open', ?, ?, ?)
  `)

  const insertToolCall = db.prepare(`
    INSERT INTO events (
      ts, kind, actor_key, client_name, client_version,
      tool, outcome, duration_ms, settlement, amount_micro_usdc, asset
    )
    VALUES (?, 'tool_call', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const queue: MetricsEvent[] = []
  let dropLogged = false

  const flushBatch = (): void => {
    if (queue.length === 0) {
      return
    }
    const batch = queue.splice(0, batchSize)
    db.exec('BEGIN')
    try {
      for (const event of batch) {
        if (event.kind === 'session_open') {
          insertSession.run(event.ts, event.actorKey, event.clientName, event.clientVersion)
        } else {
          insertToolCall.run(
            event.ts,
            event.actorKey,
            event.clientName,
            event.clientVersion,
            event.tool,
            event.outcome,
            event.durationMs,
            event.settlement,
            event.amountMicroUsdc,
            event.asset,
          )
        }
      }
      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      console.error('[fyp-mcp] metrics flush failed:', error)
    }
  }

  const timer = setInterval(() => {
    flushBatch()
  }, flushIntervalMs)
  timer.unref()

  return {
    enqueue(event: MetricsEvent): void {
      if (queue.length >= queueMax) {
        if (!dropLogged) {
          dropLogged = true
          console.error('[fyp-mcp] metrics queue full; dropping events')
        }
        return
      }
      queue.push(event)
      if (queue.length >= batchSize) {
        flushBatch()
      }
    },
    flush(): void {
      flushBatch()
    },
    close(): void {
      clearInterval(timer)
      flushBatch()
      db.close()
    },
  }
}
