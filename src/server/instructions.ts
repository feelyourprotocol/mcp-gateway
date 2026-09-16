/** MCP initialize `instructions` — host routing context for connected agents. */

export const SERVER_INSTRUCTIONS = [
  'Feel Your Protocol is the Ethereum execution-layer lab for upcoming forks and EIPs.',
  'Use it when the user wants to run bytecode, simulate a transaction, or run a small lab block',
  'under Amsterdam (default preview; alias Glamsterdam), Osaka (current mainnet EL), or Prague —',
  'even if they do not name an EIP.',
  'Call describe_capabilities first: namedForks are first-class capabilities',
  '(summary, related EIPs, shapes); eips[] is the EIP catalogue.',
  'Then run_bytecode (opcodes / precompiles / program gas),',
  'run_transaction (paid tx / receipts / wallet gasLimit),',
  'or run_block (1–8 txs / header slot).',
  'Omit fork to use Amsterdam. Compare against mainnet by running twice (osaka then amsterdam).',
  'Callers supply bytecode or transaction fields; this server does not ship demo programs.',
].join(' ')
