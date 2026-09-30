import type { MetricsEvent } from './types.js'

export interface MetricsWriter {
  enqueue(event: MetricsEvent): void
  flush(): void
  close(): void
}
