# Session-based authentication — Implementation Plan (implementation-closed)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 서버가 세션을 소유하고, 클라이언트는 httpOnly 쿠키의 세션 토큰만 보유하며, 보호된 API는 매 요청마다 서버에서 세션을 검증한다. **MVP는 `admin_users`만 인증 주체로 사용한다.**

**Architecture:** DDD 계층 유지 — `domain/auth`, `application/auth`, `infrastructure/session`, `presentation/routes/auth`(HTTP만), `middleware/auth`. 라우트 파일에 비즈니스 로직을 넣지 않는다.

**Tech Stack:** Node.js, Express, `pg`, `crypto` (SID·해시), `cookie-parser` 또는 동일한 요청별 쿠키 파싱, `res.cookie` / `res.clearCookie`.

**Locked folder layout:**

```
server/src/
  ├── domain/auth/
  ├── application/auth/
  ├── infrastructure/session/
  ├── presentation/routes/auth.ts    # HTTP 라우트만 (기존 adminUsers.ts와 동일 레이어)
  └── middleware/auth/
```

`server/src/routes/` 는 사용하지 않고, 기존 **`presentation/routes/`** 에 `auth.ts` 를 둔다.

---

## A. Explicit policy decisions (코딩 전 확정)

### A.1 Session subject

| Decision | Detail |
|----------|--------|
| 인증 주체 | **오직 `admin_users`** 행만. 일반 사용자 테이블은 MVP 범위 밖. |
| FK 컬럼명 | 세션 테이블 FK는 **`admin_user_id`** (NOT NULL, `REFERENCES admin_users(id) ON DELETE CASCADE`). **`user_id` 라는 이름은 사용하지 않는다.** |

### A.2 Session ID (SID) policy

| Topic | Decision |
|-------|----------|
| 생성 | `crypto.randomBytes(32)` → **원시 32바이트**를 생성한다. |
| 쿠키에 넣는 값 | 원시 바이트를 **base64url** 인코딩한 문자열(패딩 없이, URL-safe). 구현 시 한 헬퍼로만 생성·디코딩한다. |
| DB에 저장하는 값 | **해시만 저장한다.** `sha256(원시 32바이트)` 를 **hex 소문자 64자** 문자열로 PRIMARY KEY 컬럼 `id` (또는 `token_hash`)에 저장한다. |
| Rationale | DB·백업 유출 시에도 **쿠키와 동일한 값이 DB에 평문으로 없어** 세션 하이재킹 난이도가 올라간다. 조회 시 쿠키에서 온 base64url을 디코딩한 뒤 sha256하여 DB 키로 조회한다. |
| 길이·알고리즘 | SHA-256 고정; 향후 변경 시 마이그레이션 필요(문서화만). |

### A.3 Cookie contract (Set-Cookie / clearCookie 동일 계약)

모든 `res.cookie` / `res.clearCookie` 호출은 **동일한 옵션 객체**를 쓴다(헬퍼 함수 `getSessionCookieOptions()` 한 곳에서만 생성).

| Option | Value | Notes |
|--------|-------|--------|
| `name` | **`pp_session`** | 고정. 환경 변수로 바꾸지 않는다(MVP). |
| `httpOnly` | `true` | 필수. |
| `path` | **`/`** | 필수. `clearCookie` 시에도 동일. |
| `sameSite` | **`'lax'`** | 필수. |
| `secure` | **`process.env.NODE_ENV === 'production'`** | 로컬 HTTP 개발에서는 `false`, 프로덕션 HTTPS에서는 `true`. |
| `maxAge` | **`SESSION_TTL_MS`** (아래 A.5와 동일 값) | 밀리초. DB `expires_at` 과 동일 시각이 되도록 로그인 시 둘 다 같은 `now + TTL` 로 설정. |

**`clearCookie('pp_session', getSessionCookieOptions())`** — 이름·path·sameSite·secure 가 set 과 **완전히 동일**해야 브라우저가 제거한다.

### A.4 Concurrent login policy

| Decision | Detail |
|----------|--------|
| MVP | **admin_user 당 활성 세션 1개.** |
| 구현 | 성공적인 `POST /api/auth/login` 직전(또는 트랜잭션 내)에 `DELETE FROM sessions WHERE admin_user_id = $1`. |
| Rationale | 구현 단순, 세션 테이블 폭증 방지, “한 관리자 계정 = 한 로그인 자리” 명확. |

### A.5 Expiry, invalidation, cleanup

| Topic | Decision |
|-------|----------|
| TTL | **`SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000`** (7일). 상수는 `application/auth` 또는 `infrastructure/session` 설정 모듈 한 파일에 정의. |
| DB | `expires_at TIMESTAMPTZ NOT NULL` = 로그인 시각 + TTL. |
| 미들웨어 | `expires_at <= now()` 이면 **401**, 해당 row **`DELETE`** (lazy invalidation). |
| 로그아웃 | `DELETE` 해당 세션 row + `clearCookie` 동일 계약. |
| 배치 청소 | MVP에서는 **필수 아님**. lazy 삭제로 충분. 추후 `idx_sessions_expires_at` 로 배치 가능. |

### A.6 Authentication vs authorization

| Layer | Meaning (MVP) |
|-------|----------------|
| **Authentication** | 쿠키의 SID → DB에서 유효·미만료 세션 조회 → **`admin_user_id` 확정**. 실패 시 401. |
| **Authorization** | “이 요청이 관리 API를 쓸 수 있는가?” → MVP에서는 **유효한 admin 세션 = `/api/admin` 접근 허용**. 별도 역할 테이블 없음. |
| 원칙 | **`/api/admin` 보호는 오직 서버 미들웨어(세션 검증)**. 프론트의 라우터·로컬스토리지·UI 상태로 접근을 막는 것은 UX일 뿐, **절대 보안 근거로 쓰지 않는다.** |

---

## B. Updated module list (8)

| # | Module | Location | Notes |
|---|--------|----------|--------|
| 1 | Session domain | `domain/auth/` | 만료 판단, SID 디코딩→해시 규칙(순수 함수). |
| 2 | Auth application | `application/auth/` | Login / Logout / Me; 단일 세션 정책 DELETE 호출. |
| 3 | Session repository | `infrastructure/session/` | `sessions` CRUD; 조회 키는 **sha256 hex**. |
| 4 | Cookie helpers | `infrastructure/session/cookieOptions.ts` (예시명) | `getSessionCookieOptions()`, set/clear 래퍼. |
| 5 | Auth routes | `presentation/routes/auth.ts` | HTTP만; Application 호출. |
| 6 | Session middleware | `middleware/auth/` | `requireAdminSession`: authn 성공 시 `req.adminUserId` 또는 `req.auth` 타입 고정. |
| 7 | Config constants | `application/auth/sessionConfig.ts` (예시명) | `SESSION_TTL_MS`, 쿠키명 상수 re-export. |
| 8 | Admin router wiring | `app.ts` | `app.use('/api/admin', requireAdminSession, adminRouter)`. |

---

## C. Updated DB contract

**신규 테이블만 추가.** 기존 `admin_users` 스키마는 변경하지 않는다.

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_admin_user_id ON sessions(admin_user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

- **`id`**: 쿠키에 넣지 않는 값. **`sha256(원시 32바이트)` 의 hex 문자열** (64 chars).
- **`admin_user_id`**: MVP 명확성을 위해 `user_id` 대신 고정.

---

## D. API contract (unchanged paths, tightened semantics)

| Method | Path | Auth | Success | Failure |
|--------|------|------|---------|---------|
| POST | `/api/auth/login` | 없음 | 200 + `Set-Cookie` (`pp_session`) + `{ user: { id, username } }` | 401 |
| POST | `/api/auth/logout` | 세션 쿠키 | 204 + 쿠키 제거 | 401 (쿠키 없음/무효/만료) |
| GET | `/api/auth/me` | 세션 쿠키 | 200 + 동일 user DTO | 401 |

**`api-spec.yaml`**: 위 경로·응답·401 스키마 반영.

---

## E. Exact execution order (승인 후 변경 금지)

1. **DB:** `sessions` 테이블 마이그레이션(SQL 파일 또는 프로젝트 표준 도구) + 로컬 적용 확인.
2. **Domain + infrastructure:** SID 생성/해시, `PgSessionRepository`, 쿠키 옵션 헬퍼(단위 테스트).
3. **Application:** `AuthService.login` (비밀번호 검증은 기존 admin 경로 재사용), 로그인 시 기존 세션 DELETE 후 INSERT; `logout`, `me`.
4. **Routes:** `presentation/routes/auth.ts` — POST login/logout, GET me.
5. **Middleware:** `requireAdminSession` — 쿠키 파싱 → 해시 조회 → 만료 시 DELETE + 401.
6. **Wire:** `app.ts`에서 `/api/admin` 앞에 미들웨어; CORS에 `credentials: true` 및 origin 명시.
7. **기존 테스트:** `adminUsers` 등 슈퍼테스트에 로그인 헬퍼 또는 쿠키 주입으로 갱신.
8. **문서:** `api-spec.yaml`, 프론트 `fetch(..., { credentials: 'include' })` 메모.

---

## F. Exact verification scenarios (각각 기대 결과 고정)

| ID | Scenario | Steps | Expected | Failure = 버그 |
|----|----------|-------|----------|----------------|
| V1 | 마이그레이션 | DB에 `sessions` 존재, `admin_user_id` 컬럼명 | `\d sessions` 또는 동등 확인 | 컬럼명 `user_id` 등 이탈 |
| V2 | SID 저장 형태 | 로그인 1회 후 DB `sessions.id` 행 조회 | 64자 hex, 쿠키 raw와 직접 일치하지 않음 | 평문 SID가 DB에 저장 |
| V3 | 단일 세션 | 사용자 A로 로그인 두 번(연속) | `sessions` 에 `admin_user_id = A` 인 row **1개** | 2개 이상 |
| V4 | 로그인 쿠키 | POST `/api/auth/login` 유효 자격 | 200, `Set-Cookie: pp_session=...`, `HttpOnly`, `Path=/`, `SameSite=Lax`, `Max-Age`≈7d, production 시 `Secure` | 누락/불일치 |
| V5 | 보호 API 무보호 | 쿠키 없이 GET `/api/admin/users` | **401** JSON | 200 |
| V6 | 보호 API 보호 | V4 후 같은 agent로 GET `/api/admin/users` | **200** | 401 |
| V7 | Me | V4 후 GET `/api/auth/me` | 200, `id`/`username` 일치 | 401 |
| V8 | 로그아웃 | POST `/api/auth/logout` 후 GET `/api/admin/users` | 로그아웃 204; 이후 admin **401**; DB 해당 세션 row **없음** | 세션 잔존/200 |
| V9 | 만료 lazy | DB에서 `expires_at` 을 과거로 수정 후 GET `/api/admin/users` | **401**; (선택) 해당 row 삭제됨 | 200 |
| V10 | clearCookie 계약 | 로그아웃 응답 헤더 | `Set-Cookie` 로 `pp_session` 만료/삭제; 옵션이 V4 와 path/sameSite/secure 호환 | 브라우저에 쿠키 잔류 |
| V11 | 회귀 | `cd server && npm test` | exit 0, 전부 통과 | 실패 > 0 |

**verification-before-completion:** 위 표의 ID를 구현 체크리스트로 쓰고, “완료”는 해당 명령/요청을 **실행한 출력**이 있을 때만.

---

## G. Handoff

**Plan complete and saved to** `docs/plans/2026-03-25-session-auth.md`.

**Executing-plans 옵션:** (기존과 동일) 세션 내 태스크 단위 vs 새 세션 일괄.

**코딩은 이 문서 승인 후 시작한다.**
