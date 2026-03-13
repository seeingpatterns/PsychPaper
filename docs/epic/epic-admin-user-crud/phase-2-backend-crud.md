# Phase 2: 백엔드 CRUD (Layered / DDD)

## 목표

- Admin User CRUD를 **Layered Architecture + DDD**에 맞게 구현한다.
- **TDD**로 진행: 실패하는 테스트 작성 → 실행해 실패 확인 → 최소 구현 → 통과 확인 → 리팩터.

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
- **체크**
  - [ ] `server/src/domain/admin-user/`, `application/admin-user/`, `infrastructure/persistence/`, `presentation/routes/` 가 존재한다.

---

### 2. Domain — AdminUser 엔티티/타입 (TDD)

- **파일**: `server/src/domain/admin-user/AdminUser.ts` (및 필요 시 `index.ts`)
- **단계**:
  1. **RED**: 테스트 파일 생성 `server/src/domain/admin-user/AdminUser.test.ts`. 예: “AdminUser는 id, username, created_at을 가진다”, “password_hash는 반환하지 않는다” 등. `npm test` 실행 → 실패 확인.
  2. **GREEN**: AdminUser 타입/클래스 정의. 테스트 통과할 최소 코드만.
  3. **REFACTOR**: 중복 제거, 네이밍 정리.

**체크**

- [ ] AdminUser 관련 테스트가 먼저 작성되었고, 한 번 이상 실패를 확인했다.
- [ ] AdminUser 타입 또는 클래스가 정의되어 있고, id, username, created_at을 갖는다.
- [ ] 모든 해당 테스트가 통과한다.

---

### 3. Infrastructure — AdminUserRepository 인터페이스·구현 (TDD)

- **파일**: `server/src/infrastructure/persistence/AdminUserRepository.ts` (또는 interface는 application/domain, 구현은 infrastructure)
- **단계**:
  1. **RED**: Repository 테스트 작성. 예: findAll(), findById(id), create({ username, passwordHash }), update(id, { username?, passwordHash? }), delete(id). DB 사용 시 통합 테스트 또는 in-memory 더미로 먼저.
  2. **GREEN**: PostgreSQL을 사용하는 구현. pool.query로 admin_users 테이블에 CRUD. 비밀번호는 호출 전에 해시된 값만 저장.
  3. **REFACTOR**: SQL 상수 분리, 에러 처리 일관화.

**체크**

- [ ] Repository 테스트가 먼저 작성되었고, 실패 후 구현으로 통과시켰다.
- [ ] findAll, findById, create, update, delete가 구현되어 있다.
- [ ] 비밀번호는 평문이 아닌 해시만 저장한다.

---

### 4. Application — AdminUserService (TDD)

- **파일**: `server/src/application/admin-user/AdminUserService.ts`
- **단계**:
  1. **RED**: Service 테스트. Repository를 mock하여 CreateAdminUser, GetAdminUser, UpdateAdminUser, DeleteAdminUser 동작 검증. username 중복 시 409 등 비즈니스 규칙 테스트.
  2. **GREEN**: Service 구현. Repository 주입, bcrypt 해시는 Service 또는 별도 도메인 서비스에서 수행.
  3. **REFACTOR**: 중복 제거.

**체크**

- [ ] AdminUserService 테스트가 TDD 순서로 작성·통과했다.
- [ ] Create 시 username 중복 검사 후 409 반환 로직이 있다.
- [ ] 비밀번호 해시는 Service(또는 도메인)에서 처리하고, Repository에는 해시만 전달한다.

---

### 5. Presentation — 라우트·핸들러 (TDD)

- **파일**: `server/src/presentation/routes/adminUsers.ts`
- **단계**:
  1. **RED**: 라우트 통합 테스트 또는 슈퍼테스트로 GET/POST/PUT/DELETE 호출, api-spec과 동일한 요청/응답 형식 검증. 201 Location, 404, 409 등.
  2. **GREEN**: Express 라우트 구현. req.params.id 파싱·검증, req.body 검증, Service 호출, res.status().json() 형식을 api-spec에 맞춤.
  3. **REFACTOR**: 검증 로직 분리(validator), 에러 매핑 일관화.

**체크**

- [ ] 각 엔드포인트(GET 목록·단건, POST, PUT, DELETE)에 대한 테스트가 있고, 스펙과 맞는 응답을 검증한다.
- [ ] 400(잘못된 body/params), 404, 409, 500 응답이 스펙대로 반환된다.
- [ ] POST 시 201과 Location 헤더(또는 스펙에 정의한 대로)가 설정된다.

---

### 6. index.ts에서 라우트 마운트

- **작업**: `server/src/index.ts`에서 기존 `/api/admin/users`(GET), `/api/admin/login`(POST)를 새 라우트 파일로 이전하고, 새 CRUD 라우트를 마운트.
- **체크**
  - [ ] `/api/admin/users` 관련 라우트가 `presentation/routes/adminUsers.ts`에서 제공된다.
  - [ ] `POST /api/admin/login`은 유지되어 있다.
  - [ ] 서버 실행 후 수동으로 GET/POST/PUT/DELETE 호출 시 api-spec과 일치한다.

---

### 7. 기존 index.ts 정리

- **작업**: DB pool, cors, express.json() 등은 유지. 라우트만 분리하여 index.ts는 앱 조립·listen만 담당하도록 정리.
- **체크**
  - [ ] index.ts에 직접 작성된 Admin User CRUD 로직이 없고, 라우트 모듈만 사용한다.

---

## Phase 2 체크리스트 (완료 기준)

- [ ] Domain: AdminUser 엔티티/타입이 있고, 테스트로 검증되었다.
- [ ] Infrastructure: AdminUserRepository가 CRUD를 구현했고, 테스트가 있다.
- [ ] Application: AdminUserService가 유스케이스를 구현했고, username 중복·비밀번호 해시가 반영되었다.
- [ ] Presentation: GET/POST/PUT/DELETE 라우트가 api-spec과 동일한 형식으로 응답한다.
- [ ] 모든 새 코드는 “실패하는 테스트 먼저 → 구현” 순서로 작성되었다.
- [ ] `npm test`(또는 프로젝트 테스트 명령)가 통과한다.

---

## 참고

- [phase-1-spec-and-db.md](phase-1-spec-and-db.md) — API 스펙
- [api-spec.yaml](../../../api-spec.yaml) 또는 [docs/api-spec.yaml](../../api-spec.yaml)
- [AGENTS.md](../../../AGENTS.md) — TDD, Backend 아키텍처
