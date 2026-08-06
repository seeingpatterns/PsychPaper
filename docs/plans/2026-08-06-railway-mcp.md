# Railway 배포 — MCP 기반 실행 및 DB 이중 계정

**날짜:** 2026-08-06
**상태:** 진행 중 (로컬 MCP 설치 완료, opencode 재시작 대기)
**기준 설계:** [2026-07-30-railway-deploy.md](./2026-07-30-railway-deploy.md) (옵션 A, 모노레포 유지)
**배포 방식:** Railway CLI → **로컬 MCP**(opencode)로 전환

**Goal:** Railway 배포·운영을 CLI 대신 로컬 MCP(`railway mcp`, stdio)로 수행하고, DB 이중 계정(앱 롤 `psychpaper_app` + 팀원 관리자 롤 `psychpaper_admin`)을 **Railway Postgres**에 생성해 템플릿으로 팀원 전달한다.

**Architecture:** opencode의 `mcp.railway`(type=local, `railway mcp`)가 기존 CLI 로그인을 재사용해 Railway API를 호출한다. 서비스 프로비저닝(프로젝트·Postgres·server/web·변수·도메인)은 MCP 툴이 맡고, SQL(schema·roles·seed)은 MCP에 Postgres 툴이 없으므로 `railway connect` 또는 DB 클라이언트가 맡는 하이브리드 구성.

**Tech stack:** Railway CLI 5.30.1, Railway MCP(local stdio), opencode, PostgreSQL, web/nginx(envsubst), Express server.

**Execution:** 이 플랜은 진행 로그 + 잔여 태스크를 겸한다. 실행은 opencode 재시작 후 MCP 툴로 단계별 진행하며, 각 태스크 사이에 검토 게이트를 둔다.

---

## Status

- [x] Railway CLI 설치·로그인 (5.30.1, Jeongjun / ljj0210@gmail.com)
- [x] `.gitignore` 설정 — `secrets/*`(예외 `*.example.md`), `.env.railway` 등
- [x] 로컬 MCP 설치 → `~/.config/opencode/opencode.json` (`mcp.railway`, type=local)
- [x] MCP 실행 오류(`MCP server not found: railway`) 수정 — Windows npm `.cmd` 쉼 문제, command를 `railway.exe` 절대 경로로 변경
- [x] nginx `API_UPSTREAM` envsubst — `web/nginx.conf.template` + `web/Dockerfile`
- [x] 프로젝트 생성 (psychpaper `aee6e6c7-f1fc-4d1f-b80f-22aab7fd3ba9`) — 기존 프로젝트에 PsychPaper 없음 → 신규
- [x] Postgres 프로비저닝 (템플릿 배포, TCP 프록시 `ballast.proxy.rlwy.net:22703`)
- [x] DB 이중 계정 생성 (Railway Postgres) + 팀원 전달 `secrets/db-access.md`
- [x] `server` / `web` 배포 + 변수 연결 (`DATABASE_URL`=앱 롤, `SESSION_SECRET`, `CORS_ORIGIN`, `API_UPSTREAM=http://server.railway.internal:3000`)
- [x] 스키마 · 시드 적용 (`schema.sql`, `11_db_roles.sql`, `seed-admin-lee.sql`)
- [x] 세션 쿠키 이슈 수정 — nginx `X-Forwarded-Proto` passthrough (스모크 계정으로 로그인→Set-Cookie→`/me` 200 검증)
- [x] 스모크 — `/` 200, `/api/admin/me` 401, 로그인 세션 쿠키 흐름 정상 (실계정 로그인은 새 비밀번호 확정 후)
- [ ] Closeout (임시 파일 정리, 아키텍처 분류, 백로그 반영, 보관)

## MCP 진행 로그

| 일시 | 항목 | 내용 |
|------|------|------|
| 2026-08-06 | MCP 설치 | `railway mcp install --agent opencode` → 로컬 stdio, `~/.config/opencode/opencode.json` 기록 (스키마 검증 통과) |
| 2026-08-06 | MCP 오류 수정 | `MCP server not found: railway` — Windows에서 `railway`가 npm `.cmd` 쉼이라 CreateProcess로 직접 실행 불가. command를 `railway.exe` 절대 경로로 변경 |
| 2026-08-06 | 결정 | DB 이중 계정은 **Railway Postgres**에 생성 (로컬 Docker가 아님) |
| 2026-08-06 | 프로젝트 생성 | psychpaper (`aee6e6c7-...`) / production env 생성 |
| 2026-08-06 | Postgres | 템플릿 배포, 공개 HTTP 도메인은 443에 HTTP 프록시라 TCP 불가 → **TCP 프록시** `ballast.proxy.rlwy.net:22703` 생성 |
| 2026-08-06 | DB 이중 계정 | `schema.sql` → `11_db_roles.sql`(앱/어드민 롤) → `seed-admin-lee.sql` 적용. 두 롤 로그인 확인. `secrets/db-access.md` 실값 작성(gitignore 확인) |
| 2026-08-06 | server/web 배포 | MCP `deploy`(tarball). server 변수: DATABASE_URL(내부), SESSION_SECRET, PORT, NODE_ENV, CORS_ORIGIN. web: API_UPSTREAM + 도메인 `web-production-46478.up.railway.app` |
| 2026-08-06 | 세션 쿠키 이슈 | 로그인 200인데 Set-Cookie 없음. 원인: Railway TLS 엣지→nginx는 HTTP라 `$scheme=http`, `X-Forwarded-Proto $scheme`이 서버에 http 전달 → secure 쿠키 억제. **nginx가 원본 `X-Forwarded-Proto`를 통과시키도록 수정**, web 재배포 후 스모크 계정으로 Set-Cookie→`/me` 200 확인 |
| 2026-08-06 | 정리 | 스모크 계정 삭제, 디버깅용 server 공개 도메인·Postgres HTTP 도메인 제거 (CLI `railway domain delete`) |

## Design

- 브라우저는 web 공개 URL만 사용. `/api`는 nginx가 `API_UPSTREAM`(server private URL `http://server.railway.internal:PORT`)으로 프록시.
- 서버 변수: `DATABASE_URL`(**앱 롤** `psychpaper_app`), `SESSION_SECRET`(강한 랜덤), `CORS_ORIGIN`(web 공개 URL), `NODE_ENV=production`, `PORT`(Railway 제공).
- DB 이중 계정 (Railway Postgres):
  - `psychpaper_app` — 서버 `DATABASE_URL`용 (DML만, DDL 없음)
  - `psychpaper_admin` — 팀원 DB 클라이언트용 (조회·변경·DDL, 슈퍼유저 아님)
  - 생성: `db-schema/11_db_roles.sql`을 부트스트랩 롤로 적용 (비밀번호는 로컬에서만 치환, 커밋 금지)
  - 전달: `secrets/db-access.md` (= `secrets/db-access.example.md` 복사본, gitignore 영역)
- MCP 툴 목록(local): `list-projects`, `create-project-and-link`, `list-services`, `link-service`, `deploy`, `deploy-template`, `set-variables`, `generate-domain`, `get-logs`, `check-railway-status`.

## Tasks

### Task 1: opencode 재시작 및 MCP 활성화·기존 상태 확인

**Files:** (설정만, 코드 없음)

**Step 1: opencode 재시작**
Command: opencode 종료 후 재실행  
Expected: Railway MCP 툴 로드

**Step 2: MCP 활성화 확인**
Command: MCP 툴 `check-railway-status` 호출  
Expected: CLI 설치·로그인 정상

**Step 3: 기존 Railway 서비스 확인**
Command: MCP 툴 `list-projects` / `list-services`  
Expected: 기존 CLI 배포로 만든 Postgres·server·web 존재 여부 파악 (있으면 유지)

### Task 2: Postgres 프로비저닝

**Files:** (없음)

**Step 1: 없으면 생성**
Command: MCP `deploy-template`(Railway Postgres) 또는 `create-project-and-link` + Postgres 추가  
Expected: Postgres 기동, `DATABASE_URL`(부트스트랩) 확보

**Step 2: 프라이빗 네트워크 확인**
Expected: server/web이 `*.railway.internal`로 접근 가능

### Task 3: DB 이중 계정 생성 + 팀원 전달

**Files:**
- Modify: `db-schema/11_db_roles.sql` (CHANGE_ME_* 실값 치환은 로컬에서만, 커밋 금지)
- Create: `secrets/db-access.md` (gitignore, `db-access.example.md` 복사)

**Step 1: Postgres 연결**
Command: `railway connect --service Postgres` (또는 `psql "$ADMIN_URL"`)  
Expected: 접속 성공

**Step 2: 스키마 적용 (미적용 시)**
Command: `psql "$ADMIN_URL" -f db-schema/schema.sql`  
Expected: 오류 없음

**Step 3: 롤 생성**
Command: `psql "$ADMIN_URL" -f db-schema/11_db_roles.sql`  
Expected: `CREATE ROLE` 2건, GRANT 정상

**Step 4: 앱 롤 확인**
Command: `psql "postgresql://psychpaper_app:...@<host>:5432/railway" -c "select 1"`  
Expected: 접속 성공 (28P01 없음)

**Step 5: 전달 템플릿 작성**
Command: `secrets/db-access.md`에 실값 기록  
Expected: 팀원이 해당 문서로 접속 가능

### Task 4: server / web 배포 및 변수 연결

**Files:** (없음, Railway 콘솔/변수만)

**Step 1: 서비스 배포**
Command: MCP `link-service`/`deploy` — root=`server` / `web`  
Expected: 각 서비스 기동

**Step 2: 변수 연결**
Command: MCP `set-variables`  
Expected: server: `DATABASE_URL`(psychpaper_app), `SESSION_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production` / web: `API_UPSTREAM=http://server.railway.internal:PORT`

**Step 3: web 도메인**
Command: MCP `generate-domain`  
Expected: 공개 URL 확보

### Task 5: 스키마·시드 및 스모크

**Files:**
- Run: `db-schema/seed-admin-lee.sql` (관리자 시드, 1회)

**Step 1: 시드 적용**
Command: `psql "$ADMIN_URL" -f db-schema/seed-admin-lee.sql`  
Expected: `admin_users` 행 1건

**Step 2: 스모크 체크리스트**
Command: `GET https://<web>/`, `GET /api/admin/me`, `POST /api/admin/login`  
Expected: `/` 200, `/me` 401(빠른 응답), login `{"ok":true}` + 세션 쿠키

### Closeout

- 임시 파일·로그 정리, 아키텍처 분류(fix-now/defer/backlog), 백로그 반영, `docs/plans/README.md` 활성 목록 갱신 후 보관
