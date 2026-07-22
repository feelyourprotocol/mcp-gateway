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
| `simulate_evm_bytecode` | simulate | Planned (Step 3D) |

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

## License

MIT
