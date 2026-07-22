import { EngineError } from "@feelyourprotocol/mcp-execution-engine";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export function jsonToolResult(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function toolError(message: string, code?: string): CallToolResult {
  const suffix = code ? ` (${code})` : "";
  return {
    content: [
      {
        type: "text",
        text: message + suffix,
      },
    ],
    isError: true,
  };
}

export function toMcpToolError(error: unknown): CallToolResult {
  if (error instanceof EngineError) {
    return toolError(error.message, error.code);
  }

  if (error instanceof Error) {
    return toolError(error.message);
  }

  return toolError("Unknown error");
}

export async function runToolHandler<T>(
  handler: () => Promise<T>,
): Promise<CallToolResult> {
  try {
    const result = await handler();
    return jsonToolResult(result);
  } catch (error) {
    return toMcpToolError(error);
  }
}
