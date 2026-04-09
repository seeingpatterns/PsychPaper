import type { Request } from 'express'

/** IPv4-mapped IPv6 (::ffff:x.x.x.x) → IPv4 문자열로 통일 */
export function normalizeClientIp(ip: string): string {
  if (ip.startsWith('::ffff:')) return ip.slice(7)
  return ip
}

export function getClientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for']
  if (typeof xff === 'string' && xff.trim()) {
    return normalizeClientIp(xff.split(',')[0].trim())
  }
  const raw = req.socket.remoteAddress ?? ''
  return normalizeClientIp(raw)
}
