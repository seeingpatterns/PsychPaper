import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import type { AppDeps } from '../../../app.js'
import { adminAuditMiddleware } from '../../../middleware/admin/adminAudit.js'
import { adminIpWhitelistMiddleware } from '../../../middleware/admin/ipWhitelist.js'
import { requireAdminSession } from '../../../middleware/admin/requireAdminSession.js'
import { createAdminAuthHandlers } from './adminAuthRoutes.js'
import { createAdminUsersCrudRouter } from './adminUsersCrud.js'

/**
 * 관리자 API 전용 라우터. 일반(public) 라우터와 파일·마운트 경로를 분리한다.
 * 보안은 단일 미들웨어가 아니라 **순차 적용**한다: IP 화이트리스트 → 감사 로그 → (보호 구간) 세션.
 */
export function createAdminApiRouter(deps: AppDeps): Router {
  const router = Router()

  router.use(adminIpWhitelistMiddleware())
  router.use(adminAuditMiddleware())

  const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: 'RATE_LIMIT', message: 'Too many login attempts. Try again later.' },
  })

  const { pool } = deps
  if (pool) {
    const { login, logout } = createAdminAuthHandlers(deps)
    router.post('/login', loginLimiter, login)
    router.post('/logout', requireAdminSession, logout)
  }

  const usersCrud = createAdminUsersCrudRouter(deps)
  router.use('/users', requireAdminSession, usersCrud)

  return router
}
