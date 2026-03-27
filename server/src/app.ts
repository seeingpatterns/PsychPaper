import express from 'express'
import cors from 'cors'
import session from 'express-session'
import type { Pool } from 'pg'
import type { AdminUserService } from './application/admin-user/AdminUserService.js'
import { createAdminUsersRouter } from './presentation/routes/adminUsers.js'

export type AppDeps = {
  adminUserService: AdminUserService
  pool: Pool | null
}

export function createApp(deps: AppDeps): express.Express {
  const sessionSecret = process.env.SESSION_SECRET
  if (typeof sessionSecret !== 'string' || !sessionSecret.trim()) {
    throw new Error('SESSION_SECRET must be set')
  }

  const app = express()
  const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
  const isProduction = process.env.NODE_ENV === 'production'

  app.use(cors({ origin: true, credentials: true }))
  app.use(session({
    name: 'pp_session',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: isProduction,
      maxAge: SESSION_TTL_MS,
    },
  }))
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'psychpaper-server' })
  })

  const adminRouter = createAdminUsersRouter(deps)
  app.use('/api/admin', adminRouter)

  return app
}
