/** MCP tool descriptions — runtime prompts for connected agents. */

export const DESCRIBE_CAPABILITIES_DESCRIPTION = [
  'Probe what this Feel Your Protocol MCP server supports before running simulations.',
  'Returns engine version, gas/trace/bytecode/txs-per-block ceilings, baselineForkId (osaka — optional mainnet baseline),',
  'named forks as catalog capabilities (amsterdam preview default; osaka baseline; prague historical;',
  'aliases glamsterdam, mainnet-el — each with summary, keywords, shapes, advertised relatedEips),',
  'and registered runnable EIP modules (what became possible: opcodes, encoding rules, optional comparison pairs, shapes).',
  'Live coverage: generic Amsterdam / Osaka / Prague runs via run_bytecode, run_transaction, or run_block;',
  'EIP-8024 opcodes via run_bytecode; EIP-7843 SLOTNUM via run_block;',
  'EIP-7708 / EIP-8037 via run_transaction; EIP-8038 via run_bytecode (program gas) and run_transaction (paid / txStateGas);',
  'EIP-7883 ModExp and EIP-7951 secp256r1 on Osaka (run_bytecode); Prague for ModExp gas compare.',
  'Does not list unimplemented EIPs and does not ship demo programs — callers supply bytecode or transaction fields.',
  'Call this first for support questions (is Amsterdam available? which EIPs does that fork advertise?',
  'is EIP-8024 available? how do opcodes encode? which tool for a wallet gasLimit?).',
  'Then use run_bytecode for opcodes/precompiles or generic bytecode under a fork,',
  'run_transaction for a single paid tx, or run_block for 1–8 txs as one lab block (optional header slot/number/timestamp).',
  'Optionally run again on osaka when comparing against current mainnet.',
].join(' ')

export const RUN_BYTECODE_DESCRIPTION = [
  'Run caller-supplied raw EVM bytecode as a VM message-call under a fork / EIP configuration',
  'and return deterministic results: success, call-frame gasUsed, return data, final stack,',
  'optional opcode trace, optional stateGasSpilled (Amsterdam), and provenance.',
  'gasUsed is call-frame only (no 21000 transaction intrinsic).',
  'Optional accounts[] seeds code/balance/storage in the same call (existing-slot SSTORE:',
  'put storage on 0x00000000000000000000000000000000000000b1).',
  'Use for generic hardfork runs (bytecode under Amsterdam with no EIP named), opcode behavior (EIP-8024 on Amsterdam),',
  'precompile calls (ModExp 0x05, P-256 0x100 on Osaka), SSTORE/SLOAD program gas (EIP-8038), bytecode rewrites, and fork what-if analysis.',
  'Do not use this tool for wallet gasLimit, first-touch ETH transfers, or receipt logs — use run_transaction.',
  'Do not use this tool for a chosen header slot or several txs in one block — use run_block.',
  'Default fork is amsterdam (preview). Osaka is optional — use it only when comparing against current mainnet.',
  'Call describe_capabilities first for named fork capabilities, runnable EIP modules, and opcode encoding.',
  'Limits: max gas 30000000 (default 1000000), max bytecode 24576 bytes, max trace 10000 steps.',
].join(' ')

export const RUN_TRANSACTION_DESCRIPTION = [
  'Run a value-bearing Ethereum transaction under a fork / EIP configuration (VM transaction execution).',
  'Sender is impersonated from the `from` address — no private key required.',
  'Returns paid gasUsed (gasUsedScope: transaction), optional Amsterdam txRegularGas / txStateGas,',
  'receipt logs / decodedLogs (EIP-7708 Transfer decorations), and provenance.',
  'Use when the question is a generic Amsterdam / Osaka transaction, a wallet gasLimit, first-touch transfer, paid tx gas, receipt logs, or txStateGas (EIP-8037 / new-slot SSTORE).',
  'A simple ETH transfer is about 21000 gas on Osaka and about 204600 on Amsterdam (first-touch empty recipient).',
  'Pass gasLimit "21000" to see Amsterdam first-touch fail.',
  'Do not use this tool for raw opcode / stack / precompile bytecode — use run_bytecode.',
  'Do not use this tool for several txs or a chosen header slot — use run_block.',
  'Default fork is amsterdam (preview). Osaka is optional for mainnet baseline comparison.',
  'Call describe_capabilities first. Limits: max gas 30000000 (default 1000000).',
].join(' ')

export const RUN_BLOCK_DESCRIPTION = [
  'Run 1–8 impersonated Ethereum transactions as one lab block under a fork / EIP configuration.',
  'Senders are impersonated from each `from` address — no private key required.',
  'Returns header snapshot (number, timestamp, gasUsed, optional slotNumber), per-tx paid gas / logs,',
  'and provenance. Lab mode generates header fields and skips chain header checks.',
  'Use when the question needs a header slot (EIP-7843 SLOTNUM), several txs in one block, a header timestamp/number, or a generic Amsterdam / Osaka lab block.',
  'Optional header.slotNumber is Amsterdam only. Paid gas of a single transfer still belongs on run_transaction.',
  'Do not use this tool for raw opcode bytecode — use run_bytecode. Do not expect BAL JSON (still planned generate).',
  'Default fork is amsterdam (preview). Osaka is optional for mainnet baseline comparison.',
  'Call describe_capabilities first. Limits: max 8 transactions, max gas 30000000 (default 1000000 per tx).',
].join(' ')
