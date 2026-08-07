import { Router } from 'express'

/** 일반(비관리자) API만 마운트. 관리자 경로와 코드 의존성을 분리한다. */
export function createPublicApiRouter(): Router {
  const router = Router()
  router.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'psychpaper-server' })
  })
  return router
}
