import { describe, expect, it } from "vitest";

import { LocalTaskProcessor } from "../engine/LocalTaskProcessor.js";
import { readEngineLabInput } from "./helpers.js";

describe("LocalTaskProcessor", () => {
  const processor = new LocalTaskProcessor();

  it("probe returns capability registry snapshot", async () => {
    const result = (await processor.submit({ kind: "probe" })) as {
      engineVersion: string;
      namedForks: { id: string }[];
      eips: { eip: number }[];
    };

    expect(result.engineVersion).toBe("0.1.0");
    expect(result.namedForks.some((fork) => fork.id === "amsterdam")).toBe(
      true,
    );
    expect(result.eips.some((eip) => eip.eip === 8024)).toBe(true);
  });

  it("simulate runs PUSH1 STOP lab fixture", async () => {
    const input = readEngineLabInput("simulate", "01-push1-stop");
    const result = (await processor.submit({
      kind: "simulate",
      payload: input,
    })) as {
      success: boolean;
      gasUsed: string;
      provenance: { engineVersion: string };
      steps?: { op: string }[];
    };

    expect(result.success).toBe(true);
    expect(BigInt(result.gasUsed)).toBeGreaterThan(0n);
    expect(result.provenance.engineVersion).toBe("0.1.0");
    expect(result.steps?.[0]?.op).toBe("PUSH1");
  });

  it("simulate runs DUPN amsterdam lab fixture", async () => {
    const input = readEngineLabInput("simulate", "02-dupn-amsterdam");
    const result = (await processor.submit({
      kind: "simulate",
      payload: input,
    })) as {
      success: boolean;
      finalStack: string[];
      steps?: { op: string }[];
    };

    expect(result.success).toBe(true);
    expect(result.finalStack.slice(0, 3)).toEqual(["0x1", "0x11", "0x10"]);
    expect(result.steps?.some((step) => step.op === "DUPN")).toBe(true);
  });
});
