import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";

import {
  SERVER_NAME,
  TOOL_DESCRIBE_CAPABILITIES,
} from "../server/constants.js";

const gatewayRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const serverEntry = path.join(gatewayRoot, "dist/index.js");

describe("MCP gateway (stdio integration)", () => {
  let client: Client | undefined;

  afterEach(async () => {
    await client?.close();
    client = undefined;
  });

  it("lists describe_capabilities tool", async () => {
    client = await connectClient();
    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name)).toContain(
      TOOL_DESCRIBE_CAPABILITIES,
    );
    expect(
      tools.find((tool) => tool.name === TOOL_DESCRIBE_CAPABILITIES)
        ?.description,
    ).toMatch(/Probe what this server supports/i);
  });

  it("returns capability registry via describe_capabilities", async () => {
    client = await connectClient();
    const result = await client.callTool(
      {
        name: TOOL_DESCRIBE_CAPABILITIES,
        arguments: {},
      },
      CallToolResultSchema,
    );

    expect(result.isError).not.toBe(true);

    const text = extractTextContent(result);
    const payload = JSON.parse(text) as {
      engineVersion: string;
      namedForks: { id: string }[];
      eips: { eip: number }[];
      ceilings: { maxGasLimit: string };
    };

    expect(payload.engineVersion).toBe("0.1.0");
    expect(payload.namedForks.some((fork) => fork.id === "amsterdam")).toBe(
      true,
    );
    expect(payload.eips.some((eip) => eip.eip === 8024)).toBe(true);
    expect(BigInt(payload.ceilings.maxGasLimit)).toBe(30_000_000n);
  });
});

async function connectClient(): Promise<Client> {
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverEntry],
    cwd: gatewayRoot,
    stderr: "pipe",
  });

  const nextClient = new Client({ name: "fyp-gateway-test", version: "1.0.0" });
  await nextClient.connect(transport);

  const serverInfo = nextClient.getServerVersion();
  expect(serverInfo?.name).toBe(SERVER_NAME);

  return nextClient;
}

function extractTextContent(result: unknown): string {
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
