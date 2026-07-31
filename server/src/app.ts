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

  // Railway/nginx 등 리버스 프록시 뒤에서 X-Forwarded-For를 쓰려면 필요 (rate-limit, IP 화이트리스트).
  // 홉 수는 배포 토폴로지에 따라 다르다: 예) Railway 엣지→nginx→server 는 2홉.
  // 잘못 크게 잡으면 클라이언트가 IP를 위조할 수 있으므로 정확한 홉 수를 TRUST_PROXY_HOPS로 지정한다.
  if (isProduction || process.env.ADMIN_IP_WHITELIST?.trim()) {
    const hops = Number(process.env.TRUST_PROXY_HOPS ?? 1)
    app.set('trust proxy', Number.isInteger(hops) && hops > 0 ? hops : 1)
  }

  app.use(helmet())

  const CORS_REJECTED = 'Not allowed by CORS' // 생성·판별 양쪽에서 이 상수만 사용 (문구 변경 시 동시 갱신 보장)
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(CORS_REJECTED))
      }
    },
    credentials: true,
  }))
  // 기본 MemoryStore는 재시작 시 전원 로그아웃 + 메모리 누수 위험 — 운영에서는 pg/Redis 스토어로 교체 필요
  if (isProduction) {
    console.warn('[session] WARNING: using in-memory session store in production — sessions are lost on restart. Replace with a pg/Redis store.')
  }
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

  // CORS 거부를 500이 아니라 403으로 응답 (Express 기본 에러 핸들러로 흘려보내지 않는다)
  app.use((err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.message === CORS_REJECTED) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Origin not allowed' })
    }
    return next(err)
  })

  return app
}
