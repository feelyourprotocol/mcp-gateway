import { AsyncLocalStorage } from 'node:async_hooks'

import type { RequestMetricsContext } from './types.js'

export const metricsRequestContext = new AsyncLocalStorage<RequestMetricsContext>()

export function getRequestMetricsContext(): RequestMetricsContext | undefined {
  return metricsRequestContext.getStore()
}
