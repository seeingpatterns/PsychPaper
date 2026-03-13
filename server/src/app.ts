import express from 'express'
import cors from 'cors'
import type { Pool } from 'pg'
import type { AdminUserService } from './application/admin-user/AdminUserService.js'
import { createAdminUsersRouter } from './presentation/routes/adminUsers.js'

export type AppDeps = {
  adminUserService: AdminUserService
  pool: Pool | null
}

export function createApp(deps: AppDeps): express.Express {
  const app = express()
  app.use(cors())
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'psychpaper-server' })
  })

  const adminRouter = createAdminUsersRouter(deps)
  app.use('/api/admin', adminRouter)

  return app
}
