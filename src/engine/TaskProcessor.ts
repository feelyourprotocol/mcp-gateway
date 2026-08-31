import type { SimulateBytecodeInput } from '@feelyourprotocol/mcp-execution-engine'

export type SimulationTask =
  | { kind: 'simulate'; payload: SimulateBytecodeInput }
  | { kind: 'probe' }

export interface TaskProcessor {
  submit(task: SimulationTask): Promise<unknown>
}
