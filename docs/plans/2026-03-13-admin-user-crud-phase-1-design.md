# Admin User CRUD Phase 1 Design (API Spec & DB 계약)

**Goal:** Admin User CRUD에 대한 API 스펙(OpenAPI)과 DB 계약을 명확히 정의하고, 이후 백엔드/프론트엔드 구현의 단일 기준으로 사용한다.

**Scope (Phase 1):**
- OpenAPI 3.x 형식의 `api-spec.yaml` 생성
- `admin_users` 테이블에 대한 CRUD 스키마/엔드포인트 정의
- DB 스키마는 기존 `admin_users`를 유지 (`id`, `username`, `password_hash`, `created_at`)

---

## 핵심 결정 사항

- **DB 스키마**
  - MVP에서는 `updated_at` 컬럼을 사용하지 않는다.
  - `AdminUser` 응답에는 `id`, `username`, `created_at`만 노출한다.
  - 수정/감사 로그가 필요해지면 추후 별도 phase/에픽에서 `updated_at` 추가 또는 별도 로그 테이블을 검토한다.

- **인증**
  - Admin User CRUD는 **JWT 기반 Bearer 토큰 인증**을 사용하는 것을 전제로 스펙에 `securitySchemes.bearerAuth`를 정의한다.
  - 각 Admin User 관련 경로(`GET/POST/PUT/DELETE /api/admin/users...`)에는 `security: - bearerAuth: []`를 붙인다.
  - 실제 JWT 발급/검증 구현은 이후 phase(backend CRUD + auth 개선)에서 다룬다.

- **에러 응답 형식**
  - 공통 `Error` 스키마를 정의한다.
  - 필드:
    - `code`: string (예: `"BAD_REQUEST"`, `"NOT_FOUND"`, `"INTERNAL_ERROR"`)
    - `message`: string (사용자/개발자 용 설명)
  - Admin User 경로의 4xx/5xx 응답은 모두 `Error` 스키마를 사용한다.

- **목록 API 정책 (GET /api/admin/users)**
  - MVP에서는 **페이지네이션 없이 전체 목록을 반환**한다.
  - 이유:
    - admin 계정 수는 매우 적을 것으로 예상된다.
    - Admin 전용 내부 UI라서 응답 크기/성능 영향이 작다.
  - 향후 필요 시 `page`, `limit`, `order` 등의 쿼리 파라미터를 도입할 수 있으며, 이때는 API 스펙 변경이 필요함을 문서에 명시한다.

- **입력 검증 규칙**
  - `username`:
    - 최소 길이 3자, 최대 길이 50자
    - 문자열 타입, 기본적으로 ASCII/영문+숫자 조합을 권장 (스펙에는 주석으로 안내)
  - `password`:
    - 최소 길이 8자, 최대 길이 72자(BCrypt 관례 고려) 정도로 제한
    - 문자열 타입, `format: password`
  - 위 규칙을 OpenAPI 스키마의 `minLength`, `maxLength`로 명시한다.

---

## OpenAPI 구조 설계

- **파일 위치**
  - 프로젝트 루트에 `api-spec.yaml` 생성 (AGENTS.md의 권장 위치 중 하나).

- **기본 구조**
  - `openapi: 3.0.3`
  - `info`:
    - `title: PsychPaper API`
    - `version: 0.1.0`
  - `servers`:
    - `url: /api`
    - 설명: 서버 코드에서 `/api/...` 경로를 사용하므로, 베이스 URL을 `/api`로 설정.
  - `components/schemas`:
    - `AdminUser`
    - `AdminUserCreate`
    - `AdminUserUpdate`
    - `Error`
  - `components/securitySchemes`:
    - `bearerAuth` (HTTP bearer, scheme: bearer, bearerFormat: JWT)

- **paths 설계**
  - `GET /admin/health` 등은 추후 필요 시 추가 가능하나, Phase 1의 범위는 Admin User CRUD에 집중.
  - Admin User 관련 경로:
    - `GET /admin/users`
    - `GET /admin/users/{id}`
    - `POST /admin/users`
    - `PUT /admin/users/{id}`
    - `DELETE /admin/users/{id}`
  - 각 경로는 `tags: ["Admin Users"]`로 묶는다.

---

## Admin User 스키마 상세

- **AdminUser**
  - `id`: integer, format int32
  - `username`: string, minLength 3, maxLength 50
  - `created_at`: string, format date-time

- **AdminUserCreate**
  - `username`: string, required, minLength 3, maxLength 50
  - `password`: string, required, minLength 8, maxLength 72, format password

- **AdminUserUpdate**
  - `username`: string, optional, minLength 3, maxLength 50
  - `password`: string, optional, minLength 8, maxLength 72, format password

- **Error**
  - `code`: string
  - `message`: string

---

## 영향도 정리

- **DB**
  - 기존 `admin_users` 테이블(마이그레이션 `01_admin_users.sql`)에 추가 변경 없음.
  - 앞으로도 Admin User CRUD는 `id`, `username`, `password_hash`, `created_at` 컬럼을 전제로 구현된다.
  - `updated_at`이 필요한 요구가 생기면:
    - 새 마이그레이션 파일을 추가로 작성하고,
    - `AdminUser` 스키마와 관련 API 스펙을 변경해야 한다.

- **Backend**
  - 현재 구현된 `GET /api/admin/users`는 이미 `AdminUser` 스키마와 거의 일치한다.
  - 향후 Phase 2에서:
    - 에러 응답을 `Error` 스키마 형식으로 정렬
    - JWT 기반 인증 미들웨어 적용
    - 나머지 CRUD 엔드포인트 구현

- **Frontend**
  - Phase 3에서 OpenAPI 스펙을 기반으로 타입/클라이언트를 생성하거나 수동 정의할 수 있다.
  - 목록 API는 전체 반환을 전제로 페이지네이션 없는 UI로 시작한다.

---

## 다음 단계 (이 문서 기준)

1. 루트에 `api-spec.yaml` 생성
2. 본 디자인에 맞게 OpenAPI 3.0.3 구조/스키마/paths/securitySchemes 정의
3. Phase 1 체크리스트(phase-1-spec-and-db.md)를 기준으로 스펙을 검증
4. 이후 구현 단계(Phase 2, 3)에서 이 스펙을 단일 소스로 참조

