import { describeCapabilities, simulateBytecode } from '@feelyourprotocol/mcp-execution-engine'

import type { SimulationTask, TaskProcessor } from './TaskProcessor.js'

export class LocalTaskProcessor implements TaskProcessor {
  async submit(task: SimulationTask): Promise<unknown> {
    switch (task.kind) {
      case 'simulate':
        return simulateBytecode(task.payload)
      case 'probe':
        return describeCapabilities()
      default: {
        const exhaustive: never = task
        throw new Error(`Unknown task kind: ${(exhaustive as SimulationTask).kind}`)
      }
    }
  }
}
