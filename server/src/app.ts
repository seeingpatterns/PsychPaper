import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import session from 'express-session'
import type { Pool } from 'pg'
import type { AdminUserService } from './application/admin-user/AdminUserService.js'
import { createAdminApiRouter } from './presentation/routes/admin/createAdminApiRouter.js'
import { createPublicApiRouter } from './presentation/routes/public/publicApiRouter.js'

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

  if (process.env.ADMIN_IP_WHITELIST?.trim()) {
    app.set('trust proxy', true)
  }

  app.use(helmet())

  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  }))
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

  app.use('/api', createPublicApiRouter())
  app.use('/api/admin', createAdminApiRouter(deps))

  return app
}
