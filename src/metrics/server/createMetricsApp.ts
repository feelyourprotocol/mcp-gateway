import express, { type Express } from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { type HealthPollerHandle, startHealthPoller } from '../healthPoller.js'
import { deriveLivenessStatus, resolveLivenessOptions } from '../livenessStatus.js'
import { getCardDefinition, METRICS_CARD_REGISTRY } from '../query/cardRegistry.js'
import { purgeOldEvents, runCardQuery } from '../query/runCardQuery.js'
import { runErrorsQuery } from '../query/runErrorsQuery.js'
import {
  getLatestHealthSample,
  runHealthLivenessQuery,
  runHealthUptimeQuery,
} from '../query/runHealthLivenessQuery.js'
import type { MetricsGrain, MetricsWindow } from '../query/types.js'
import { defaultGrainForWindow } from '../query/window.js'
import { openMetricsDb } from './openMetricsDb.js'

export type CreateMetricsAppOptions = {
  dbPath: string
  uiDistPath?: string
  /** When false, skips background /healthz polling (tests). Default true. */
  startHealthPoller?: boolean
}

export type MetricsAppBundle = {
  app: Express
  healthPoller: HealthPollerHandle | null
}

const VALID_WINDOWS = new Set<MetricsWindow>(['24h', '7d', '30d'])
const VALID_GRAINS = new Set<MetricsGrain>(['hour', 'day', 'week'])

function defaultUiDistPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url))
  return path.resolve(here, '../../../metrics-ui/dist')
}

export function createMetricsApp(options: CreateMetricsAppOptions): MetricsAppBundle {
  const db = openMetricsDb(options.dbPath, false)
  purgeOldEvents(db)

  const app = express()
  const livenessOptions = resolveLivenessOptions()

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'fyp-mcp-metrics' })
  })

  app.get('/api/liveness/current', (_req, res) => {
    const latest = getLatestHealthSample(db)
    const status = deriveLivenessStatus(latest, Date.now(), livenessOptions)
    res.json(status)
  })

  app.get('/api/cards', (_req, res) => {
    res.json({ cards: METRICS_CARD_REGISTRY })
  })

  app.get('/api/errors', (req, res) => {
    const windowParam = (req.query.window as string | undefined) ?? '7d'
    if (!VALID_WINDOWS.has(windowParam as MetricsWindow)) {
      res.status(400).json({ error: 'invalid window' })
      return
    }
    const window = windowParam as MetricsWindow
    res.json(runErrorsQuery(db, window))
  })

  app.get('/api/cards/:cardId/query', (req, res) => {
    const card = getCardDefinition(req.params.cardId)
    if (!card) {
      res.status(404).json({ error: 'unknown card' })
      return
    }

    const windowParam = (req.query.window as string | undefined) ?? '7d'
    if (!VALID_WINDOWS.has(windowParam as MetricsWindow)) {
      res.status(400).json({ error: 'invalid window' })
      return
    }
    const window = windowParam as MetricsWindow

    const grainParam = (req.query.grain as string | undefined) ?? defaultGrainForWindow(window)
    if (!VALID_GRAINS.has(grainParam as MetricsGrain)) {
      res.status(400).json({ error: 'invalid grain' })
      return
    }
    const grain = grainParam as MetricsGrain

    const result =
      card.dataSource === 'health' && card.chart === 'line'
        ? runHealthUptimeQuery(db, card, window, grain)
        : card.dataSource === 'health'
          ? runHealthLivenessQuery(db, card, window, grain)
          : runCardQuery(db, card, window, grain)
    res.json(result)
  })

  const uiDist = options.uiDistPath ?? process.env.MCP_METRICS_UI_DIST ?? defaultUiDistPath()
  app.use(express.static(uiDist))
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(uiDist, 'index.html'), (error) => {
      if (error) {
        res.status(503).send('Metrics UI not built — run npm run build in metrics-ui/')
      }
    })
  })

  const shouldPoll = options.startHealthPoller !== false
  const healthPoller = shouldPoll ? startHealthPoller({ db }) : null

  return { app, healthPoller }
}
