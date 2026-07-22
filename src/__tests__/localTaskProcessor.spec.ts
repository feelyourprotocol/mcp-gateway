import { describe, expect, it } from "vitest";

import { LocalTaskProcessor } from "../engine/LocalTaskProcessor.js";

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
});
