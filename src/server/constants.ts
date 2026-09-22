export const SERVER_NAME = 'FeelYourProtocol'
export const SERVER_VERSION = '0.1.0'

export const TOOL_DESCRIBE_CAPABILITIES = 'describe_capabilities'
export const TOOL_RUN_BYTECODE = 'run_bytecode'
export const TOOL_RUN_TRANSACTION = 'run_transaction'
export const TOOL_RUN_BLOCK = 'run_block'
export const TOOL_GENERATE_ARTIFACT = 'generate_artifact'
export const TOOL_INSPECT_ARTIFACT = 'inspect_artifact'

export const TOOL_NAMES = [
  TOOL_DESCRIBE_CAPABILITIES,
  TOOL_RUN_BYTECODE,
  TOOL_RUN_TRANSACTION,
  TOOL_RUN_BLOCK,
  TOOL_GENERATE_ARTIFACT,
  TOOL_INSPECT_ARTIFACT,
] as const
