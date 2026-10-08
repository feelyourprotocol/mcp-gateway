import type { ErrorsQueryResult } from '@/types/errors'
import type { MetricsWindow } from '@/types/metrics'

export function demoErrorsForWindow(window: MetricsWindow): ErrorsQueryResult {
  const now = Date.now()
  return {
    window,
    errors: [
      {
        id: 1,
        ts: now - 3 * 3_600_000,
        tool: 'run_bytecode',
        forkId: 'glamsterdam',
        eips: [7928],
        diagnostic: {
          code: 'invalid_bytecode',
          field: 'bytecode',
          message: 'Bytecode hex must have an even number of digits',
          facts: { 'bytecode.shape': 'odd_length', 'bytecode.chars': 7 },
        },
      },
    ],
  }
}
