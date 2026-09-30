# MCP usage dashboard (Vue)

Operator UI for gateway usage metrics. Demodata in dev; production is served by `fyp-mcp-metrics` (`dist/metrics/server/index.js`).

```bash
npm install
npm run dev          # http://localhost:5174 — fixtures only
npm run dev:live     # proxy /api → :3001
npm run build
npm run test:unit:ci
npm run test:e2e
```

Build output: `metrics-ui/dist` (referenced by `MCP_METRICS_UI_DIST` on the server).
