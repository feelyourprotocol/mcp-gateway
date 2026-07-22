import { describe, expect, it } from "vitest";

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
});
