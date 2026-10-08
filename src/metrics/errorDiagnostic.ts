import { ZodError } from 'zod'
import { EngineError } from '@feelyourprotocol/mcp-execution-engine'

const MAX_MESSAGE_LEN = 500
const MAX_FACT_VALUE_LEN = 80
const LONG_HEX = /0x[0-9a-fA-F]{16,}/gi
const ADDRESS_HEX = /0x[0-9a-fA-F]{40}/gi

export type ToolErrorDiagnostic = {
  code: string
  field?: string
  message: string
  facts?: Record<string, string | number | boolean>
}

function shortenAddress(match: string): string {
  const body = match.slice(2)
  if (body.length !== 40) {
    return '[hex]'
  }
  return `0x${body.slice(0, 4)}…${body.slice(-4)}`
}

export function redactMessage(message: string): string {
  let out = message.replace(ADDRESS_HEX, (m) => shortenAddress(m))
  out = out.replace(LONG_HEX, '[hex]')
  if (out.length > MAX_MESSAGE_LEN) {
    return `${out.slice(0, MAX_MESSAGE_LEN)}…`
  }
  return out
}

function sanitizeFactValue(
  key: string,
  value: string | number | boolean,
): string | number | boolean {
  if (typeof value === 'string') {
    ADDRESS_HEX.lastIndex = 0
    LONG_HEX.lastIndex = 0
    if (ADDRESS_HEX.test(value)) {
      ADDRESS_HEX.lastIndex = 0
      return shortenAddress(value)
    }
    LONG_HEX.lastIndex = 0
    if (LONG_HEX.test(value)) {
      return '[hex]'
    }
    if (
      value.length > MAX_FACT_VALUE_LEN &&
      (key.includes('bytecode') || key.includes('data') || key.includes('code'))
    ) {
      return `[string:${value.length}]`
    }
    if (value.length > MAX_FACT_VALUE_LEN) {
      return `${value.slice(0, MAX_FACT_VALUE_LEN)}…`
    }
  }
  return value
}

export function sanitizeDiagnostic(diagnostic: ToolErrorDiagnostic): ToolErrorDiagnostic {
  const facts: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(diagnostic.facts ?? {})) {
    facts[key] = sanitizeFactValue(key, value)
  }
  return {
    code: diagnostic.code,
    ...(diagnostic.field !== undefined ? { field: diagnostic.field } : {}),
    message: redactMessage(diagnostic.message),
    ...(Object.keys(facts).length > 0 ? { facts } : {}),
  }
}

export function diagnosticFromEngineError(error: EngineError): ToolErrorDiagnostic {
  return sanitizeDiagnostic({
    code: error.code,
    field: error.field,
    message: error.message,
    facts: error.facts,
  })
}

function zodPathToField(path: (string | number)[]): string {
  return path
    .map((segment) => (typeof segment === 'number' ? `[${segment}]` : segment))
    .reduce((acc, segment) => {
      if (segment.startsWith('[')) {
        return `${acc}${segment}`
      }
      return acc.length === 0 ? segment : `${acc}.${segment}`
    }, '')
}

export function diagnosticFromZodError(error: ZodError): ToolErrorDiagnostic {
  const first = error.errors[0]
  const field = first !== undefined ? zodPathToField(first.path) : undefined
  const message = error.errors.map((issue) => issue.message).join('; ')
  const facts: Record<string, string | number | boolean> = {}
  if (first !== undefined) {
    facts.zodIssue = first.code
    const received = (first as { received?: unknown }).received
    if (
      typeof received === 'string' &&
      received.length <= MAX_FACT_VALUE_LEN &&
      !/^0x[0-9a-fA-F]{16,}$/i.test(received)
    ) {
      facts.received = received
    } else if (typeof received === 'number' || typeof received === 'boolean') {
      facts.received = received
    } else if (received !== undefined) {
      facts.receivedType = typeof received
    }
  }
  return sanitizeDiagnostic({
    code: 'invalid_input',
    field,
    message,
    facts: Object.keys(facts).length > 0 ? facts : undefined,
  })
}

export function diagnosticFromUnknown(error: unknown): ToolErrorDiagnostic {
  const message = error instanceof Error ? error.message : String(error)
  return sanitizeDiagnostic({
    code: 'unexpected',
    message,
  })
}

export function diagnosticFromUnexpectedEngineResult(result: unknown): ToolErrorDiagnostic | null {
  if (result === null || typeof result !== 'object') {
    return null
  }
  const record = result as { errorCode?: unknown; error?: unknown }
  if (record.errorCode !== 'unexpected') {
    return null
  }
  const message =
    typeof record.error === 'string' && record.error.trim() !== ''
      ? record.error
      : 'Unexpected engine failure'
  return sanitizeDiagnostic({
    code: 'unexpected',
    message,
  })
}

export function buildDiagnosticFromError(error: unknown): ToolErrorDiagnostic {
  if (error instanceof EngineError) {
    return diagnosticFromEngineError(error)
  }
  if (error instanceof ZodError) {
    return diagnosticFromZodError(error)
  }
  return diagnosticFromUnknown(error)
}

export function formatDiagnosticPaste(args: {
  tool: string
  when: string
  forkId: string | null
  eips: number[]
  diagnostic: ToolErrorDiagnostic
}): string {
  const lines: string[] = [
    `tool: ${args.tool}`,
    `when: ${args.when}`,
    `code: ${args.diagnostic.code}`,
  ]
  if (args.diagnostic.field) {
    lines.push(`field: ${args.diagnostic.field}`)
  }
  if (args.forkId) {
    lines.push(`fork: ${args.forkId}`)
  }
  if (args.eips.length > 0) {
    lines.push(`eips: ${args.eips.join(', ')}`)
  }
  lines.push(`message: ${args.diagnostic.message}`)
  for (const [key, value] of Object.entries(args.diagnostic.facts ?? {})) {
    lines.push(`${key}: ${value}`)
  }
  return lines.join('\n')
}

export function logToolErrorStderr(tool: string, diagnostic: ToolErrorDiagnostic): void {
  const fieldPart = diagnostic.field !== undefined ? ` field=${diagnostic.field}` : ''
  console.error(
    `[fyp-mcp] tool error tool=${tool} code=${diagnostic.code}${fieldPart} msg=${diagnostic.message}`,
  )
}
