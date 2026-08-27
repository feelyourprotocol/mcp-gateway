/** MCP tool descriptions — runtime prompts for connected agents. */

export const DESCRIBE_CAPABILITIES_DESCRIPTION = [
  'Probe what this Feel Your Protocol EVM server supports before running simulations.',
  'Returns engine version, gas/trace/bytecode ceilings, named forks (amsterdam; alias glamsterdam),',
  'and registered runnable EIP modules (what became possible: opcodes, encoding rules, keywords).',
  'Live coverage: EIP-8024 DUPN/SWAPN/EXCHANGE on Amsterdam.',
  'Does not list unimplemented EIPs and does not ship demo programs — callers supply bytecode.',
  'Call this first for support questions (is EIP-8024 available?',
  'can I run Amsterdam bytecode with the new stack opcodes?)',
  'then use simulate_evm_bytecode or compare_evm_variants.',
].join(' ')

export const SIMULATE_EVM_BYTECODE_DESCRIPTION = [
  'Run caller-supplied raw EVM bytecode under a future fork / EIP configuration',
  'and return deterministic results: success, gas used, return data, final stack,',
  'optional opcode trace, and provenance.',
  'Use for gas estimation, opcode behavior (EIP-8024 DUPN/SWAPN/EXCHANGE on Amsterdam),',
  'bytecode rewrites, and fork what-if analysis.',
  'Call describe_capabilities first for runnable EIP modules and opcode encoding.',
  'Limits: max gas 30000000 (default 1000000), max bytecode 24576 bytes, max trace 10000 steps.',
].join(' ')

export const COMPARE_EVM_VARIANTS_DESCRIPTION = [
  'Compare labelled EVM bytecode variants (each with its own fork + bytecode).',
  'Returns per-variant simulate results plus diffs (success, gasUsed, error, bytecode length)',
  'and provenance.',
  'Use for gas deltas, semantic equivalence, rewrites vs original, and fork what-if analysis.',
  'Call describe_capabilities first for runnable EIP modules.',
  'Callers supply bytecode — this server does not ship demo programs.',
  'Limits match simulate_evm_bytecode.',
].join(' ')
