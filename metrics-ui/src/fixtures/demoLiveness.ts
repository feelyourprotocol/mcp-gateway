import type { LivenessStatus } from '@/types/liveness'

export const DEMO_LIVENESS: LivenessStatus = {
  state: 'up',
  lastCheckTs: Date.now() - 45_000,
  lastOk: true,
  lastDurationMs: 38,
  pollIntervalMs: 60_000,
  message: 'MCP HTTP health check is OK.',
}
