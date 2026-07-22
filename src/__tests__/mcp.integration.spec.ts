import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";

import {
  SERVER_NAME,
  TOOL_DESCRIBE_CAPABILITIES,
  TOOL_SIMULATE_EVM_BYTECODE,
} from "../server/constants.js";
import { extractTextContent, readEngineLabInput } from "./helpers.js";

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

  it("lists gateway tools", async () => {
    client = await connectClient();
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name);

    expect(names).toContain(TOOL_DESCRIBE_CAPABILITIES);
    expect(names).toContain(TOOL_SIMULATE_EVM_BYTECODE);
    expect(
      tools.find((tool) => tool.name === TOOL_DESCRIBE_CAPABILITIES)
        ?.description,
    ).toMatch(/Probe what this server supports/i);
    expect(
      tools.find((tool) => tool.name === TOOL_SIMULATE_EVM_BYTECODE)
        ?.description,
    ).toMatch(/Run raw EVM bytecode/i);
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

    const payload = JSON.parse(extractTextContent(result)) as {
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

  it("simulates PUSH1 STOP via simulate_evm_bytecode", async () => {
    client = await connectClient();
    const input = readEngineLabInput("simulate", "01-push1-stop");
    const result = await client.callTool(
      {
        name: TOOL_SIMULATE_EVM_BYTECODE,
        arguments: { ...input },
      },
      CallToolResultSchema,
    );

    expect(result.isError).not.toBe(true);

    const payload = JSON.parse(extractTextContent(result)) as {
      success: boolean;
      gasUsed: string;
      provenance: {
        engineVersion: string;
        forkConfig: { baseHardfork: string };
      };
      steps?: { op: string }[];
    };

    expect(payload.success).toBe(true);
    expect(BigInt(payload.gasUsed)).toBeGreaterThan(0n);
    expect(payload.provenance.engineVersion).toBe("0.1.0");
    expect(payload.provenance.forkConfig.baseHardfork).toBe("amsterdam");
    expect(payload.steps?.[0]?.op).toBe("PUSH1");
  });

  it("simulates DUPN amsterdam via simulate_evm_bytecode", async () => {
    client = await connectClient();
    const input = readEngineLabInput("simulate", "02-dupn-amsterdam");
    const result = await client.callTool(
      {
        name: TOOL_SIMULATE_EVM_BYTECODE,
        arguments: { ...input },
      },
      CallToolResultSchema,
    );

    expect(result.isError).not.toBe(true);

    const payload = JSON.parse(extractTextContent(result)) as {
      success: boolean;
      finalStack: string[];
      steps?: { op: string }[];
    };

    expect(payload.success).toBe(true);
    expect(payload.finalStack.slice(0, 3)).toEqual(["0x1", "0x11", "0x10"]);
    expect(payload.steps?.some((step) => step.op === "DUPN")).toBe(true);
  });

  it("returns MCP error for invalid simulate_evm_bytecode input", async () => {
    client = await connectClient();
    const result = await client.callTool(
      {
        name: TOOL_SIMULATE_EVM_BYTECODE,
        arguments: { bytecode: "" },
      },
      CallToolResultSchema,
    );

    expect(result.isError).toBe(true);
    expect(extractTextContent(result)).toMatch(/bytecode/i);
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
