/** MCP tool descriptions — runtime prompts for connected agents. */

export const DESCRIBE_CAPABILITIES_DESCRIPTION = [
  'Probe what this Feel Your Protocol MCP server supports before running simulations.',
  'Returns engine version, gas/trace/bytecode/txs-per-block ceilings, baselineForkId (fusaka — current mainnet EL),',
  'namedForks as the Berlin→Glamsterdam lineage (berlin through glamsterdam; aliases merge, shanghai, cancun, prague,',
  'osaka, amsterdam, mainnet-el — each with order, predecessorId, successorId, activatedEips, relatedEips twins, shapes),',
  'eipIntroductions (when each EIP activated — use with predecessor compares),',
  'and registered runnable EIP modules (encoding rules, derived comparison pairs, shapes,',
  'specUrl / specDate / status / testReleaseName or a live EIP page).',
  'When the question is about a specific EIP, cite that snapshot once in plain language.',
  'Compare pattern: lookup eipIntroductions → run twice on predecessorFork(introducedAt) vs introducedAt.',
  'Live coverage: generic runs on any lineage fork via run_bytecode, run_transaction, run_block, generate, inspect;',
  'EIP twins (8024, 7843, 7708, 7928 BAL, 7954 contract size, 8037, 8038 on Glamsterdam; 7883 ModExp and 7951 P-256 on Fusaka). Pectra+ set-code: run_transaction authorizationList (not a catalogue twin).',
  'inspectKinds lists structures inspect accepts (block-access-list first).',
  'Does not list unimplemented EIPs and does not ship demo programs — callers supply bytecode or transaction fields.',
  'Call this first for support questions (when did PUSH0 appear? which fork before ModExp repricing? is Glamsterdam available?).',
  'Then use run_bytecode, run_transaction, run_block, generate, or inspect. Default fork is glamsterdam (preview).',
].join(' ')

export const RUN_BYTECODE_DESCRIPTION = [
  'Run caller-supplied raw EVM bytecode as a VM message-call under a fork / EIP configuration',
  'and return deterministic results: success, call-frame gasUsed, return data, final stack,',
  'optional opcode trace, optional stateGasSpilled (Glamsterdam), and provenance (includes predecessorForkId on historical forks).',
  'gasUsed is call-frame only (no 21000 transaction intrinsic).',
  'Optional accounts[] seeds code/balance/storage in the same call (existing-slot SSTORE:',
  'put storage on 0x00000000000000000000000000000000000000b1).',
  'Use for generic hardfork runs (any lineage fork with eips: []), opcode behavior (EIP-8024 on Glamsterdam),',
  'historical compares (PUSH0 0x5f on shapella vs paris), precompile calls (ModExp 0x05, P-256 0x100 on Fusaka),',
  'SSTORE/SLOAD program gas (EIP-8038), bytecode rewrites, and fork what-if analysis.',
  'Do not use this tool for wallet gasLimit, first-touch ETH transfers, or receipt logs — use run_transaction.',
  'Do not use this tool for a chosen header slot or several txs in one block — use run_block.',
  'Default fork is glamsterdam (preview). Use fusaka for current-mainnet features (ModExp, P-256) or when comparing against mainnet or history.',
  'Call describe_capabilities first for lineage, eipIntroductions, runnable EIP modules, and opcode encoding.',
  'Limits: max gas 30000000 (default 1000000), max bytecode 24576 bytes, max trace 10000 steps.',
].join(' ')

export const RUN_TRANSACTION_DESCRIPTION = [
  'Run an Ethereum call or contract-creation transaction under a fork / EIP configuration (VM transaction execution).',
  'Sender is impersonated from the `from` address — no private key required.',
  'Returns paid gasUsed (gasUsedScope: transaction), optional Glamsterdam txRegularGas / txStateGas,',
  'receipt logs / decodedLogs (EIP-7708 Transfer decorations), provenance, and for successful creation createdAddress / deployedCodeSize.',
  'Set to for a call. Omit to for contract creation; data is then initcode (EIP-7954 size-limit experiments).',
  'Use when the question is a generic transaction on any lineage fork, a wallet gasLimit, first-touch transfer,',
  'paid tx gas, receipt logs, or txStateGas (EIP-8037 / new-slot SSTORE).',
  'Optional authorizationList (Pectra+) runs a set-code type-4 tx — sponsor from, to = authority EOA, delegate code in accounts[].',
  'A simple ETH transfer is about 21000 gas on Fusaka and about 204600 on Glamsterdam (first-touch empty recipient).',
  'Pass gasLimit "21000" to see Glamsterdam first-touch fail.',
  'Do not use this tool for raw opcode / stack / precompile bytecode — use run_bytecode.',
  'Do not use this tool for several txs or a chosen header slot — use run_block.',
  'Default fork is glamsterdam (preview). Use fusaka or historical forks for current-mainnet / past-fork features or predecessor compares.',
  'Call describe_capabilities first. Limits: default gas 1000000; tool ceiling 110000000 for Glamsterdam state-heavy creation, while earlier fork validity rules still apply.',
].join(' ')

export const RUN_BLOCK_DESCRIPTION = [
  'Run 1–8 impersonated Ethereum transactions as one lab block under a fork / EIP configuration.',
  'Senders are impersonated from each `from` address — no private key required.',
  'Returns header snapshot (number, timestamp, gasUsed, optional slotNumber), per-tx paid gas / logs,',
  'and provenance. Lab mode generates header fields and skips chain header checks.',
  'Use when the question needs a header slot (EIP-7843 SLOTNUM), several txs in one block, a header timestamp/number,',
  'or a generic lab block on any lineage fork.',
  'Optional header.slotNumber is Glamsterdam only. Paid gas of a single transfer still belongs on run_transaction.',
  'Do not use this tool for raw opcode bytecode — use run_bytecode. Do not use for BAL JSON — use generate.',
  'Default fork is glamsterdam (preview). Use fusaka or predecessor forks for current-mainnet features or historical compares.',
  'Call describe_capabilities first. Limits: max 8 transactions, max gas 30000000 (default 1000000 per tx).',
].join(' ')

export const GENERATE_DESCRIPTION = [
  'Derive structured protocol artifacts from a lab block run (same inputs as run_block: 1–8 txs, accounts, optional header).',
  'Default kind block-access-list (EIP-7928): returns BAL JSON, keccak256(RLP) hash, itemCount vs gas item cap, header gasUsed, provenance.',
  'Requires Glamsterdam (EIP-7928). BYOS lab only — not verification of a mainnet block BAL without archive parent state.',
  'Do not use run_block when the question is what the block commits to in the access list — use generate.',
  'Call describe_capabilities first (EIP-7928 module, inspectKinds). Limits: max 8 transactions.',
].join(' ')

export const INSPECT_DESCRIPTION = [
  'Judge a caller-supplied structured artifact without chain state (encoding, structure, optional hash).',
  'Kinds (see inspectKinds): block-access-list (7928 BAL), authorization-list (set-code JSON), typed-transaction (2718 RLP hex), withdrawals (4895 JSON + withdrawalsRoot), execution-requests (7685 envelopes + requestsHash).',
  'Returns wellFormed, structureOk, hashMatch, errors[], computedHash, optional details — not consensus replay against mainnet or full blob/KZG sidecars.',
  'Call describe_capabilities for inspectKinds before use.',
].join(' ')
