# Phase 2: 백엔드 CRUD (Layered / DDD)

**선행 조건**: [Phase 1](phase-1-spec-and-db.md) 완료 — api-spec.yaml에 Admin User 경로·스키마가 정의되어 있어야 한다.

## 목표

- Admin User CRUD를 **Layered Architecture + DDD**에 맞게 구현한다.
- **TDD**로 진행: 실패하는 테스트 작성 → 실행해 실패 확인 → 최소 구현 → 통과 확인 → 리팩터.
- **테스트 구분**: Domain/Service는 단위 테스트( mock ), Repository는 통합 테스트 또는 in-memory, 라우트는 슈퍼테스트 등 통합 테스트로 스펙 대로 응답 검증.

## 레이어·파일 구조 (예시)

```
server/src/
├── domain/
│   └── admin-user/
│       └── AdminUser.ts          # 엔티티 또는 타입
├── application/
│   └── admin-user/
│       └── AdminUserService.ts   # 유스케이스
├── infrastructure/
│   └── persistence/
│       └── AdminUserRepository.ts
├── presentation/
│   └── routes/
│       └── adminUsers.ts         # Express 라우트
└── index.ts                      # 라우트 마운트
```

---

## 구현 계획

### 1. 폴더 구조 생성

- **작업**: server/src 아래 domain, application, infrastructure, presentation 디렉터리(및 하위) 생성.
- **구현 위치**
  - `server/src/domain/admin-user/`
  - `server/src/application/admin-user/`
  - `server/src/infrastructure/persistence/`
  - `server/src/presentation/routes/`
- **체크**
  - [x] `server/src/domain/admin-user/`, `application/admin-user/`, `infrastructure/persistence/`, `presentation/routes/` 가 존재한다.

---

### 2. Domain — AdminUser 엔티티/타입 (TDD)

- **파일**: `server/src/domain/admin-user/AdminUser.ts` (및 필요 시 `index.ts`)
- **단계**:
  1. **RED**: 테스트 파일 생성 `server/src/domain/admin-user/AdminUser.test.ts`. 예: “AdminUser는 id, username, created_at을 가진다”, “password_hash는 반환하지 않는다” 등. `npm test` 실행 → 실패 확인.
  2. **GREEN**: AdminUser 타입/클래스 정의. 테스트 통과할 최소 코드만.
  3. **REFACTOR**: 중복 제거, 네이밍 정리.

**체크**

- [x] AdminUser 관련 테스트가 먼저 작성되었고, 한 번 이상 실패를 확인했다. (`server/src/domain/admin-user/AdminUser.test.ts`)
- [x] AdminUser 타입 또는 클래스가 정의되어 있고, id, username, created_at을 갖는다. (`server/src/domain/admin-user/AdminUser.ts`)
- [x] 모든 해당 테스트가 통과한다. (`cd server && npm test`)

---

### 3. Infrastructure — AdminUserRepository 인터페이스·구현 (TDD)

- **파일**
  - 인터페이스: `server/src/application/admin-user/AdminUserRepository.ts`
  - In-memory 구현: `server/src/application/admin-user/InMemoryAdminUserRepository.ts`
  - PostgreSQL 구현: `server/src/infrastructure/persistence/PgAdminUserRepository.ts`
  - 테스트: `server/src/application/admin-user/AdminUserRepository.test.ts`
- **단계**:
  1. **RED**: Repository 테스트 작성. 예: findAll(), findById(id), create({ username, passwordHash }), update(id, { username?, passwordHash? }), delete(id). DB 사용 시 통합 테스트 또는 in-memory 더미로 먼저.
  2. **GREEN**: PostgreSQL을 사용하는 구현. pool.query로 admin_users 테이블에 CRUD. 비밀번호는 호출 전에 해시된 값만 저장.
  3. **REFACTOR**: SQL 상수 분리, 에러 처리 일관화.

**체크**

- [x] Repository 테스트가 먼저 작성되었고, 실패 후 구현으로 통과시켰다. (`AdminUserRepository.test.ts`)
- [x] findAll, findById, create, update, delete가 구현되어 있다. (`InMemoryAdminUserRepository.ts`, `PgAdminUserRepository.ts`)
- [x] 비밀번호는 평문이 아닌 해시만 저장한다. (Repository에는 `passwordHash`만 전달)

---

### 4. Application — AdminUserService (TDD)

- **파일**
  - 서비스: `server/src/application/admin-user/AdminUserService.ts`
  - 테스트: `server/src/application/admin-user/AdminUserService.test.ts`
- **단계**:
  1. **RED**: Service 테스트. Repository를 mock하여 CreateAdminUser, GetAdminUser, UpdateAdminUser, DeleteAdminUser 동작 검증. username 중복 시 409 등 비즈니스 규칙 테스트.
  2. **GREEN**: Service 구현. Repository 주입, bcrypt 해시는 Service 또는 별도 도메인 서비스에서 수행.
  3. **REFACTOR**: 중복 제거.

**체크**

- [x] AdminUserService 테스트가 TDD 순서로 작성·통과했다.
- [x] Create 시 username 중복 검사 후 409 반환 로직이 있다.
- [x] 비밀번호 해시는 Service(또는 도메인)에서 처리하고, Repository에는 해시만 전달한다. (`bcrypt.hash` 사용)

---

### 5. Presentation — 라우트·핸들러 (TDD)

- **파일**
  - 라우트: `server/src/presentation/routes/adminUsers.ts`
  - 테스트: `server/src/presentation/routes/adminUsers.test.ts`
- **단계**:
  1. **RED**: 라우트 통합 테스트 또는 슈퍼테스트로 GET/POST/PUT/DELETE 호출, api-spec과 동일한 요청/응답 형식 검증. 201 Location, 404, 409 등.
  2. **GREEN**: Express 라우트 구현. req.params.id 파싱·검증, req.body 검증, Service 호출, res.status().json() 형식을 api-spec에 맞춤.
  3. **REFACTOR**: 검증 로직 분리(validator), 에러 매핑 일관화.

**체크**

- [x] 각 엔드포인트(GET 목록·단건, POST, PUT, DELETE)에 대한 테스트가 있고, 스펙과 맞는 응답을 검증한다. (`adminUsers.test.ts`)
- [x] 400(잘못된 body/params), 404, 409, 500 응답이 스펙대로 반환된다.
- [x] POST 시 201과 Location 헤더(또는 스펙에 정의한 대로)가 설정된다.

---

### 6. index.ts에서 라우트 마운트

- **파일**
  - 앱 팩토리: `server/src/app.ts`
  - 엔트리포인트: `server/src/index.ts`
- **작업**: `server/src/index.ts`에서 기존 `/api/admin/users`(GET), `POST /api/admin/login`을 새 라우트 모듈로 이전하고, Admin User CRUD 라우트를 마운트. (login은 같은 `adminUsers.ts`에 두거나 별도 라우트 파일로 분리 가능; 한 파일에 둘 경우 Admin 관련 경로를 한 곳에서 관리.)
- **체크**
  - [x] `/api/admin/users` CRUD 라우트가 `presentation/routes/adminUsers.ts`에서 제공된다. (`createAdminUsersRouter`)
  - [x] `POST /api/admin/login` 동작이 유지되어 있다. (pool 주입 시 라우터 내부에서 처리)
  - [x] 서버 실행 후 수동으로 GET/POST/PUT/DELETE 호출 시 api-spec과 일치한다. (supertest로 기본 시나리오 검증)

---

### 7. 기존 index.ts 정리

- **작업**: DB pool, cors, express.json() 등은 유지. 라우트만 분리하여 index.ts는 앱 조립·listen만 담당하도록 정리.
- **체크**
  - [x] index.ts에 직접 작성된 Admin User CRUD 로직이 없고, 라우트 모듈만 사용한다. (`createApp` + `createAdminUsersRouter` 사용)

---

## Phase 2 체크리스트 (완료 기준)

- [x] Domain: AdminUser 엔티티/타입이 있고, 테스트로 검증되었다. (`AdminUser.ts`, `AdminUser.test.ts`)
- [x] Infrastructure: AdminUserRepository가 CRUD를 구현했고, 테스트가 있다. (`IAdminUserRepository`, InMemory/Pg 구현 + 테스트)
- [x] Application: AdminUserService가 유스케이스를 구현했고, username 중복·비밀번호 해시가 반영되었다. (`AdminUserService.ts`)
- [x] Presentation: GET/POST/PUT/DELETE 라우트가 api-spec과 동일한 형식으로 응답한다. (`adminUsers.ts` + supertest)
- [x] 모든 새 코드는 “실패하는 테스트 먼저 → 구현” 순서로 작성되었다. (RED → GREEN → REFACTOR)
- [x] `npm test`(또는 프로젝트 테스트 명령)가 통과한다. (`cd server && npm test`)

---

## 참고

- [phase-1-spec-and-db.md](phase-1-spec-and-db.md) — API 스펙
- [api-spec.yaml](../../../api-spec.yaml) (프로젝트 루트; Phase 1에서 위치 확정)
- [AGENTS.md](../../../AGENTS.md) — TDD, Backend 아키텍처
