import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import {
  generateArtifactInputShape,
  parseGenerateArtifactInput,
} from '../schemas/generateArtifact.schema.js'
import { TOOL_GENERATE_ARTIFACT } from '../server/constants.js'
import { registerObservedTool } from './registerObservedTool.js'
import { GENERATE_ARTIFACT_DESCRIPTION } from './toolDescriptions.js'

export function registerGenerateArtifactTool(server: McpServer, processor: TaskProcessor): void {
  registerObservedTool(
    server,
    TOOL_GENERATE_ARTIFACT,
    {
      description: GENERATE_ARTIFACT_DESCRIPTION,
      inputSchema: generateArtifactInputShape,
    },
    async (input) =>
      processor.submit({ kind: 'generate', payload: parseGenerateArtifactInput(input) }),
  )
}
