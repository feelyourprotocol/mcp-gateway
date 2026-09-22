import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import { runToolHandler } from '../errors/toMcpError.js'
import { generateArtifactInputShape } from '../schemas/generateArtifact.schema.js'
import { TOOL_GENERATE_ARTIFACT } from '../server/constants.js'
import { GENERATE_ARTIFACT_DESCRIPTION } from './toolDescriptions.js'

export function registerGenerateArtifactTool(server: McpServer, processor: TaskProcessor): void {
  server.registerTool(
    TOOL_GENERATE_ARTIFACT,
    {
      description: GENERATE_ARTIFACT_DESCRIPTION,
      inputSchema: generateArtifactInputShape,
    },
    async (input) =>
      runToolHandler(async () => {
        return processor.submit({ kind: 'generate', payload: input })
      }),
  )
}
