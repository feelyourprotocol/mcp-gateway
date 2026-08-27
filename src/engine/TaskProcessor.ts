import type {
  CompareVariantsInput,
  SimulateBytecodeInput,
} from "@feelyourprotocol/mcp-execution-engine";

export type SimulationTask =
  | { kind: "simulate"; payload: SimulateBytecodeInput }
  | { kind: "compare"; payload: CompareVariantsInput }
  | { kind: "probe" };

export interface TaskProcessor {
  submit(task: SimulationTask): Promise<unknown>;
}
