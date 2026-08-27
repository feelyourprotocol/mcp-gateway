import type { Express, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

import { createGatewayServer } from "../bootstrap/createGateway.js";
import {
  SERVER_NAME,
  SERVER_VERSION,
  TOOL_NAMES,
} from "../server/constants.js";

export type CreateHttpAppOptions = {
  allowedHosts?: string[];
};

export function createHttpApp(options: CreateHttpAppOptions = {}): Express {
  const allowedHosts = options.allowedHosts ?? [
    "mcp.feelyourprotocol.org",
    "localhost",
    "127.0.0.1",
  ];

  const app = createMcpExpressApp({
    host: "127.0.0.1",
    allowedHosts,
  });

  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.get("/healthz", (_req, res) => {
    res.json({
      status: "ok",
      service: SERVER_NAME,
      version: SERVER_VERSION,
      tools: [...TOOL_NAMES],
    });
  });

  app.post("/mcp", (req, res) => {
    void handleMcpRequest(req, res);
  });

  app.get("/mcp", (req, res) => {
    void handleMcpRequest(req, res);
  });

  app.delete("/mcp", (req, res) => {
    void handleMcpRequest(req, res);
  });

  async function handleMcpRequest(req: Request, res: Response): Promise<void> {
    const sessionHeader = req.headers["mcp-session-id"];
    const sessionId =
      typeof sessionHeader === "string" ? sessionHeader : undefined;

    try {
      let transport: StreamableHTTPServerTransport | undefined;

      if (sessionId) {
        transport = transports.get(sessionId);
        if (!transport) {
          res.status(404).json({
            jsonrpc: "2.0",
            error: { code: -32000, message: "Session not found" },
            id: null,
          });
          return;
        }
      } else if (req.method === "POST" && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId) => {
            if (transport) {
              transports.set(newSessionId, transport);
            }
          },
        });

        transport.onclose = () => {
          const sid = transport?.sessionId;
          if (sid) {
            transports.delete(sid);
          }
        };

        const server = createGatewayServer();
        await server.connect(transport);
      } else {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: missing session or not an initialize POST",
          },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("[fyp-mcp] MCP HTTP error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  }

  return app;
}
