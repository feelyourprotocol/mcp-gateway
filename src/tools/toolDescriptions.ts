/** MCP tool descriptions — runtime prompts for connected agents. */

export const DESCRIBE_CAPABILITIES_DESCRIPTION = [
  'Probe what this Feel Your Protocol MCP server supports before running simulations.',
  'Returns engine version, gas/trace/bytecode ceilings, baselineForkId (osaka — optional mainnet baseline),',
  'named forks (amsterdam preview default; osaka baseline; aliases glamsterdam, mainnet-el),',
  'and registered runnable EIP modules (what became possible: opcodes, encoding rules, optional comparison pairs).',
  'Live coverage: EIP-8024 on Amsterdam; EIP-7883 ModExp and EIP-7951 secp256r1 on Osaka; Prague for ModExp gas compare.',
  'Does not list unimplemented EIPs and does not ship demo programs — callers supply bytecode.',
  'Call this first for support questions (is EIP-8024 available? how do opcodes encode?).',
  'Then use run_evm_bytecode once on amsterdam, or optionally on osaka too when comparing against mainnet.',
].join(' ')

export const RUN_EVM_BYTECODE_DESCRIPTION = [
  'Run caller-supplied raw EVM bytecode under a fork / EIP configuration',
  'and return deterministic results: success, gas used, return data, final stack,',
  'optional opcode trace, and provenance.',
  'Use for gas estimation, opcode behavior (EIP-8024 on Amsterdam), precompile calls (ModExp 0x05, P-256 0x100 on Osaka),',
  'bytecode rewrites, and fork what-if analysis.',
  'Default fork is amsterdam (preview). Osaka is optional — use it only when comparing against current mainnet.',
  'Call describe_capabilities first for runnable EIP modules, fork list, and opcode encoding.',
  'Limits: max gas 30000000 (default 1000000), max bytecode 24576 bytes, max trace 10000 steps.',
].join(' ')
