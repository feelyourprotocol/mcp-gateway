import { runSimulationTask } from './runSimulationTask.js'
import type { SimulationTask, TaskProcessor } from './TaskProcessor.js'

/** Runs the engine on the calling thread. Used for stdio and for tests. Ignores `signal`. */
export class LocalTaskProcessor implements TaskProcessor {
  async submit(task: SimulationTask): Promise<unknown> {
    return runSimulationTask(task)
  }
}
