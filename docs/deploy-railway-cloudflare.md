# Railway + Cloudflare 배포 가이드 (PsychPaper)

모노레포(`web` + `server`)를 Railway에 올리고, Cloudflare로 커스텀 도메인을 쓰기 전에 확인할 **보안·구성 사항**과 **진행 순서**를 정리한 문서입니다.

---

## 1. 배포 전 보안·구성 점검 (필독)

| 항목 | 현재 코드 기준 상태 | 권장 조치 |
|------|---------------------|-----------|
| **CORS** | `cors({ origin: true, credentials: true })` — 요청 `Origin`을 그대로 허용 | 프로덕션에서는 **허용 출처 화이트리스트**만 두는 것이 안전합니다. (예: `https://yourdomain.com`, Railway 프리뷰 URL은 스테이징 전용으로만) `.env.docker`에 `CORS_ORIGIN`이 있으나 **앱에서 아직 사용하지 않음** → 배포 전 환경 변수로 목록을 읽어 `origin` 콜백에서 검증하도록 구현 권장. |
| **프론트 API 경로** | `fetch('/api/...')` — **상대 경로만** 사용 ([`web/src/shared/api/client.ts`](../web/src/shared/api/client.ts)) | 브라우저가 **API와 같은 호스트·같은 스킴**으로 요청해야 합니다. 프론트·백을 서로 다른 Railway URL로만 두면 `/api`가 프론트 호스트로 가서 실패합니다. **(택1)** 동일 도메인에서 경로로 나눔(리버스 프록시/Cloudflare Rules), **(택2)** 빌드 타임 `VITE_API_BASE_URL` 등으로 절대 URL 지정 + CORS·쿠키 `SameSite` 정합성 맞추기. |
| **세션 쿠키** | `httpOnly`, `sameSite: 'lax'`, 프로덕션에서 `secure: true` | HTTPS(Cloudflare + Railway)와 맞으면 적절합니다. 서브도메인 분리(`www` / `api`) 시에는 `domain`·`SameSite`를 설계에 맞게 조정해야 합니다. |
| **Trust proxy** | `ADMIN_IP_WHITELIST`가 있을 때만 `trust proxy` | Cloudflare·Railway 뒤에서 **클라이언트 IP**를 쓸 계획이면 프로덕션에서 `app.set('trust proxy', true)`(또는 흉내 내는 홉 수 제한) 검토. |
| **PostgreSQL** | `new Pool({ connectionString })`만 사용 | Railway 등 매니지드 DB는 **SSL 연결**을 요구하는 경우가 많습니다. 연결 문자열에 `?sslmode=require`가 포함되는지 확인하고, 실패 시 `pg` 풀 옵션으로 SSL 설정. |
| **Helmet** | (도입 예정) | 기본 헤더(X-Content-Type-Options 등)에 더해, **API만** 제공한다면 CSP는 프론트 호스팅 방식에 맞게 조정(과도한 CSP로 개발/빌드 깨짐 방지). |
| **시크릿** | `SESSION_SECRET`, DB URL 등 | Railway Variables에만 두고, 저장소·로그에 남기지 않기. 로테이션 절차 문서화. |
| **관리자 로그인** | 세션 + bcrypt | **로그인 시도 제한**(레이트 리밋)은 Helmet과 별개로 권장. IP 화이트리스트는 이미 옵션으로 존재. |
| **Cloudflare** | — | DNS 프록시(주황 구름) 사용 시 **SSL/TLS 모드**를 “Full (strict)”로 맞추기. 필요 시 WAF·Bot Fight(유료/플랜에 따름). |

요약: **가장 먼저** “프론트와 API를 사용자에게 **한 도메인으로 보이게 할지**, **서브도메인으로 나눌지**”를 정한 뒤, 그에 맞춰 **CORS·쿠키·프론트 `fetch` 베이스 URL**을 맞추면 됩니다.

---

## 2. 권장 아키텍처 (초기에 단순하게)

**방법 A — 단일 출처(추천으로 설명하기 쉬움)**  
사용자는 `https://yourdomain.com`만 봅니다.

- Cloudflare가 `yourdomain.com`으로 들어오는 트래픽을 받고,
- 정적 파일은 Railway의 **웹 서비스**(또는 Cloudflare Pages 등)로,
- `/api/*`는 **같은 호스트**에서 API 서비스로 프록시합니다.

이렇게 하면 기존 `fetch('/api/...')`를 **코드 변경 없이** 유지하기 쉽습니다. 구현은 Cloudflare **Workers / Rules** 또는 Railway 앞단 **단일 진입점**(커스텀 서버·리버스 프록시) 중 하나를 선택합니다.

**방법 B — 서브도메인 분리**  
예: `app.yourdomain.com`(프론트), `api.yourdomain.com`(백엔드).

- Vite 빌드 시 API 베이스 URL을 환경 변수로 주입하고,
- CORS에 `https://app.yourdomain.com`만 허용,
- 쿠키를 API 도메인에 심을지·공유 도메인을 어떻게 둘지(보통 **같은 사이트**로 맞추려면 상위 도메인·`SameSite=None; Secure` 등) 설계가 필요합니다.

Railway 모노레포에서는 보통 **서비스 3개**: PostgreSQL 플러그인, **server**, **web**을 두고, 위 아키텍처에 맞게 빌드·시작 명령만 나눕니다.

---

## 3. Railway 설정 개요

1. **PostgreSQL**  
   - 프로젝트에 DB 추가 → `DATABASE_URL`을 **server 서비스**에 연결(참조 변수).  
   - 마이그레이션/스키마 적용 방법은 기존 `db-schema` 또는 Prisma 등 프로젝트 절차를 따릅니다.

2. **Backend 서비스**  
   - Root Directory: `server`  
   - Build: `npm install` (또는 `npm ci`) + 필요 시 `npm run build`  
   - Start: `package.json`의 start 스크립트(예: `node dist/...` 또는 `tsx` 등 현재 구성에 맞게)  
   - Variables: `NODE_ENV=production`, `SESSION_SECRET`, `DATABASE_URL`, (선택) `CORS_ORIGIN`, `ADMIN_IP_WHITELIST`  
   - **PORT**: Railway가 주입하는 `PORT`를 사용하는지 확인 ([`server/src/index.ts`](../server/src/index.ts)는 이미 `process.env.PORT` 사용).

3. **Frontend 서비스**  
   - Root Directory: `web`  
   - Build: `npm ci && npm run build`  
   - 출력 디렉터리: Vite 기본이면 `dist` — 정적 호스팅에 맞게 **정적 파일 서버** 또는 Railway의 정적 설정 사용.  
   - **방법 B**를 쓰는 경우 빌드 시 `VITE_*` 변수 주입.

4. **CI/CD**  
   - Railway가 GitHub 등에 연결되어 있으면 브랜치별 자동 배포 가능.  
   - 모노레포이므로 **어느 경로 변경 시 어느 서비스가 재배포되는지** Railway 설정에서 지정합니다.

---

## 4. Cloudflare (커스텀 도메인)

1. Cloudflare에 도메인 추가 후 네임서버 변경.  
2. **DNS**  
   - Railway가 준 CNAME/A 대상을 레코드로 추가.  
   - 프록시(주황 구름) 사용 여부는 트래픽 정책에 맞게.  
3. **SSL/TLS**  
   - Origin이 Railway이면 일반적으로 **Full (strict)** + Railway/유효 인증서 확인.  
4. (선택) **HSTS**, **최소 TLS 버전** 상향.

---

## 5. Helmet 적용 시 메모

- `app.use(helmet())`는 `cors`, `session` 순서와 맞추어 보통 **라우트보다 앞**에 둡니다.  
- API만 노출하고 JSON만 쓴다면 기본 Helmet으로도 이득이 큽니다.  
- `Content-Security-Policy`는 SPA 정적 호스팅과 겹치면 조정이 필요할 수 있어, **단계적으로** 켜는 것을 권장합니다.

---

## 6. 배포 후 스모크 테스트

- `https://(your-domain)/` 에서 페이지 로드.  
- 공개 API 한두 개(헬스·글 목록 등) 응답 확인.  
- 관리자 로그인(해당하는 경우) → 세션 쿠키가 **HTTPS**에서만 전송되는지, **로그아웃** 동작 확인.  
- 브라우저 개발자 도구 Network에서 **CORS 오류**·**쿠키 차단** 여부 확인.

---

## 7. 한 줄 체크리스트

- [ ] DB SSL·연결 문자열 확인  
- [ ] `SESSION_SECRET` 프로덕션 전용 강한 값  
- [ ] CORS를 실제 프론트 출처로 제한 (구현 반영)  
- [ ] 프론트 `/api`와 실제 API 호스트 일치 (프록시 또는 베이스 URL)  
- [ ] Cloudflare SSL 모드 Full (strict)  
- [ ] (선택) 관리자 로그인 레이트 리밋  

이 문서는 인프라 제품 UI 변경에 따라 세부 단계는 달라질 수 있으므로, Railway·Cloudflare 공식 문서의 최신 스크린샷과 함께 보는 것을 권장합니다.
