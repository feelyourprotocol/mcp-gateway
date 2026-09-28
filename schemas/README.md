# MCP tool input JSON Schemas

Machine-readable tool inputs for agents and mcp-docs. **Not used at gateway runtime.**

| Layer | Path | Role |
| --- | --- | --- |
| Runtime | `src/schemas/*.schema.ts` (Zod) | `registerTool` validation — edit here first |
| Published | `schemas/*.input.json` (this folder) | Canonical JSON copy for repos and docs |
| Hosted | `website/mcp-docs/public/schemas/` | Must match this folder byte-for-byte |

## When you change a tool input

1. Update Zod in `src/schemas/`.
2. Update the matching `*.input.json` here (and `manifest.json` if you add a tool).
3. Copy the same files to `website/mcp-docs/public/schemas/`.
4. Link from the mcp-docs tool page and `runtime-agents.md` if new.
5. Run `npm run test:ci` in gateway (published schema sync test).

`generate_artifact` extends the same fields as `run_block` plus optional `kind`.
