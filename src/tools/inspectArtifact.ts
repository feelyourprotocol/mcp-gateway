import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { TaskProcessor } from '../engine/TaskProcessor.js'
import {
  inspectArtifactInputShape,
  parseInspectArtifactInput,
} from '../schemas/inspectArtifact.schema.js'
import { TOOL_INSPECT_ARTIFACT } from '../server/constants.js'
import { registerObservedTool } from './registerObservedTool.js'
import { INSPECT_ARTIFACT_DESCRIPTION } from './toolDescriptions.js'

export function registerInspectArtifactTool(server: McpServer, processor: TaskProcessor): void {
  registerObservedTool(
    server,
    TOOL_INSPECT_ARTIFACT,
    {
      description: INSPECT_ARTIFACT_DESCRIPTION,
      inputSchema: inspectArtifactInputShape,
    },
    async (input) =>
      processor.submit({ kind: 'inspect', payload: parseInspectArtifactInput(input) }),
  )
}
