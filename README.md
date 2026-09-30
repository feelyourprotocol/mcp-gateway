# mcp-gateway

[![CI](https://github.com/feelyourprotocol/mcp-gateway/actions/workflows/ci.yml/badge.svg)](https://github.com/feelyourprotocol/mcp-gateway/actions/workflows/ci.yml)

MCP server gateway for [Feel Your Protocol](https://feelyourprotocol.org) — exposes the [`mcp-execution-engine`](https://github.com/feelyourprotocol/mcp-execution-engine) to AI agents over stdio (local) and HTTP (later).

**Repo:** [github.com/feelyourprotocol/mcp-gateway](https://github.com/feelyourprotocol/mcp-gateway) · **Release:** v0.1.0 (stdio, local agents)

## Architecture

```
Agent (Cursor, Claude Desktop, …)
  → MCP stdio transport
    → mcp-gateway (tools + TaskProcessor)
      → mcp-execution-engine (isolated EthereumJS lab)
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
| `run_bytecode` | simulate | Shipped (stdio) |
| `run_transaction` | transaction | Shipped (stdio) |
| `run_block` | block | Shipped (stdio) |
| `generate_artifact` | generate | Shipped (stdio) |
| `inspect_artifact` | inspect | Shipped (stdio) |

## Local development

Clone the execution engine as a **sibling directory** (required — gateway depends on `file:../mcp-execution-engine`):

```bash
git clone https://github.com/feelyourprotocol/mcp-execution-engine.git
git clone https://github.com/feelyourprotocol/mcp-gateway.git
```

```bash
# From mcp-execution-engine
npm ci && npm run build

# From mcp-gateway
npm ci
npm run test:ci    # build + vitest
npm run build && npm start   # stdio MCP server (for agent config)
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
[fyp-mcp] FeelYourProtocol v0.1.0 ready — tools: describe_capabilities, run_bytecode, run_transaction, run_block, generate_artifact, inspect_artifact
```

If you only see one tool in that line, the running binary is stale.

## Usage metrics (HTTP lab)

Gateway appends events to SQLite when `MCP_METRICS_DB` is set (`session_open`, `tool_call` with optional payment fields for future x402). Operator UI lives in [`metrics-ui/`](./metrics-ui/) (Vue + Tailwind + ECharts).

```bash
npm run start:http          # MCP on :3000
MCP_METRICS_DB=/tmp/events.sqlite MCP_METRICS_PEPPER=dev npm run start:http
MCP_METRICS_DB=/tmp/events.sqlite npm run start:metrics   # after metrics-ui build

cd metrics-ui && npm ci && npm run dev   # :5174 with demo fixtures
npm run metrics-ui:build
```

Production: `fyp-mcp-metrics` on loopback `:3001`, nginx `https://mcp.feelyourprotocol.org/usage/` (basic auth). See `server-config` `aws/roles/health/METRICS.md`.

## JSON schemas

Runtime validation uses Zod in [`src/schemas/`](./src/schemas/). Published JSON copies for agents and mcp-docs live in [`schemas/`](./schemas/) (see [`manifest.json`](./schemas/manifest.json)) — mirror byte-for-byte to `website/mcp-docs/public/schemas/`.

- [`describe_capabilities.input.json`](./schemas/describe_capabilities.input.json)
- [`run_bytecode.input.json`](./schemas/run_bytecode.input.json)
- [`run_transaction.input.json`](./schemas/run_transaction.input.json)
- [`run_block.input.json`](./schemas/run_block.input.json)
- [`generate_artifact.input.json`](./schemas/generate_artifact.input.json)
- [`inspect_artifact.input.json`](./schemas/inspect_artifact.input.json)

## License

MIT

## Lab host

Merges to `main` run [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) (rsync production tree to the AWS lab; engine sibling is not overwritten). Ops and SSH cutover: private `server-config` `aws/hosts/mcp-lab/SETUP-CD.md`.

