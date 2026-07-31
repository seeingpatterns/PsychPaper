import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import type { AppDeps } from '../../../app.js'
import { adminAuditMiddleware } from '../../../middleware/admin/adminAudit.js'
import { adminIpWhitelistMiddleware } from '../../../middleware/admin/ipWhitelist.js'
import { createRequireAdminSession } from '../../../middleware/admin/requireAdminSession.js'
import { createAdminAuthHandlers } from './adminAuthRoutes.js'
import { createAdminUsersCrudRouter } from './adminUsersCrud.js'

/**
 * 관리자 API 전용 라우터. 일반(public) 라우터와 파일·마운트 경로를 분리한다.
 * 보안은 단일 미들웨어가 아니라 **순차 적용**한다: 감사 로그 → IP 화이트리스트 → (보호 구간) 세션.
 * 감사 로그가 먼저다 — 화이트리스트에 막힌 침입 시도(403)도 반드시 기록에 남아야 한다.
 */
export function createAdminApiRouter(deps: AppDeps): Router {
  const router = Router()

  router.use(adminAuditMiddleware())
  router.use(adminIpWhitelistMiddleware())

  const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: 'RATE_LIMIT', message: 'Too many login attempts. Try again later.' },
  })

  const { me, login, logout } = createAdminAuthHandlers(deps)
  router.post('/login', loginLimiter, login)

  router.use(createRequireAdminSession(deps.pool))
  router.get('/me', me)
  router.post('/logout', logout)

  const usersCrud = createAdminUsersCrudRouter(deps)
  router.use('/users', usersCrud)

  return router
}
