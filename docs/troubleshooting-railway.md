# Railway 배포 트러블슈팅

PsychPaper (`web` + `server` + Postgres)를 Railway에 올릴 때 실제로 겪은 이슈와 해결입니다.  
관련 설계: [2026-07-30-railway-deploy.md](./plans/2026-07-30-railway-deploy.md)

## 현재 구성 요약

| 서비스 | 역할 |
|--------|------|
| `web` | SPA + nginx (`/api` 프록시) |
| `server` | Express API |
| `Postgres` | DB |

- 웹 공개 URL만 브라우저에 노출하고, `/api`는 nginx가 서버로 넘긴다.
- 서버는 `0.0.0.0:$PORT`에 바인딩한다 ([`server/src/index.ts`](../server/src/index.ts)).
- production에서는 `trust proxy = 1` ([`server/src/app.ts`](../server/src/app.ts)).

---

## 1. `GET /api/admin/me` → 404

**증상**

- 브라우저: `Failed to load resource: 404`
- 또는 Express: `Cannot GET /api/admin/me`

**원인**

- Vite(`:5173`)는 최신 코드인데, `:3000`이 **예전에 빌드된 Docker 이미지**를 가리킴.
- `/me`는 Dashboard 병합 이후 라우트라, 구 이미지에는 없음. `login`만 되는 경우가 많음.

**확인**

```powershell
# 3000을 누가 쓰는지
netstat -ano | findstr ":3000"
docker ps
```

**해결**

```powershell
docker compose up --build -d server
# 또는 로컬: cd server && npm run dev
```

---

## 2. CORS: `Not allowed by CORS`

**증상**

- 서버 로그에 `Error: Not allowed by CORS`
- `/me`는 401인데 다른 요청(프리플라이트 등)이 실패

**원인**

- `.env.docker`의 `CORS_ORIGIN`이 `http://localhost:8080`만 허용
- 실제 프론트는 Vite `http://localhost:5173`

**해결**

```env
CORS_ORIGIN=http://localhost:5173,http://localhost:8080
```

Railway에서는 웹 공개 URL을 넣는다.

```text
CORS_ORIGIN=https://web-xxxx.up.railway.app
```

변경 후 서버 컨테이너/서비스 재시작.

---

## 3. 로그인 500: `password authentication failed for user "postgres"` (28P01)

**증상**

```text
admin login error: error: password authentication failed for user "postgres"
code: '28P01'
```

**원인 (둘 중 하나 이상)**

1. `POSTGRES_PASSWORD`와 `DATABASE_URL` 안의 비밀번호가 **서로 다름**
2. Postgres 볼륨은 **최초 생성 시** 비밀번호가 고정됨 → `.env`만 바꿔도 볼륨 안 비밀번호는 안 바뀜

**해결**

1. `.env.docker`에서 두 값을 **동일**하게 맞춤  
   - `POSTGRES_PASSWORD=...`  
   - `DATABASE_URL=postgresql://...:같은비번@db:5432/...`
2. 로컬을 초기화해도 되면:

```powershell
docker compose down
docker volume rm psychpaper_lecture_pgdata
docker compose up --build -d
```

공식 Postgres 이미지에는 “기본 비밀번호”가 없다. `POSTGRES_PASSWORD`가 곧 최초 비밀번호다.

---

## 4. 로그인 화면이 「인증 상태 확인 중…」에 멈춤

**증상**

- Admin 로그인 카드에 `인증 상태 확인 중…`만 계속 표시
- 폼이 안 나타남

**원인**

- **서비스 계정(`psychpaper_app`) 미적용이 아님**
- 페이지 로드 시 `getAdminMe()` → `/api/admin/me`가 **응답 없이 타임아웃**하면 `checking`이 `false`로 안 풀림
- nginx 로그 예:

```text
upstream timed out while connecting to upstream
upstream: "http://…:3000/api/admin/me"
```

**세부 원인**

1. `API_UPSTREAM=http://server.railway.internal:3000` 프라이빗 네트워크 연결 실패  
2. 공개 서버 URL로 프록시할 때 `Host: $host`(웹 도메인)를 그대로 넘기면 Railway 라우팅이 깨짐

**해결**

1. 서버가 `0.0.0.0`에 바인딩되는지 확인  
2. 웹 `API_UPSTREAM`을 서버 **공개 URL**로 설정 (프라이빗이 안 될 때)

```text
API_UPSTREAM=https://server-xxxx.up.railway.app
```

3. nginx에서 업스트림 Host는 프록시 대상 호스트 사용:

```nginx
proxy_pass ${API_UPSTREAM};
proxy_ssl_server_name on;
proxy_set_header Host $proxy_host;
proxy_set_header X-Forwarded-Host $host;
```

**정상 시**

```text
GET /api/admin/me → 401 {"code":"UNAUTHORIZED",...}  (빠른 응답)
```

---

## 5. `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`

**증상**

```text
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false
code: 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR'
```

로그인 rate-limit에서 발생.

**원인**

- nginx가 `X-Forwarded-For`를 넣는데 Express `trust proxy`가 꺼져 있음
- 예전 코드는 `ADMIN_IP_WHITELIST`가 있을 때만 `trust proxy`를 켬

**해결**

production(또는 프록시 뒤)에서는:

```ts
app.set('trust proxy', 1)
```

배포 후 로그인 재시도.

---

## 6. schema 적용 시 인코딩 / 부분 적용 오류

**증상**

- `ERROR: syntax error at or near "UUID"` (한글 주석 깨짐)
- `ERROR: type "content_type" already exists`

**해결**

- PowerShell에서 SQL 파이프 시 `-Encoding utf8` 사용
- 부분 실패 후 재적용 시:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- 그다음 schema.sql
```

도우미: `secrets/apply-schema.ps1` (gitignore 영역, 로컬용)

```powershell
railway run --service Postgres -- powershell -NoProfile -File .\secrets\apply-schema.ps1
```

---

## 체크리스트 (배포 후 스모크)

| 확인 | 기대 |
|------|------|
| `GET https://<web>/` | 200 |
| `GET https://<web>/api/admin/me` | 401 JSON (타임아웃 아님) |
| `POST .../api/admin/login` (시드 계정) | `{"ok":true}` |
| 로그인 페이지 | 「인증 상태 확인 중…」이 곧 사라지고 폼 표시 |

시드 예: [`db-schema/seed-admin-lee.sql`](../db-schema/seed-admin-lee.sql)

---

## 아직 선택 과제

| 항목 | 메모 |
|------|------|
| `db-schema/11_db_roles.sql` | 앱 롤 / 팀원 admin 롤. 지금은 Postgres 기본 URL로도 동작 |
| 프라이빗 네트워크 프록시 | `*.railway.internal`이 안정화되면 공개 URL 프록시보다 권장 |
| 세션 스토어 | MemoryStore production 경고 → Redis 등으로 교체 검토 |
| 팀원 DB 접속 | [`secrets/db-access.example.md`](../secrets/db-access.example.md) 복사 후 실값 전달 (커밋 금지) |
