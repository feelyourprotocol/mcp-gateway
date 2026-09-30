import { createHash } from 'node:crypto'

export function computeActorKey(params: {
  pepper: string
  clientName: string
  clientVersion: string
  ip: string
}): string {
  const payload = `${params.pepper}\0${params.clientName}\0${params.clientVersion}\0${params.ip}`
  return createHash('sha256').update(payload, 'utf8').digest('hex')
}
