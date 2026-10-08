import { TOOL_NAMES } from '../../server/constants.js'
import type { CardDefinition } from './types.js'

export const METRICS_CARD_REGISTRY: CardDefinition[] = [
  {
    id: 'mcp-liveness-timeline',
    title: 'MCP liveness',
    dataSource: 'health',
    helpText:
      'Uptime for each hour, day, or week inside the range selected at the top. The line connects those points, so a stretch of failed checks drops and stays down until checks pass again. The headline is uptime for the whole range and does not change when you switch hour, day, or week.',
    measure: 'uptime_percent',
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'line',
  },
  {
    id: 'distinct-fingerprints',
    title: 'Distinct agent fingerprints',
    helpText:
      'Unique visitors at session open (hash of client name, client version, and IP). The headline counts distinct fingerprints across the whole time window; the line shows how many opened a session in each bucket.',
    measure: 'count_distinct_actor',
    filter: { kind: 'session_open' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'line',
  },
  {
    id: 'sessions',
    title: 'Sessions',
    helpText:
      'Each initialize on the hosted HTTP MCP server counts as one session. The headline is the total in the window; the line groups sessions by hour, day, or week.',
    measure: 'count',
    filter: { kind: 'session_open' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'line',
  },
  {
    id: 'clients',
    title: 'Client / Versions',
    helpText:
      'Name and version reported at initialize, ranked by sessions. Clients counts names. Versions counts each name and version pair. Local stdio MCP does not write here.',
    measure: 'count',
    split: 'client',
    filter: { kind: 'session_open' },
    grains: ['day'],
    defaultGrain: 'day',
    chart: 'table',
    hideGrainControls: true,
  },
  {
    id: 'tool-calls',
    title: 'Tool usage',
    helpText:
      'Completed tool calls on the hosted server, split by MCP tool. All six tools are listed even when count is zero. The headline is total calls in the window.',
    measure: 'count',
    split: 'tool',
    filter: { kind: 'tool_call' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'stacked-bar',
    fillSeries: [...TOOL_NAMES],
  },
  {
    id: 'hardforks',
    title: 'Hardforks',
    helpText:
      'fork.baseHardfork from tool input on run, transaction, block, and artifact tools. omitted means the caller left fork out (engine default preview fork at runtime). describe_capabilities is excluded.',
    measure: 'count',
    split: 'fork',
    filter: { kind: 'tool_call' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'stacked-bar',
  },
  {
    id: 'eip-numbers',
    title: 'EIP numbers',
    helpText:
      'Only explicit fork.eips lists on tool calls — each number in a call is counted. Generic fork runs without an EIP list do not appear here.',
    measure: 'count',
    split: 'eip',
    filter: { kind: 'tool_call' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'stacked-bar',
    emptyHint:
      'No à-la-carte EIP lists yet. Generic fork prompts without fork.eips do not appear here.',
  },
  {
    id: 'tool-errors',
    title: 'Tool errors',
    helpText:
      'Rejected tool calls (MCP isError or engine unexpected) and their sanitized causes below the chart. EVM reverts on otherwise valid input are not listed here.',
    measure: 'count',
    split: 'tool',
    filter: { kind: 'tool_call', outcome: 'error' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'stacked-bar',
    fullWidth: true,
  },
  {
    id: 'settlement-mix',
    title: 'Paid vs unpaid calls',
    helpText:
      'Share of tool calls marked paid vs unpaid. Payment capture (x402) is not wired yet — expect unpaid only.',
    measure: 'count',
    split: 'settlement',
    filter: { kind: 'tool_call' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'stacked-bar',
    emptyHint: 'No payment data yet — x402 not wired.',
  },
  {
    id: 'revenue-over-time',
    title: 'USDC revenue',
    helpText: 'Sum of recorded USDC (micro units) on paid tool calls over time.',
    measure: 'sum_micro_usdc',
    filter: { kind: 'tool_call', settlement: 'paid' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'line',
    emptyHint: 'No USDC recorded yet.',
  },
  {
    id: 'revenue-by-tool',
    title: 'USDC by tool',
    helpText: 'USDC attributed to paid tool calls, split by MCP tool.',
    measure: 'sum_micro_usdc',
    split: 'tool',
    filter: { kind: 'tool_call', settlement: 'paid' },
    grains: ['hour', 'day', 'week'],
    defaultGrain: 'day',
    chart: 'stacked-bar',
    emptyHint: 'No USDC recorded yet.',
  },
]

export function getCardDefinition(cardId: string): CardDefinition | undefined {
  return METRICS_CARD_REGISTRY.find((card) => card.id === cardId)
}
