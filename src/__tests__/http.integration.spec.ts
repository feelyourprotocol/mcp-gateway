import request from "supertest";
import { describe, expect, it } from "vitest";

import { createHttpApp } from "../http/createHttpApp.js";
import {
  SERVER_NAME,
  SERVER_VERSION,
  TOOL_DESCRIBE_CAPABILITIES,
  TOOL_SIMULATE_EVM_BYTECODE,
} from "../server/constants.js";

describe("HTTP gateway", () => {
  const app = createHttpApp({ allowedHosts: ["127.0.0.1", "localhost"] });

  it("returns health JSON at GET /healthz", async () => {
    const response = await request(app).get("/healthz").expect(200);

    expect(response.body).toEqual({
      status: "ok",
      service: SERVER_NAME,
      version: SERVER_VERSION,
      tools: [TOOL_DESCRIBE_CAPABILITIES, TOOL_SIMULATE_EVM_BYTECODE],
    });
  });

  it("rejects POST /mcp without initialize session", async () => {
    const response = await request(app)
      .post("/mcp")
      .set("Host", "127.0.0.1")
      .send({ jsonrpc: "2.0", method: "tools/list", id: 1 })
      .expect(400);

    expect(response.body.error?.message).toMatch(/initialize/i);
  });
});
