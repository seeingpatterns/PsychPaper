# Phase 1: API 스펙 및 DB 계약

## 목표

- Admin User CRUD의 **단일 소스 오브 트루스**를 api-spec.yaml에 정의한다.
- DB는 기존 `admin_users` 구조를 전제로, 필요 시 마이그레이션만 추가한다.

---

## 구현 계획

### 1. api-spec.yaml 파일 생성·위치 결정

- **작업**: 프로젝트 루트 또는 docs 하위에 OpenAPI 3.x YAML 파일 생성.
- **파일**: `api-spec.yaml` (루트) 또는 `docs/api-spec.yaml`
- **내용**: 최소 openapi, info, servers, paths, components 구조만 두고, Admin User 경로는 다음 단계에서 채움.

**체크**

- [ ] `api-spec.yaml`(또는 docs 내 동일 파일)이 생성되어 있다.
- [ ] `openapi: 3.0.x`, `info.title`(예: PsychPaper API), `servers`(예: url: /api)가 정의되어 있다.

---

### 2. Admin User 스키마(components/schemas) 정의

- **작업**: 응답·요청에서 재사용할 스키마를 `components/schemas`에 정의.
- **스키마 예시**:
  - `AdminUser`: id (integer), username (string), created_at (string, format date-time). password_hash 미포함.
  - `AdminUserCreate`: username (string, required), password (string, required, format password).
  - `AdminUserUpdate`: username (string, optional), password (string, optional, format password).
  - `Error`: message 또는 code 등 에러 응답 공통 형태.

**체크**

- [ ] `AdminUser` 스키마가 정의되어 있고, id, username, created_at만 포함한다.
- [ ] `AdminUserCreate`, `AdminUserUpdate` 스키마가 정의되어 있다.
- [ ] 에러 응답용 스키마(또는 공통 Error)가 정의되어 있다.

---

### 3. GET /api/admin/users (목록) 정의

- **작업**: paths에 `GET /api/admin/users` 추가.
- **내용**: summary, tags(예: Admin Users), responses: 200(application/json, schema: { users: array of AdminUser }), 500(Error).

**체크**

- [ ] `GET /api/admin/users`가 paths에 정의되어 있다.
- [ ] 200 응답 스키마에 users 배열(AdminUser)이 명시되어 있다.
- [ ] 500 응답이 정의되어 있다.

---

### 4. GET /api/admin/users/:id (단건) 정의

- **작업**: paths에 `GET /api/admin/users/{id}` 추가.
- **내용**: parameter id (path, required, integer), responses: 200(AdminUser), 404(Error), 500(Error).

**체크**

- [ ] `GET /api/admin/users/{id}`가 정의되어 있다.
- [ ] path parameter `id`가 integer로 정의되어 있다.
- [ ] 200, 404, 500 응답이 정의되어 있다.

---

### 5. POST /api/admin/users (생성) 정의

- **작업**: paths에 `POST /api/admin/users` 추가.
- **내용**: requestBody(application/json, AdminUserCreate), responses: 201(Location 헤더 + AdminUser 본문 또는 본문 생략), 400(검증 실패), 409(username 중복), 500.

**체크**

- [ ] `POST /api/admin/users`가 정의되어 있다.
- [ ] requestBody가 AdminUserCreate 스키마를 참조한다.
- [ ] 201, 400, 409, 500 응답이 정의되어 있다.

---

### 6. PUT /api/admin/users/:id (수정) 정의

- **작업**: paths에 `PUT /api/admin/users/{id}` 추가.
- **내용**: parameter id, requestBody(AdminUserUpdate), responses: 200(AdminUser), 400, 404, 409(이름 중복 시), 500.

**체크**

- [ ] `PUT /api/admin/users/{id}`가 정의되어 있다.
- [ ] requestBody가 AdminUserUpdate 스키마를 참조한다.
- [ ] 200, 400, 404, 409, 500 응답이 정의되어 있다.

---

### 7. DELETE /api/admin/users/:id (삭제) 정의

- **작업**: paths에 `DELETE /api/admin/users/{id}` 추가.
- **내용**: parameter id, responses: 204(No Content) 또는 200, 404, 500.

**체크**

- [ ] `DELETE /api/admin/users/{id}`가 정의되어 있다.
- [ ] 204(또는 200), 404, 500 응답이 정의되어 있다.

---

### 8. 인증(선택) 명시

- **작업**: Admin 전용이므로 JWT 등 사용 시 `securitySchemes`와 paths에 security 적용. MVP에서 인증 생략 시 주석으로 명시.
- **체크**
  - [ ] 인증 사용 여부가 스펙 또는 주석으로 명시되어 있다.

---

### 9. DB 스키마·마이그레이션 정리

- **결정(B)**: MVP에서는 **updated_at 미사용**. API 스키마 `AdminUser`는 `id`, `username`, `created_at`만 노출한다.
- **작업**: 기존 `admin_users` 테이블을 **그대로** 사용한다. `db-schema/01_admin_users.sql` 참고. 수정·감사 로그가 필요해지면 추후 별도 phase/에픽에서 `updated_at` 컬럼 추가를 검토한다.

**체크**

- [ ] 현재 `admin_users` 컬럼(id, username, password_hash, created_at)으로 CRUD 가능함이 문서화되어 있다.
- [ ] (참고) `updated_at` 추가 시에는 새 마이그레이션 파일 생성·README에 적용 방법을 적는다.

---

## Phase 1 체크리스트 (완료 기준)

- [ ] api-spec.yaml(또는 docs/api-spec.yaml)이 존재한다.
- [ ] OpenAPI 3.x 형식이며, info/servers가 채워져 있다.
- [ ] components/schemas에 AdminUser, AdminUserCreate, AdminUserUpdate(및 필요 시 Error)가 있다.
- [ ] GET 목록·GET 단건·POST·PUT·DELETE 경로가 모두 정의되어 있고, 응답 코드·스키마가 명시되어 있다.
- [ ] DB는 기존 admin_users를 사용하며, 필요 시 마이그레이션만 추가·문서화되어 있다.

---

## 참고

- [README.md](README.md) — 에픽 개요
- [AGENTS.md](../../../AGENTS.md) — API Spec 섹션
- [db-schema/01_admin_users.sql](../../../db-schema/01_admin_users.sql)
