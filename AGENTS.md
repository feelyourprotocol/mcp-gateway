# Agent notes

Tool-agnostic entrypoint for coding agents working in **`mcp-gateway`**.

**Read this file first.** Then load [`.cursor/rules/mcp-surface.mdc`](.cursor/rules/mcp-surface.mdc).

Depends one-way on [`mcp-execution-engine`](../mcp-execution-engine/) via `LocalTaskProcessor`. Human docs: [mcp-docs.feelyourprotocol.org](https://mcp-docs.feelyourprotocol.org/use/introduction.html).

## What this repo is

MCP transport + tool registry. Maps generic MCP tools to engine query shapes. No simulation logic here.

```
Agent → mcp-gateway (this repo) → mcp-execution-engine → EthereumJS
```

## MCP identity

| Constant | Value | Notes |
| --- | --- | --- |
| `SERVER_NAME` | `FeelYourProtocol` | MCP handshake `name` — product id, not `-EVM` (server scope is broader than EVM) |
| Config key (docs) | `feel-your-protocol` | User-chosen in `mcp.json`; kebab-case |
| CLI / logs | `fyp-mcp` | Bin and stderr prefix |

## Live tools (v0.1)

| MCP tool | Engine call |
| --- | --- |
| `describe_capabilities` | `describeCapabilities()` |
| `run_bytecode` | `simulateBytecode()` |
| `run_transaction` | `runTransaction()` |

Do **not** add per-EIP MCP tools (e.g. `simulate_eip8024`). EIP coverage is advertised via tool descriptions + live probe output.

## Repo layout

| Path | Role |
| --- | --- |
| `src/tools/` | MCP tool registration + descriptions |
| `src/schemas/` | Zod input shapes (mirror `schemas/*.json` for docs site) |
| `src/engine/TaskProcessor.ts` | Seam for worker pool / queue later |
| `src/index.ts` | stdio entry |
| `src/http/` | HTTP transport (planned production) |

## Adding or changing a tool

1. Implement engine support first (if new query shape)
2. Extend `TaskProcessor` + `LocalTaskProcessor`
3. Add `src/tools/*.ts`, register in `registerTools.ts`
4. Add Zod schema + JSON schema copy for mcp-docs
5. Update `TOOL_NAMES` in `src/server/constants.ts`
6. Integration tests in `src/__tests__/mcp.integration.spec.ts`
7. Update mcp-docs `use/tools/` page

## Docs map

| Audience | Where |
| --- | --- |
| Human MCP users | [mcp-docs/use/](https://mcp-docs.feelyourprotocol.org/use/introduction.html) |
| Engine internals | [mcp-docs/internals/](https://mcp-docs.feelyourprotocol.org/internals/architecture.html) + [mcp-execution-engine/AGENTS.md](../mcp-execution-engine/AGENTS.md) |

## Habits

- Rebuild after changes: `npm run build` — Cursor must restart MCP server to pick up tools
- Finish with `npm run typecheck`, `npm run test:ci`, `npm run lf:ci`
- Do not commit unless asked
