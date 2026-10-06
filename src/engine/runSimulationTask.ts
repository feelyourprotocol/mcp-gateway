import {
  describeCapabilities,
  generateArtifact,
  inspectArtifact,
  runBlock,
  runTransaction,
  simulateBytecode,
} from '@feelyourprotocol/mcp-execution-engine'

import type { SimulationTask } from './TaskProcessor.js'

/** The one place a task kind maps to an engine call. Shared by the local processor and the worker. */
export async function runSimulationTask(task: SimulationTask): Promise<unknown> {
  switch (task.kind) {
    case 'simulate':
      return simulateBytecode(task.payload)
    case 'transaction':
      return runTransaction(task.payload)
    case 'block':
      return runBlock(task.payload)
    case 'generate':
      return generateArtifact(task.payload)
    case 'inspect':
      return await inspectArtifact(task.payload)
    case 'probe':
      return describeCapabilities()
    default: {
      const exhaustive: never = task
      throw new Error(`Unknown task kind: ${(exhaustive as SimulationTask).kind}`)
    }
  }
}
