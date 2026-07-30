# Railway 배포 (web + server + Postgres)

**날짜:** 2026-07-30  
**상태:** CLI 배포 진행됨 (web/server/Postgres 기동, schema 적용, `/api/admin/me` 401 확인)  
**트러블슈팅:** [troubleshooting-railway.md](../troubleshooting-railway.md)  
**결정:** 모노레포 유지, Railway에서 서비스만 분리 (옵션 A)

## Goal

같은 GitHub 레포(`web/` + `server/`)를 Railway에 올리고, 브라우저에서는 웹 공개 URL만 쓰며 `/api`는 웹 쪽 nginx가 서버로 프록시한다. 세션 쿠키는 same-origin으로 유지한다.

## Architecture

```
Browser  →  https://<web-public>/
                │
                ├─ static (SPA)
                └─ /api/*  ──(private)──►  server:PORT  ──►  Postgres
```

| Railway 서비스 | Root / Image | 공개 |
|----------------|--------------|------|
| Postgres | Railway Postgres 플러그인 | 비공개 |
| `server` | `server/` Dockerfile | 비공개(또는 헬스만) + Private Network |
| `web` | `web/` Dockerfile | 공개 도메인 |

레포 분리는 하지 않는다. 서비스별로 Root Directory만 지정한다.

## 코드/설정 변경 (필요 최소)

1. **`web/nginx.conf`**  
   Compose의 `http://server:3000`은 Railway에서 통하지 않음.  
   → `API_UPSTREAM`(예: `http://server.railway.internal:PORT`)을 빌드/런타임에 주입하는 템플릿(`envsubst`) 방식으로 전환.

2. **서버 환경 변수**  
   - `DATABASE_URL` ← Railway Postgres 참조  
   - `SESSION_SECRET` ← 강한 랜덤  
   - `CORS_ORIGIN` ← 웹 공개 URL (프록시만 쓰면 완화 가능하나, 직접 Origin 대비)  
   - `NODE_ENV=production`  
   - `PORT` ← Railway 제공값

3. **DB 스키마**  
   최초 1회 `db-schema/schema.sql` 적용(Railway 콘솔/`railway connect` 또는 마이그레이션 스크립트). Prisma 도입 전이라 SQL 수동 적용.  
   이어서 `db-schema/11_db_roles.sql`로 `psychpaper_app` / `psychpaper_admin` 롤을 만들고, 서버 `DATABASE_URL`은 **앱 롤**만 사용한다. 팀원 DB 클라이언트는 `psychpaper_admin`(전달 템플릿: `secrets/db-access.example.md`).

4. **Admin 시드**  
   로그인용 `admin_users` 행을 배포 후 1회 생성(문서화).

## CLI 흐름 (승인 후 실행)

1. `railway` CLI 설치·로그인  
2. 프로젝트 생성 / 링크  
3. Postgres 추가 → `DATABASE_URL` 확보  
4. `server` 서비스 추가 (root=`server`), 변수 연결  
5. `web` 서비스 추가 (root=`web`), `API_UPSTREAM` = server private URL  
6. 스키마 → `11_db_roles.sql` → 시드 적용 후 웹 URL로 스모크(로그인·`/api/admin/me`)

## Out of scope

- 레포 분리, Vercel 이전  
- 커스텀 도메인/CI 고도화(1차 성공 후)  
- Prisma 마이그레이션 도입

## Risks

| 리스크 | 완화 |
|--------|------|
| nginx upstream 하드코딩 | envsubst + `API_UPSTREAM` |
| 볼륨/비번 불일치(로컬과 동일 실수) | Railway 변수만 단일 소스 |
| 쿠키 `secure` + HTTPS | Railway HTTPS + `NODE_ENV=production` |
| 스키마 미적용 | 배포 체크리스트에 SQL 포함 |

## Success criteria

- 웹 공개 URL에서 SPA 로드  
- `/api/admin/login` → 세션 쿠키 설정  
- `/api/admin/me` 200 (로그인 후)  
- CORS/28P01/404 `/me` 없음
