# MCP usage dashboard (Vue)

Operator UI for gateway usage metrics. Demodata in dev; production is served by `fyp-mcp-metrics` (`dist/metrics/server/index.js`).

```bash
npm install
npm run dev          # http://localhost:5177 — fixtures only (override: PORT=5180 npm run dev)
npm run dev:live     # proxy /api → :3001
npm run build
npm run test:unit:ci
npm run test:e2e
```

Build output: `metrics-ui/dist` (referenced by `MCP_METRICS_UI_DIST` on the server). Production builds use `base: '/usage/'` so assets and `/api/*` resolve under the nginx `/usage/` location.
