import type {
  RunBlockInput,
  RunTransactionInput,
  SimulateBytecodeInput,
} from '@feelyourprotocol/mcp-execution-engine'

export type SimulationTask =
  | { kind: 'simulate'; payload: SimulateBytecodeInput }
  | { kind: 'transaction'; payload: RunTransactionInput }
  | { kind: 'block'; payload: RunBlockInput }
  | { kind: 'probe' }

export interface TaskProcessor {
  submit(task: SimulationTask): Promise<unknown>
}
