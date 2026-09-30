import type { Request } from 'express'

export function clientIpFromRequest(req: Request): string {
  const xff = req.headers['x-forwarded-for']
  if (typeof xff === 'string' && xff.length > 0) {
    const first = xff.split(',')[0]?.trim()
    if (first) {
      return first
    }
  }
  const xRealIp = req.headers['x-real-ip']
  if (typeof xRealIp === 'string' && xRealIp.length > 0) {
    return xRealIp
  }
  return req.socket.remoteAddress ?? 'unknown'
}

export function extractClientInfoFromInitializeBody(body: unknown): {
  clientName: string
  clientVersion: string
} {
  if (typeof body !== 'object' || body === null) {
    return { clientName: 'unknown', clientVersion: 'unknown' }
  }
  const params = (body as { params?: { clientInfo?: { name?: string; version?: string } } }).params
  return {
    clientName: params?.clientInfo?.name ?? 'unknown',
    clientVersion: params?.clientInfo?.version ?? 'unknown',
  }
}
