import {
  TOOL_DESCRIBE_CAPABILITIES,
  TOOL_GENERATE_ARTIFACT,
  TOOL_INSPECT_ARTIFACT,
  TOOL_RUN_BLOCK,
  TOOL_RUN_BYTECODE,
  TOOL_RUN_TRANSACTION,
} from '../server/constants.js'

const FORK_TOOLS = new Set<string>([
  TOOL_RUN_BYTECODE,
  TOOL_RUN_TRANSACTION,
  TOOL_RUN_BLOCK,
  TOOL_GENERATE_ARTIFACT,
  TOOL_INSPECT_ARTIFACT,
])

export type ForkFacts = {
  forkId: string | null
  eipsJson: string | null
}

export function forkFactsFromToolInput(tool: string, input: unknown): ForkFacts {
  if (tool === TOOL_DESCRIBE_CAPABILITIES || !FORK_TOOLS.has(tool)) {
    return { forkId: null, eipsJson: null }
  }

  if (typeof input !== 'object' || input === null) {
    return { forkId: 'omitted', eipsJson: null }
  }

  const fork = (input as { fork?: unknown }).fork
  if (fork === undefined) {
    return { forkId: 'omitted', eipsJson: null }
  }

  if (typeof fork !== 'object' || fork === null) {
    return { forkId: null, eipsJson: null }
  }

  const baseHardfork = (fork as { baseHardfork?: unknown }).baseHardfork
  const eips = (fork as { eips?: unknown }).eips

  const forkId = typeof baseHardfork === 'string' && baseHardfork.length > 0 ? baseHardfork : null

  let eipsJson: string | null = null
  if (Array.isArray(eips)) {
    const nums = eips.filter(
      (n): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0,
    )
    if (nums.length > 0) {
      eipsJson = JSON.stringify(nums)
    }
  }

  return { forkId, eipsJson }
}
