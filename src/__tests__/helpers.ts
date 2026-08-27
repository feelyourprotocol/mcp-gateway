import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SimulateBytecodeInput } from "@feelyourprotocol/mcp-execution-engine";

const gatewayRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const engineLabRoot = path.join(gatewayRoot, "../mcp-execution-engine/lab");

export function readEngineLabInput<T = SimulateBytecodeInput>(
  shape: string,
  exampleId: string,
): T {
  const filePath = path.join(
    engineLabRoot,
    "shapes",
    shape,
    "examples",
    exampleId,
    "input.json",
  );
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

/** EIP-8024 EXCHANGE demo: stack [1,2,3,4] → EXCHANGE(2,3) → [1,4,3,2] */
export const EXCHANGE_AMSTERDAM_BYTECODE = "0x6001600260036004e88e00";

export function extractTextContent(result: unknown): string {
  if (typeof result !== "object" || result === null || !("content" in result)) {
    throw new Error("Expected tool result with content");
  }

  const content = result.content;
  if (!Array.isArray(content) || content.length === 0) {
    throw new Error("Expected non-empty tool content array");
  }

  const first = content[0];
  if (
    typeof first !== "object" ||
    first === null ||
    !("type" in first) ||
    first.type !== "text" ||
    !("text" in first) ||
    typeof first.text !== "string"
  ) {
    throw new Error("Expected text content block");
  }

  return first.text;
}
