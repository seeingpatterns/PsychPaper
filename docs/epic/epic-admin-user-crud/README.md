# 에픽: Admin User 테이블 CRUD

프론트엔드·백엔드·DB 설계 및 구현

## 개요

| 항목 | 내용 |
|------|------|
| **에픽명** | Admin User CRUD (관리자 계정 생성·조회·수정·삭제) |
| **목표** | `admin_users` 테이블에 대한 CRUD를 DB · 백엔드(DDD/Layered) · 프론트엔드(FSD) · API 스펙으로 일관되게 설계하고 구현한다. |
| **범위** | DB 스키마 정비, REST API 설계·구현, Admin 전용 UI(목록·생성·수정·삭제) |
| **참조** | [AGENTS.md](../../../AGENTS.md) — Backend(Layered/DDD), Frontend(FSD), API Spec(api-spec.yaml), SDD, TDD |

## 현재 상태

- **DB**: `admin_users` 테이블 존재 (`id`, `username`, `password_hash`, `created_at`).
- **백엔드**: `GET /api/admin/users`(목록), `POST /api/admin/login`(로그인)만 구현. CRUD·레이어 분리 없음.
- **프론트엔드**: `AdminUsersPage`에서 목록 조회만. 생성·수정·삭제 UI·FSD 미적용.
- **API 스펙**: Admin User CRUD 경로·스키마 미정의.

## 목표 아키텍처

| 레이어 | 적용 원칙 |
|--------|-----------|
| **DB** | 기존 스키마 유지, 필요 시 마이그레이션 |
| **Backend** | DDD + Layered (Presentation → Application → Domain → Infrastructure) |
| **Frontend** | FSD (app → pages → features → entities → shared) |
| **API** | OpenAPI 3.x 단일 소스 (api-spec.yaml) |

## Phase 문서 (구현 계획·체크리스트)

각 phase는 **스펙 선 작성 → api-spec 반영 → 구현(TDD)** 순서로 진행한다.

| Phase | 문서 | 내용 |
|-------|------|------|
| **1** | [phase-1-spec-and-db.md](phase-1-spec-and-db.md) | API 스펙 및 DB 계약 |
| **2** | [phase-2-backend-crud.md](phase-2-backend-crud.md) | 백엔드 CRUD (Layered/DDD) |
| **3** | [phase-3-frontend-crud.md](phase-3-frontend-crud.md) | 프론트엔드 CRUD (FSD) |
| **4** | [phase-4-integration.md](phase-4-integration.md) | 연동·검증 및 정리 |

### Phase별 의존 관계

| Phase | 선행 Phase | 의존 이유 |
|-------|------------|-----------|
| **1** | 없음 | API 스펙·DB 계약이 단일 소스. 다른 phase가 모두 이를 기준으로 구현한다. |
| **2** | **1** | api-spec.yaml 경로·스키마·응답 코드에 맞춰 백엔드 CRUD를 구현한다. |
| **3** | **1**, **2** | 스펙(1)에 맞는 타입·API 클라이언트 사용, 실제 호출 대상은 백엔드(2)다. |
| **4** | **1**, **2**, **3** | 스펙↔백엔드↔프론트 연동 검증 및 문서 정리는 전 단계 완료 후 수행한다. |

의존 흐름: **1 → 2 → 3 → 4** (순차 진행). Phase 3만 1·2 완료 후 진행 가능하고, Phase 4는 1·2·3 모두 완료 후 진행한다.

## 에픽 완료 기준 (Definition of Done)

- [ ] api-spec.yaml에 Admin User CRUD가 정의되어 있고, 백엔드 응답이 스펙과 일치한다.
- [ ] 백엔드가 Layered/DDD 구조로 CRUD를 구현했고, 테스트가 TDD 사이클로 작성되었다.
- [ ] 프론트엔드가 FSD 구조로 Admin User CRUD(목록·생성·수정·삭제)를 제공한다.
- [ ] DB는 기존 `admin_users`를 사용하며, 필요 시 마이그레이션만 반영되었다.
- [ ] 연동·검증이 완료되었고, 참고 문서가 갱신되었다.

## 참고

- [AGENTS.md](../../../AGENTS.md)
- [api-spec.yaml](../../../api-spec.yaml) — Phase 1에서 정의·갱신
- [db-schema/01_admin_users.sql](../../../db-schema/01_admin_users.sql)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [OpenAPI 3.x](https://spec.openapis.org/oas/v3.0.3)
