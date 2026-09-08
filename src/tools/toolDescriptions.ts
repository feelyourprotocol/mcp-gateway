/** MCP tool descriptions — runtime prompts for connected agents. */

export const DESCRIBE_CAPABILITIES_DESCRIPTION = [
  'Probe what this Feel Your Protocol MCP server supports before running simulations.',
  'Returns engine version, gas/trace/bytecode ceilings, baselineForkId (osaka — optional mainnet baseline),',
  'named forks (amsterdam preview default; osaka baseline; aliases glamsterdam, mainnet-el),',
  'and registered runnable EIP modules (what became possible: opcodes, encoding rules, optional comparison pairs, shapes).',
  'Live coverage: EIP-8024 opcodes via run_bytecode; EIP-7708 / EIP-8037 via run_transaction;',
  'EIP-7883 ModExp and EIP-7951 secp256r1 on Osaka (run_bytecode); Prague for ModExp gas compare.',
  'Does not list unimplemented EIPs and does not ship demo programs — callers supply bytecode or transaction fields.',
  'Call this first for support questions (is EIP-8024 available? how do opcodes encode? which tool for a wallet gasLimit?).',
  'Then use run_bytecode for opcodes/precompiles, or run_transaction for paid tx gas and receipt logs.',
  'Optionally run again on osaka when comparing against current mainnet.',
].join(' ')

export const RUN_BYTECODE_DESCRIPTION = [
  'Run caller-supplied raw EVM bytecode under a fork / EIP configuration',
  'and return deterministic results: success, call-frame gasUsed, return data, final stack,',
  'optional opcode trace, and provenance.',
  'gasUsed is call-frame only (no 21000 transaction intrinsic).',
  'Use for opcode behavior (EIP-8024 on Amsterdam), precompile calls (ModExp 0x05, P-256 0x100 on Osaka),',
  'bytecode rewrites, and fork what-if analysis.',
  'Do not use this tool for wallet gasLimit, first-touch ETH transfers, or receipt logs — use run_transaction.',
  'Default fork is amsterdam (preview). Osaka is optional — use it only when comparing against current mainnet.',
  'Call describe_capabilities first for runnable EIP modules, fork list, and opcode encoding.',
  'Limits: max gas 30000000 (default 1000000), max bytecode 24576 bytes, max trace 10000 steps.',
].join(' ')

export const RUN_TRANSACTION_DESCRIPTION = [
  'Run a value-bearing Ethereum transaction under a fork / EIP configuration (VM transaction execution).',
  'Sender is impersonated from the `from` address — no private key required.',
  'Returns paid gasUsed (gasUsedScope: transaction), optional Amsterdam txRegularGas / txStateGas,',
  'receipt logs / decodedLogs (EIP-7708 Transfer decorations), and provenance.',
  'Use when the question is a wallet gasLimit, first-touch transfer, paid tx gas, or receipt logs.',
  'A simple ETH transfer is about 21000 gas on Osaka and about 204600 on Amsterdam (first-touch empty recipient).',
  'Pass gasLimit "21000" to see Amsterdam first-touch fail.',
  'Do not use this tool for raw opcode / stack / precompile bytecode — use run_bytecode.',
  'Default fork is amsterdam (preview). Osaka is optional for mainnet baseline comparison.',
  'Call describe_capabilities first. Limits: max gas 30000000 (default 1000000).',
].join(' ')
