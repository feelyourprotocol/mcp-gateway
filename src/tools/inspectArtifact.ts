import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { runToolHandler } from '../errors/toMcpError.js'
import { inspectArtifactInputShape } from '../schemas/inspectArtifact.schema.js'
import { TOOL_INSPECT_ARTIFACT } from '../server/constants.js'
import { INSPECT_ARTIFACT_DESCRIPTION } from './toolDescriptions.js'

export function registerInspectArtifactTool(server: McpServer, processor: TaskProcessor): void {
  server.registerTool(
    TOOL_INSPECT_ARTIFACT,
    {
      description: INSPECT_ARTIFACT_DESCRIPTION,
      inputSchema: inspectArtifactInputShape,
    },
    async (input) =>
      runToolHandler(async () => {
        return processor.submit({ kind: 'inspect', payload: input })
      }),
  )
}
