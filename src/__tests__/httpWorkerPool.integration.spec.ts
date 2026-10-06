import type { AddressInfo } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'

import { WorkerPool } from '../engine/WorkerPool.js'
import { createHttpApp } from '../http/createHttpApp.js'
import { extractTextContent } from './helpers.js'

const gatewayRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const engineWorkerPath = path.join(gatewayRoot, 'dist/engine/worker/engineWorker.js')

// JUMPDEST PUSH1 0 JUMP: burns gas until the limit, no early exit.
const GAS_BURN_LOOP = '0x5b600056'

describe('HTTP gateway with the engine worker pool', () => {
  const pool = new WorkerPool({ size: 1, createWorker: () => new Worker(engineWorkerPath) })
  const app = createHttpApp({ allowedHosts: ['127.0.0.1', 'localhost'], processor: pool })
  const httpServer = app.listen(0, '127.0.0.1')
  let client: Client

  beforeAll(async () => {
    await pool.start()
    await new Promise<void>((resolve) => {
      if (httpServer.listening) {
        resolve()
        return
      }
      httpServer.once('listening', () => resolve())
    })
    const { port } = httpServer.address() as AddressInfo
    client = new Client({ name: 'pool-test', version: '0' })
    await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`)))
  })

  afterAll(async () => {
    await client.close()
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => (error ? reject(error) : resolve()))
    })
    await pool.close()
  })

  it('runs run_bytecode through the worker', async () => {
    const result = await client.callTool(
      { name: 'run_bytecode', arguments: { bytecode: '0x6001600101' } },
      CallToolResultSchema,
    )

    expect(result.isError).not.toBe(true)
    expect(JSON.parse(extractTextContent(result))).toMatchObject({ success: true, gasUsed: '9' })
  })

  it('keeps the engine error code in the tool result', async () => {
    const result = await client.callTool(
      { name: 'run_bytecode', arguments: { bytecode: '0x00', gasLimit: '31000000' } },
      CallToolResultSchema,
    )

    expect(result.isError).toBe(true)
    expect(extractTextContent(result)).toContain('gas_limit_too_high')
  })

  it('answers /healthz while a heavy call is still running', async () => {
    let heavyDone = false
    const heavy = client
      .callTool(
        { name: 'run_bytecode', arguments: { bytecode: GAS_BURN_LOOP, gasLimit: '30000000' } },
        CallToolResultSchema,
      )
      .then((result) => {
        heavyDone = true
        return result
      })
    await new Promise((resolve) => setTimeout(resolve, 100))

    await request(app).get('/healthz').expect(200)
    const healthAnsweredFirst = !heavyDone

    expect(healthAnsweredFirst).toBe(true)
    expect((await heavy).isError).not.toBe(true)
  })
})
