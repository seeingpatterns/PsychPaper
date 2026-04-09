# Session-based authentication (express-session, dev MemoryStore) — Design

## Status

- This design supersedes `docs/plans/2026-03-25-session-auth.md` for the **express-session** approach.
- Coding should follow this document as the single source of truth for the implementation order and acceptance criteria.

---
## Goal

서버가 세션을 소유하고, 클라이언트는 **`pp_session` 쿠키(HttpOnly)** 만을 통해 인증 상태를 유지한다.

- 인증 주체: **오직 `admin_users`**
- 보호 대상: **`/api/admin/users` 및 `/api/admin/users/:id`**
- 로그인 엔드포인트: **기존 `POST /api/admin/login` 유지**

---
## Tech Stack (dev-focused)

- `express` + `express-session`
- 세션 저장소(Store): **dev는 MemoryStore**
- 세션 쿠키: `pp_session`

> 주의: MemoryStore는 다중 인스턴스/재시작 내구성이 없으므로, 운영에서는 DB Store로 전환 계획을 별도 문서로 둔다.

---
## Cookie contract

모든 환경에서 쿠키 계약은 동일하게 유지한다.

- `name`: `pp_session` (고정)
- `httpOnly`: `true`
- `path`: `/`
- `sameSite`: `lax`
- `secure`: `process.env.NODE_ENV === 'production'`
- `maxAge`: `SESSION_TTL_MS` (7일)

세션 파괴(로그아웃) 시 브라우저에 쿠키 제거를 시도한다.
- 삭제 호출: `req.session.destroy()` 후 `res.clearCookie('pp_session', ...)`를 **동일 옵션 계약**으로 수행

---
## Session lifecycle decisions

### TTL

- `SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000` (7일)
- dev(MemoryStore)는 쿠키 만료 및 요청 시 존재 여부로 인증을 판정한다.

### Concurrent login policy

- MVP(개발)에서는 **정책을 강제하지 않아도 동작**한다.
- 단, 옵션으로 “admin_userId당 활성 세션 1개”를 in-memory map으로 강제할 수 있다.
  - 이 강제는 단일 프로세스(dev)에서만 의미가 있고, 운영(다중 인스턴스)에서는 DB Store 기반으로 재구현이 필요하다.

---
## Authentication vs Authorization

- Authentication: `pp_session` → `req.session.adminUserId` 존재 여부 확인
- Authorization: 유효한 세션이면 관리자 API 접근 허용

보안 근거는 **오직 서버 미들웨어**에 둔다.
- 프론트 라우터/로컬스토리지 상태만으로 접근을 막는 것은 UX일 뿐이다.

---
## API contract

### 1) Login (existing)

- `POST /api/admin/login`
- Auth: 없음
- Request body: `{ username: string, password: string }`
- Success: `200` (현재 구현 `{ ok: true }` 응답 유지)
- Failure: `401` (기존 `{ ok: false }` 응답 유지)

로그인 성공 시:
- `req.session.adminUserId = <id>`

### 2) Logout (to add in the same phase as middleware)

- `POST /api/admin/logout`
- Auth: 필요(세션 필요)
- Success: `204` + 쿠키 제거
- Failure: `401`

로그아웃 시:
- `req.session.destroy()`
- `res.clearCookie('pp_session', ...)`

### 3) Protected Admin endpoints

- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `POST/PUT/DELETE /api/admin/users...`

모두:
- Auth: 필요
- Failure: `401`
- Success: 기존 동작 유지

---
## Required code touchpoints (design-level, no implementation here)

### 1) Session middleware wiring

- `server/src/app.ts`의 `createApp()`에서 `express-session`을 등록한다.
- 세션 미들웨어는 **인증 미들웨어/라우트보다 먼저** 등록되어야 한다.

### 2) Authorization middleware

- `server/src/middleware/requireAdminSession.ts` 생성
- 동작:
  - 쿠키/세션 존재하지 않으면 `401 JSON` 반환
  - 존재하면 `next()`

타입:
- `req.session.adminUserId` 타입 확장을 위해 `server/src/types/express-session.d.ts` 같은 파일이 필요하다.

### 3) Login route modifications (minimal change)

- `server/src/presentation/routes/adminUsers.ts`의 기존 `POST /api/admin/login`에서
  - bcrypt 검증 성공 시 `req.session.adminUserId = id`만 추가한다.
- 비밀번호 검증 로직을 별도 레이어로 완전히 옮기는 것은 **이번 phase 범위를 벗어난다(후속 refactor)**.

---
## SESSION_SECRET policy (requested)

- `SESSION_SECRET`이 **없으면 dev에서도 서버 시작/동작을 에러로 막는다**.
- 문서/환경 예시에 `SESSION_SECRET`을 필수로 명시한다.
- 예시:
  - `SESSION_SECRET=change-me-in-dev`

---
## Frontend / fetch contract

세션 쿠키 기반 인증이므로, 프론트 fetch는 반드시 쿠키를 포함해야 한다.

- `web/src/shared/api/client.ts`의 `apiFetch`에 `credentials: 'include'`를 반영한다.
- 현재 Vite proxy로 `/api`가 같은 오리진처럼 동작할 수 있으나,
  운영/도메인 분리 환경에서는 필수이므로 **기본값으로 고정**한다.

---
## Execution order (implementation checklist)

1. `server/package.json`에 `express-session` + (필요 시) types 의존성을 추가
2. `server/src/app.ts`
   - `express-session` 등록
   - 쿠키 옵션/TTL/secure/sameSite 설정
3. `server/src/presentation/routes/adminUsers.ts`
   - `POST /api/admin/login` 성공 시 `req.session.adminUserId` 저장
4. `server/src/middleware/requireAdminSession.ts`
   - 보호 미들웨어 구현
5. 라우트 보호 적용
   - `/api/admin/login`은 보호하지 않고, `/api/admin/users` 하위만 보호
6. (권장) `/api/admin/logout` 추가 및 로그아웃 테스트 보강
7. 테스트 수정
   - `request(app)` 대신 `request.agent(app)` 사용
   - 로그인 후 쿠키를 유지한 상태에서 보호 엔드포인트 검증

---
## Verification scenarios (dev MemoryStore 기준)

- V1: 보호 API 무쿠키
  - 쿠키 없이 `/api/admin/users` 호출 → `401 JSON`
- V2: 로그인 후 쿠키 발급
  - `/api/admin/login` 성공 → `Set-Cookie: pp_session` 존재, `HttpOnly=true`
- V3: 로그인 후 보호 API 접근
  - 같은 agent로 로그인 후 `/api/admin/users` → `200`
- V4: 로그아웃(추가 phase로 구현 시)
  - `/api/admin/logout` → `204`
  - 이후 보호 API → `401`
- V5: TTL 만료(가능하면 단위/통합에서 확인)
  - 테스트에서 TTL을 짧게 설정하여 쿠키/세션이 인증을 통과하지 못함을 검증
- V6: 회귀
  - `cd server && npm test` 통과

---
## Notes / Follow-ups

- 운영에서는 MemoryStore 대신 DB Store로 전환하는 것이 필요하다.
- “admin_user당 활성 세션 1개” 강제는 dev에서는 in-memory map으로 구현 가능하나,
  운영에서는 DB Store + unique 제약/트랜잭션으로 재구현한다.

