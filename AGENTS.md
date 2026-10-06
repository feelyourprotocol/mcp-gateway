# Agent notes

Tool-agnostic entrypoint for coding agents working in **`mcp-gateway`**.

**Read this file first.** Then load [`.cursor/rules/`](.cursor/rules/) — `mcp-surface.mdc`, `git.mdc` (defers to the website git rule).

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
| `instructions` | `SERVER_INSTRUCTIONS` | Handshake routing: generic hardfork runs (Amsterdam default) without an EIP |
| Config key (docs) | `feel-your-protocol` | User-chosen in `mcp.json`; kebab-case |
| CLI / logs | `fyp-mcp` | Bin and stderr prefix |

## Live tools (v0.1)

| MCP tool | Engine call |
| --- | --- |
| `describe_capabilities` | `describeCapabilities()` |
| `run_bytecode` | `simulateBytecode()` |
| `run_transaction` | `runTransaction()` |
| `run_block` | `runBlock()` |
| `generate_artifact` | `generateArtifact()` |
| `inspect_artifact` | `inspectArtifact()` |

Do **not** add per-EIP MCP tools (e.g. `simulate_eip8024`) or per-fork tools (e.g. `run_amsterdam`). EIP and named-fork coverage is advertised via server instructions, tool descriptions, and live probe output.

## Repo layout

| Path | Role |
| --- | --- |
| `src/tools/` | MCP tool registration + descriptions |
| `src/schemas/` | Zod input shapes — **runtime source of truth** |
| `schemas/` | Published `*.input.json` + `manifest.json` — mirror to `website/mcp-docs/public/schemas/` |
| `src/engine/TaskProcessor.ts` | Seam: `LocalTaskProcessor` (stdio, tests) or `WorkerPool` (hosted HTTP, shared, one worker per core) |
| `src/engine/runSimulationTask.ts` | The one task-kind to engine-call switch, used by both processors and the worker |
| `src/index.ts` | stdio entry |
| `src/http/` | HTTP transport (planned production) |

## Adding or changing a tool

1. Implement engine support first (if new query shape)
2. Extend `SimulationTask` and `runSimulationTask` (both `LocalTaskProcessor` and the `WorkerPool` worker use it); pass `signal` through `processor.submit`
3. Add `src/tools/*.ts`, register in `registerTools.ts`
4. Add Zod in `src/schemas/`, published JSON in `schemas/` (update `manifest.json`), copy to website `mcp-docs/public/schemas/`
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
