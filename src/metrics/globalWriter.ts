import { createBatchingSqliteWriter } from './batchingSqliteWriter.js'
import type { MetricsWriter } from './MetricsWriter.js'
import { noopMetricsWriter } from './noopWriter.js'

let writerInstance: MetricsWriter | undefined

export function getMetricsWriter(): MetricsWriter {
  if (!writerInstance) {
    const dbPath = process.env.MCP_METRICS_DB
    if (!dbPath) {
      writerInstance = noopMetricsWriter
    } else {
      writerInstance = createBatchingSqliteWriter({ dbPath })
    }
  }
  return writerInstance
}

/** Test hook — reset singleton between cases. */
export function resetMetricsWriterForTests(): void {
  if (writerInstance) {
    try {
      writerInstance.close()
    } catch {
      // Writer may already be closed if a test shut down the DB handle.
    }
    writerInstance = undefined
  }
}
