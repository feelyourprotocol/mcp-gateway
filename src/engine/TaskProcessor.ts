import type {
  GenerateInput,
  InspectInput,
  RunBlockInput,
  RunTransactionInput,
  SimulateBytecodeInput,
} from '@feelyourprotocol/mcp-execution-engine'

export type SimulationTask =
  | { kind: 'simulate'; payload: SimulateBytecodeInput }
  | { kind: 'transaction'; payload: RunTransactionInput }
  | { kind: 'block'; payload: RunBlockInput }
  | { kind: 'generate'; payload: GenerateInput }
  | { kind: 'inspect'; payload: InspectInput }
  | { kind: 'probe' }

export interface TaskProcessor {
  submit(task: SimulationTask): Promise<unknown>
}
