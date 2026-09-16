/** MCP tool descriptions — runtime prompts for connected agents. */

export const DESCRIBE_CAPABILITIES_DESCRIPTION = [
  'Probe what this Feel Your Protocol MCP server supports before running simulations.',
  'Returns engine version, gas/trace/bytecode/txs-per-block ceilings, baselineForkId (osaka — current mainnet EL),',
  'namedForks as the Berlin→Amsterdam lineage (berlin through amsterdam; aliases merge, shapella, dencun, pectra,',
  'fusaka, glamsterdam, mainnet-el — each with order, predecessorId, successorId, activatedEips, relatedEips twins, shapes),',
  'eipIntroductions (when each EIP activated — use with predecessor compares),',
  'and registered runnable EIP modules (encoding rules, derived comparison pairs, shapes).',
  'Compare pattern: lookup eipIntroductions → run twice on predecessorFork(introducedAt) vs introducedAt.',
  'Live coverage: generic runs on any lineage fork via run_bytecode, run_transaction, run_block, generate, inspect;',
  'EIP twins (8024, 7843, 7708, 7928 BAL, 8037, 8038 on Amsterdam; 7883 ModExp and 7951 P-256 on Osaka).',
  'inspectKinds lists structures inspect accepts (block-access-list first).',
  'Does not list unimplemented EIPs and does not ship demo programs — callers supply bytecode or transaction fields.',
  'Call this first for support questions (when did PUSH0 appear? which fork before ModExp repricing? is Amsterdam available?).',
  'Then use run_bytecode, run_transaction, run_block, generate, or inspect. Default fork is amsterdam (preview).',
].join(' ')

export const RUN_BYTECODE_DESCRIPTION = [
  'Run caller-supplied raw EVM bytecode as a VM message-call under a fork / EIP configuration',
  'and return deterministic results: success, call-frame gasUsed, return data, final stack,',
  'optional opcode trace, optional stateGasSpilled (Amsterdam), and provenance (includes predecessorForkId on historical forks).',
  'gasUsed is call-frame only (no 21000 transaction intrinsic).',
  'Optional accounts[] seeds code/balance/storage in the same call (existing-slot SSTORE:',
  'put storage on 0x00000000000000000000000000000000000000b1).',
  'Use for generic hardfork runs (any lineage fork with eips: []), opcode behavior (EIP-8024 on Amsterdam),',
  'historical compares (PUSH0 0x5f on shanghai vs paris), precompile calls (ModExp 0x05, P-256 0x100 on Osaka),',
  'SSTORE/SLOAD program gas (EIP-8038), bytecode rewrites, and fork what-if analysis.',
  'Do not use this tool for wallet gasLimit, first-touch ETH transfers, or receipt logs — use run_transaction.',
  'Do not use this tool for a chosen header slot or several txs in one block — use run_block.',
  'Default fork is amsterdam (preview). Use osaka or predecessor forks when comparing against mainnet or history.',
  'Call describe_capabilities first for lineage, eipIntroductions, runnable EIP modules, and opcode encoding.',
  'Limits: max gas 30000000 (default 1000000), max bytecode 24576 bytes, max trace 10000 steps.',
].join(' ')

export const RUN_TRANSACTION_DESCRIPTION = [
  'Run a value-bearing Ethereum transaction under a fork / EIP configuration (VM transaction execution).',
  'Sender is impersonated from the `from` address — no private key required.',
  'Returns paid gasUsed (gasUsedScope: transaction), optional Amsterdam txRegularGas / txStateGas,',
  'receipt logs / decodedLogs (EIP-7708 Transfer decorations), and provenance.',
  'Use when the question is a generic transaction on any lineage fork, a wallet gasLimit, first-touch transfer,',
  'paid tx gas, receipt logs, or txStateGas (EIP-8037 / new-slot SSTORE).',
  'A simple ETH transfer is about 21000 gas on Osaka and about 204600 on Amsterdam (first-touch empty recipient).',
  'Pass gasLimit "21000" to see Amsterdam first-touch fail.',
  'Do not use this tool for raw opcode / stack / precompile bytecode — use run_bytecode.',
  'Do not use this tool for several txs or a chosen header slot — use run_block.',
  'Default fork is amsterdam (preview). Use osaka or historical forks for baseline or predecessor compares.',
  'Call describe_capabilities first. Limits: max gas 30000000 (default 1000000).',
].join(' ')

export const RUN_BLOCK_DESCRIPTION = [
  'Run 1–8 impersonated Ethereum transactions as one lab block under a fork / EIP configuration.',
  'Senders are impersonated from each `from` address — no private key required.',
  'Returns header snapshot (number, timestamp, gasUsed, optional slotNumber), per-tx paid gas / logs,',
  'and provenance. Lab mode generates header fields and skips chain header checks.',
  'Use when the question needs a header slot (EIP-7843 SLOTNUM), several txs in one block, a header timestamp/number,',
  'or a generic lab block on any lineage fork.',
  'Optional header.slotNumber is Amsterdam only. Paid gas of a single transfer still belongs on run_transaction.',
  'Do not use this tool for raw opcode bytecode — use run_bytecode. Do not use for BAL JSON — use generate.',
  'Default fork is amsterdam (preview). Use osaka or predecessor forks for baseline or historical compares.',
  'Call describe_capabilities first. Limits: max 8 transactions, max gas 30000000 (default 1000000 per tx).',
].join(' ')

export const GENERATE_DESCRIPTION = [
  'Derive structured protocol artifacts from a lab block run (same inputs as run_block: 1–8 txs, accounts, optional header).',
  'Default kind block-access-list (EIP-7928): returns BAL JSON, keccak256(RLP) hash, itemCount vs gas item cap, header gasUsed, provenance.',
  'Requires Amsterdam (EIP-7928). BYOS lab only — not verification of a mainnet block BAL without archive parent state.',
  'Do not use run_block when the question is what the block commits to in the access list — use generate.',
  'Call describe_capabilities first (EIP-7928 module, inspectKinds). Limits: max 8 transactions.',
].join(' ')

export const INSPECT_DESCRIPTION = [
  'Judge a caller-supplied structured artifact without chain state (encoding, canonical structure, optional hash).',
  'kind block-access-list (EIP-7928): pass BAL JSON array or RLP hex; optional blockGasLimit for item cap; optional expectedHash for hash match.',
  'Returns wellFormed, structureOk, hashMatch, itemCapOk, errors[], computedHash — not consensus replay against mainnet.',
  'Use after generate or on external BAL payloads. Call describe_capabilities for inspectKinds.',
].join(' ')
