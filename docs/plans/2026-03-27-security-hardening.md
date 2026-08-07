# Security Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Public repo에 노출된 시크릿 제거 + CORS/rate-limit/session 보안 강화로 공격 표면 95% 제거

**Architecture:** 기존 Express 미들웨어 체인에 helmet, express-rate-limit 추가. docker-compose 시크릿을 env_file로 분리. 코드 변경은 6개 파일에 집중.

**Tech Stack:** Express 4, helmet, express-rate-limit, bcryptjs, express-session, Docker

---

### Task 1: 패키지 설치 (helmet + express-rate-limit)

**Files:**
- Modify: `server/package.json`

**Step 1: 패키지 설치**

Run:
```bash
cd /Users/jungeunkim/projects/PsychPaper/server && npm install helmet express-rate-limit && npm install -D @types/helmet
```

**Step 2: 설치 확인**

Run: `cd /Users/jungeunkim/projects/PsychPaper/server && node -e "require('helmet'); require('express-rate-limit'); console.log('OK')"`
Expected: `OK`

---

### Task 2: docker-compose.yml 시크릿 제거 + DB 포트 제거

**Files:**
- Modify: `docker-compose.yml`
- Create: `.env.docker.example`

**Step 1: docker-compose.yml 수정**

```yaml
services:
  server:
    build: ./server
    ports:
      - "3000:3000"
    env_file: .env.docker
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    env_file: .env.docker
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db-schema/schema.sql:/docker-entrypoint-initdb.d/01_schema.sql
    # ports 제거 — Docker 내부 네트워크만 사용
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

**Step 2: .env.docker.example 생성 (템플릿만 커밋)**

```env
# Server
NODE_ENV=production
PORT=3000
SESSION_SECRET=<generate-random-64-char-string>
DATABASE_URL=postgresql://<user>:<password>@db:5432/psychpaper

# Database
POSTGRES_USER=<user>
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=psychpaper
```

**Step 3: .env.docker 생성 (실제 시크릿, git 무시됨)**

Run:
```bash
SECRET=$(openssl rand -base64 48)
DBPASS=$(openssl rand -base64 24)
cat > /Users/jungeunkim/projects/PsychPaper/.env.docker << EOF
NODE_ENV=production
PORT=3000
SESSION_SECRET=${SECRET}
DATABASE_URL=postgresql://postgres:${DBPASS}@db:5432/psychpaper
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${DBPASS}
POSTGRES_DB=psychpaper
EOF
```

**Step 4: 커밋**

```bash
git add docker-compose.yml .env.docker.example
git commit -m "security: remove hardcoded secrets from docker-compose, close DB port"
```

---

### Task 3: app.ts — CORS 화이트리스트 + helmet

**Files:**
- Modify: `server/src/app.ts`

**Step 1: 코드 수정**

```typescript
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

  // Security headers
  app.use(helmet())

  // CORS whitelist
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
```

**Step 2: 빌드 확인**

Run: `cd /Users/jungeunkim/projects/PsychPaper/server && npx tsc --noEmit`
Expected: 에러 없음

**Step 3: 커밋**

```bash
git add server/src/app.ts
git commit -m "security: CORS whitelist + helmet security headers"
```

---

### Task 4: adminAuthRoutes.ts — 세션 재생성 + timing oracle

**Files:**
- Modify: `server/src/presentation/routes/admin/adminAuthRoutes.ts`

**Step 1: 코드 수정**

```typescript
import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import type { AppDeps } from '../../../app.js'

const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012'

const cookieOpts = () => ({
  httpOnly: true,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
})

export function createAdminAuthHandlers(deps: AppDeps) {
  const { pool } = deps

  async function login(req: Request, res: Response) {
    if (!pool) {
      return res.status(503).json({ ok: false, error: 'Admin auth unavailable' })
    }
    try {
      const { username, password } = req.body ?? {}
      if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ ok: false, error: 'Invalid payload' })
      }
      const result = await pool.query(
        `SELECT id, password_hash FROM admin_users WHERE username = $1 LIMIT 1`,
        [username]
      )

      // Timing-safe: always run bcrypt.compare regardless of user existence
      const row = result.rows[0] as { id: number; password_hash: string } | undefined
      const hashToCompare = row?.password_hash ?? DUMMY_HASH
      const ok = await bcrypt.compare(password, hashToCompare)

      if (!row || !ok) return res.status(401).json({ ok: false })

      // Session fixation protection: regenerate session on login
      const adminId = row.id
      req.session.regenerate((err) => {
        if (err) {
          console.error('session regenerate error:', err)
          return res.status(500).json({ ok: false })
        }
        req.session.adminUserId = adminId
        return res.json({ ok: true })
      })
    } catch (err) {
      console.error('admin login error:', err)
      return res.status(500).json({ ok: false })
    }
  }

  function logout(req: Request, res: Response) {
    req.session.destroy((err) => {
      if (err) {
        console.error('admin logout error:', err)
        return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to logout' })
      }
      res.clearCookie('pp_session', cookieOpts())
      return res.status(204).send()
    })
  }

  return { login, logout }
}
```

**Step 2: 빌드 확인**

Run: `cd /Users/jungeunkim/projects/PsychPaper/server && npx tsc --noEmit`

**Step 3: 커밋**

```bash
git add server/src/presentation/routes/admin/adminAuthRoutes.ts
git commit -m "security: session regeneration on login + timing-safe auth"
```

---

### Task 5: createAdminApiRouter.ts — rate limit

**Files:**
- Modify: `server/src/presentation/routes/admin/createAdminApiRouter.ts`

**Step 1: 코드 수정**

```typescript
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import type { AppDeps } from '../../../app.js'
import { adminAuditMiddleware } from '../../../middleware/admin/adminAudit.js'
import { adminIpWhitelistMiddleware } from '../../../middleware/admin/ipWhitelist.js'
import { requireAdminSession } from '../../../middleware/admin/requireAdminSession.js'
import { createAdminAuthHandlers } from './adminAuthRoutes.js'
import { createAdminUsersCrudRouter } from './adminUsersCrud.js'

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1분
  max: 5,                     // IP당 5회
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMIT', message: 'Too many login attempts. Try again later.' },
})

export function createAdminApiRouter(deps: AppDeps): Router {
  const router = Router()

  router.use(adminIpWhitelistMiddleware())
  router.use(adminAuditMiddleware())

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
```

**Step 2: 빌드 확인**

Run: `cd /Users/jungeunkim/projects/PsychPaper/server && npx tsc --noEmit`

**Step 3: 커밋**

```bash
git add server/src/presentation/routes/admin/createAdminApiRouter.ts
git commit -m "security: rate limit login endpoint (5 req/min per IP)"
```

---

### Task 6: adminUsersCrud.ts — self-deletion 방지 + 비밀번호 복잡성

**Files:**
- Modify: `server/src/presentation/routes/admin/adminUsersCrud.ts`

**Step 1: 비밀번호 복잡성 검증 함수 추가**

validateCreateBody/validateUpdateBody의 password 검증 뒤에 추가:

```typescript
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,72}$/

// validateCreateBody 내부, password 길이 체크 뒤:
if (!PASSWORD_PATTERN.test(password)) {
  return { code: 'VALIDATION_ERROR', message: 'password must include uppercase, lowercase, number, and special character' }
}

// validateUpdateBody 내부, password 길이 체크 뒤 동일 적용
```

**Step 2: DELETE에서 self-deletion 방지**

```typescript
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseId(req.params.id)
  if (id === null) {
    return errorRes(res, 400, 'VALIDATION_ERROR', 'id must be a positive integer')
  }
  if (id === req.session.adminUserId) {
    return errorRes(res, 403, 'FORBIDDEN', 'Cannot delete your own account')
  }
  // ... 기존 로직
})
```

**Step 3: 빌드 확인**

Run: `cd /Users/jungeunkim/projects/PsychPaper/server && npx tsc --noEmit`

**Step 4: 커밋**

```bash
git add server/src/presentation/routes/admin/adminUsersCrud.ts
git commit -m "security: password complexity + prevent admin self-deletion"
```

---

### Task 7: Dockerfile — non-root + devDependencies 제거

**Files:**
- Modify: `server/Dockerfile`

**Step 1: 코드 수정**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

주의: `npm run build`는 `tsc`를 쓰므로 devDependencies에 typescript가 있음.
→ 멀티스테이지 빌드로 변경:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
ENV PORT=3000
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Step 2: 커밋**

```bash
git add server/Dockerfile
git commit -m "security: multi-stage build, non-root user, no devDependencies"
```

---

### Task 8: 빌드 검증

**Step 1: TypeScript 빌드**

Run: `cd /Users/jungeunkim/projects/PsychPaper/server && npx tsc --noEmit`
Expected: 에러 없음

**Step 2: 테스트 실행**

Run: `cd /Users/jungeunkim/projects/PsychPaper/server && npm test`
Expected: 전체 통과

**Step 3: .env.docker.example 커밋 확인**

Run: `git status`
Expected: .env.docker는 untracked 아님 (gitignore), .env.docker.example은 커밋됨
