import type { Request, Response, NextFunction } from 'express'
import { getClientIp, normalizeClientIp } from './clientIp.js'

/**
 * ADMIN_IP_WHITELIST가 비어 있으면 비활성(모든 IP 허용).
 * 값이 있으면 콤마 구분 IPv4 문자열 목록과만 일치할 때 통과.
 */
export function adminIpWhitelistMiddleware() {
  const raw = process.env.ADMIN_IP_WHITELIST?.trim()
  const allowed = raw
    ? raw.split(',').map((s) => normalizeClientIp(s.trim())).filter(Boolean)
    : null

  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowed || allowed.length === 0) return next()
    const ip = getClientIp(req)
    if (!allowed.includes(ip)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access denied' })
    }
    return next()
  }
}
