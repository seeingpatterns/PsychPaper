import type { Request, Response, NextFunction } from 'express'
import { getClientIp } from './clientIp.js'
import { adminAuditLogger } from '../../infrastructure/logging/adminAuditLogger.js'

/**
 * /api/admin 하위 모든 요청에 대해 응답 완료 시 감사 로그(메서드·경로·상태·IP·세션 admin id).
 */
export function adminAuditMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const started = Date.now()
    res.on('finish', () => {
      const adminUserId =
        typeof req.session?.adminUserId === 'number' ? req.session.adminUserId : undefined
      const routePath = (req.originalUrl ?? '').split('?')[0]
      adminAuditLogger.info({
        msg: 'admin.action',
        method: req.method,
        path: routePath,
        originalUrl: req.originalUrl,
        statusCode: res.statusCode,
        ip: getClientIp(req),
        adminUserId,
        ms: Date.now() - started,
      })
    })
    next()
  }
}
