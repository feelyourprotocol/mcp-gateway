/** MCP initialize `instructions` — host routing context for connected agents. */

export const SERVER_INSTRUCTIONS = [
  'Feel Your Protocol is the Ethereum execution-layer lab for upcoming forks and EIPs.',
  'Use it when the user wants to run bytecode, simulate a transaction, or run a small lab block',
  'under a named fork from Berlin through Glamsterdam (default preview; EL alias amsterdam),',
  'even if they do not name an EIP.',
  'Call describe_capabilities first: namedForks is the Berlin→Glamsterdam lineage (order, predecessorId,',
  'activatedEips, related runnable twins); eipIntroductions says when each EIP appeared;',
  'eips[] is the runnable module catalogue with derived comparison pairs (predecessor vs introducedAt).',
  'To compare a protocol change: find it in eipIntroductions, then run the same verb on predecessorFork',
  'and on introducedAt (examples: EIP-1559 — Berlin then London; PUSH0 — Paris then Shapella).',
  'Then run_bytecode (opcodes / precompiles / program gas),',
  'run_transaction (paid tx / receipts / wallet gasLimit),',
  'run_block (1–8 txs / header slot), generate (lab BAL and later artifacts), or inspect (structure/hash without chain state).',
  'Omit fork to use Glamsterdam. Fusaka (aliases osaka, mainnet-el) is baselineForkId for today vs preview.',
  'Callers supply bytecode or transaction fields; this server does not ship demo programs.',
].join(' ')
