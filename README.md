# mcp-gateway

MCP server gateway for [Feel Your Protocol](https://feelyourprotocol.org) — exposes the [`mcp-execution-engine`](https://github.com/feelyourprotocol/mcp-execution-engine) to AI agents over stdio (local) and HTTP (later).

## Architecture

```
Agent (Cursor, Claude Desktop, …)
  → MCP stdio transport
    → mcp-gateway (tools + TaskProcessor)
      → mcp-execution-engine (stateless EthereumJS)
```

| Layer | This repo | Role |
| --- | --- | --- |
| **Gateway** | `mcp-gateway` | MCP transport, tool registry, payments seam (later) |
| **Engine** | `mcp-execution-engine` | Pure simulation core — no HTTP or MCP |

Docs: [mcp-docs.feelyourprotocol.org](https://mcp-docs.feelyourprotocol.org)

## Tools (v0.1.0)

| MCP tool | Shape | Status |
| --- | --- | --- |
| `describe_capabilities` | probe | Shipped (stdio) |
| `simulate_evm_bytecode` | simulate | Shipped (stdio) |

## Local development

```bash
# From feelyourprotocol/mcp-execution-engine
npm ci && npm run build

# From feelyourprotocol/mcp-gateway
npm ci
npm run test:ci    # build + vitest
npm start          # stdio MCP server (for agent config)
```

### Cursor / Claude Desktop

```json
{
  "mcpServers": {
    "feel-your-protocol": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-gateway/dist/index.js"]
    }
  }
}
```

Build first (`npm run build`). Use an absolute path to `dist/index.js`.

**After pulling or changing gateway code:** run `npm run build` again, then **restart** the MCP server in Cursor (Settings → MCP → restart `feel-your-protocol`, or reload the window). Cursor caches the tool list from the running process — it will not pick up new tools until restart.

On startup the server logs to **stderr** (visible in MCP logs):

```
[fyp-mcp] FeelYourProtocol-EVM v0.1.0 ready — tools: describe_capabilities, simulate_evm_bytecode
```

If you only see `describe_capabilities` in that line, the running binary is stale.

## License

MIT
