import type { MetricsWriter } from './MetricsWriter.js'

export const noopMetricsWriter: MetricsWriter = {
  enqueue() {},
  flush() {},
  close() {},
}
