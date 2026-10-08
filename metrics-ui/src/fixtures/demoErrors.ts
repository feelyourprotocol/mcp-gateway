import type { ErrorEventRow, ErrorsQueryResult } from '@/types/errors'
import type { MetricsWindow } from '@/types/metrics'

function row(id: number, data: Omit<ErrorEventRow, 'id'>): ErrorEventRow {
  return { id, ...data }
}

export function demoErrorsForWindow(window: MetricsWindow): ErrorsQueryResult {
  const now = Date.now()
  const errors: ErrorEventRow[] = [
    row(1, {
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
    }),
    row(2, {
      ts: now - 4 * 3_600_000,
      tool: 'run_bytecode',
      forkId: 'fusaka',
      eips: [],
      diagnostic: {
        code: 'invalid_bytecode',
        field: 'bytecode',
        message: 'Bytecode must be a hex string',
        facts: { 'bytecode.shape': 'non_hex', 'bytecode.chars': 12 },
      },
    }),
    row(3, {
      ts: now - 5 * 3_600_000,
      tool: 'run_transaction',
      forkId: 'glamsterdam',
      eips: [],
      diagnostic: {
        code: 'invalid_gas_limit',
        field: 'gasLimit',
        message: 'gasLimit must be positive',
        facts: { gasLimit: '-1' },
      },
    }),
    row(4, {
      ts: now - 6 * 3_600_000,
      tool: 'run_transaction',
      forkId: 'glamsterdam',
      eips: [],
      diagnostic: {
        code: 'invalid_address',
        field: 'from',
        message: 'Address must be a 20-byte hex string',
        facts: { 'from.hexDigits': 8, 'from.expectedHexDigits': 40 },
      },
    }),
    row(5, {
      ts: now - 7 * 3_600_000,
      tool: 'run_block',
      forkId: 'osaka',
      eips: [],
      diagnostic: {
        code: 'invalid_input',
        field: 'transactions[0].from',
        message: 'transactions[0]: Provide from',
      },
    }),
    row(6, {
      ts: now - 8 * 3_600_000,
      tool: 'run_bytecode',
      forkId: null,
      eips: [],
      diagnostic: null,
    }),
  ]

  return {
    window,
    errors,
    totalInWindow: errors.length,
    limit: 100,
    truncated: false,
  }
}
