import { afterEach, describe, expect, it } from 'vitest'

import { getMetricsWriter, resetMetricsWriterForTests } from '../globalWriter.js'
import { noopMetricsWriter } from '../noopWriter.js'

describe('getMetricsWriter', () => {
  afterEach(() => {
    resetMetricsWriterForTests()
    delete process.env.MCP_METRICS_DB
  })

  it('returns noop when MCP_METRICS_DB is unset', () => {
    expect(getMetricsWriter()).toBe(noopMetricsWriter)
  })
})
