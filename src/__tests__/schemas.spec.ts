import { describe, expect, it } from "vitest";

import {
  compareEvmVariantsInputSchema,
  parseCompareEvmVariantsInput,
} from "../schemas/compareEvmVariants.schema.js";
import {
  parseSimulateEvmBytecodeInput,
  simulateEvmBytecodeInputSchema,
} from "../schemas/simulateEvmBytecode.schema.js";

describe("simulateEvmBytecodeInputSchema", () => {
  it("requires bytecode", () => {
    expect(() => simulateEvmBytecodeInputSchema.parse({})).toThrow();
  });

  it("rejects empty bytecode string", () => {
    expect(() =>
      simulateEvmBytecodeInputSchema.parse({ bytecode: "" }),
    ).toThrow();
  });

  it("rejects fork without baseHardfork", () => {
    expect(() =>
      simulateEvmBytecodeInputSchema.parse({
        bytecode: "0x600100",
        fork: { eips: [8024] },
      }),
    ).toThrow();
  });

  it("rejects unknown top-level fields", () => {
    expect(() =>
      simulateEvmBytecodeInputSchema.parse({
        bytecode: "0x600100",
        extra: true,
      }),
    ).toThrow();
  });

  it("accepts minimal valid input", () => {
    const parsed = parseSimulateEvmBytecodeInput({ bytecode: "0x600100" });
    expect(parsed.bytecode).toBe("0x600100");
  });

  it("accepts full lab-shaped input", () => {
    const parsed = parseSimulateEvmBytecodeInput({
      bytecode: "0x600100",
      fork: { baseHardfork: "amsterdam", eips: [] },
      gasLimit: "1000000",
      trace: true,
    });

    expect(parsed.fork?.baseHardfork).toBe("amsterdam");
    expect(parsed.trace).toBe(true);
  });

  it("rejects non-string gasLimit", () => {
    expect(() =>
      simulateEvmBytecodeInputSchema.parse({
        bytecode: "0x600100",
        gasLimit: 1_000_000,
      }),
    ).toThrow();
  });

  it("rejects non-boolean trace flag", () => {
    expect(() =>
      simulateEvmBytecodeInputSchema.parse({
        bytecode: "0x600100",
        trace: "true",
      }),
    ).toThrow();
  });

  it("rejects non-numeric eip entries", () => {
    expect(() =>
      simulateEvmBytecodeInputSchema.parse({
        bytecode: "0x600100",
        fork: { baseHardfork: "amsterdam", eips: ["8024"] },
      }),
    ).toThrow();
  });

  it("rejects non-positive eip numbers", () => {
    expect(() =>
      simulateEvmBytecodeInputSchema.parse({
        bytecode: "0x600100",
        fork: { baseHardfork: "amsterdam", eips: [0] },
      }),
    ).toThrow();
  });
});

describe("compareEvmVariantsInputSchema", () => {
  const twoVariants = {
    variants: [
      {
        label: "a",
        bytecode: "0x600100",
        fork: { baseHardfork: "amsterdam", eips: [] },
      },
      {
        label: "b",
        bytecode: "0x6001600200",
        fork: { baseHardfork: "amsterdam", eips: [] },
      },
    ],
  };

  it("requires at least two variants", () => {
    expect(() =>
      compareEvmVariantsInputSchema.parse({
        variants: [twoVariants.variants[0]],
      }),
    ).toThrow();
  });

  it("rejects missing fork on a variant", () => {
    expect(() =>
      compareEvmVariantsInputSchema.parse({
        variants: [
          { label: "a", bytecode: "0x600100" },
          twoVariants.variants[1],
        ],
      }),
    ).toThrow();
  });

  it("accepts lab-shaped compare input", () => {
    const parsed = parseCompareEvmVariantsInput(twoVariants);
    expect(parsed.variants).toHaveLength(2);
    expect(parsed.variants[0]?.label).toBe("a");
  });
});
