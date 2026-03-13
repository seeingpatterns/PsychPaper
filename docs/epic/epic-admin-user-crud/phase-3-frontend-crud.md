# Phase 3: 프론트엔드 CRUD (FSD)

**선행 조건**: [Phase 1](phase-1-spec-and-db.md), [Phase 2](phase-2-backend-crud.md) 완료 — api-spec 확정 및 백엔드 CRUD 동작 필요.

## 목표

- Admin User CRUD UI를 **Feature-Sliced Design**에 맞게 구현한다.
- 기존 목록 화면을 FSD 구조로 이전·확장하고, 생성·수정·삭제를 추가한다.

## FSD 구조 (web/src)

| 레이어 | 경로 | 역할 |
|--------|------|------|
| shared | shared/api, shared/ui, shared/lib | API 클라이언트, 공통 UI, 타입/유틸 |
| entities | entities/admin-user | AdminUser 타입, (선택) 행/카드 UI |
| features | features/admin-user-crud | 목록·생성·수정·삭제 기능 |
| pages | pages/admin-users | 라우트 페이지 조합 |
| app | app/ | 라우터, 프로바이더 |

---

## 구현 계획

### 1. FSD 디렉터리 구조 생성

- **작업**: web/src 아래 shared, entities, features, pages, app 디렉터리 생성. 기존 pages가 있으면 유지하고, 새 구조는 entities/features 기준으로 추가.
- **참고**: 기존 `pages/AdminUsersPage.tsx`는 phase 끝에 pages/admin-users로 통합하거나 대체.

**체크**

- [x] `web/src/shared/`, `entities/admin-user/`, `features/admin-user-crud/`, (기존 `pages/AdminUsersPage.tsx` 활용) 구조가 준비되어 있다.

---

### 2. shared — API 베이스·타입

- **파일**: `web/src/shared/api/client.ts`, `web/src/shared/api/admin-user.ts`
- **작업**:
  - api-spec과 일치하는 AdminUser 타입 정의 (id, username, created_at).
  - fetch 래퍼 또는 axios 인스턴스( baseURL, JSON 헤더 ). (선택) 공통 에러 처리.
- **체크**
  - [x] AdminUser 타입이 정의되어 있다. (`shared/api/admin-user.ts`)
  - [x] API 베이스 URL·헤더 설정이 한 곳에 있다. (`shared/api/client.ts`, base `/api`)

---

### 3. shared — Admin User API 함수

- **파일**: `web/src/shared/api/admin-user.ts`
- **작업**: getList(), getById(id), create({ username, password }), update(id, { username?, password? }), delete(id). 반환은 api-spec 응답 형식에 맞춤.
- **체크**
  - [x] GET/POST/PUT/DELETE에 대응하는 함수가 있고, api-spec 경로·body와 일치한다. (`getAdminUsers`, `getAdminUser`, `createAdminUser`, `updateAdminUser`, `deleteAdminUser`)
  - [x] 에러 시 throw 또는 Result 타입으로 처리한다. (`ApiError` 예외)

---

### 4. entities/admin-user — 모델·UI 조각(선택)

- **파일**: `web/src/entities/admin-user/model/types.ts` (AdminUser 재export), `web/src/entities/admin-user/ui/AdminUserRow.tsx`
- **작업**: AdminUser 타입을 entities에서 export. 목록 행 컴포넌트가 필요하면 id, username, created_at 표시 + 수정/삭제 버튼(클릭은 features에서 처리).
- **체크**
  - [x] entities/admin-user에서 AdminUser 타입을 사용할 수 있다.
  - [x] 행 UI가 있고, 상위에서 onEdit, onDelete 등을 받는다. (`AdminUserRow`)

---

### 5. features/admin-user-crud — 목록 조회

- **파일**: `web/src/features/admin-user-crud/ui/AdminUserList.tsx`
- **작업**:
  - 목록 fetch (shared API getList), loading/error 상태 처리.
  - 테이블 또는 리스트로 id, username, created_at 표시.
  - 각 행에 “수정” “삭제” 버튼 또는 링크. 수정/삭제 동작은 아래 단계에서 연결.
- **체크**
  - [x] 목록을 불러와 표시한다. (상위 페이지에서 fetch 후 `AdminUserList`로 전달)
  - [x] 로딩·에러 UI가 있다.
  - [x] 행별 수정·삭제 진입점이 있다. (`onEdit`, `onDelete` 콜백)

---

### 6. features/admin-user-crud — 생성 폼

- **파일**: `web/src/features/admin-user-crud/ui/CreateAdminUserForm.tsx`
- **작업**: username, password 입력 필드. 제출 시 shared API create() 호출. 성공 시 목록 갱신 또는 목록 페이지로 이동. 400/409 등 에러 메시지 표시.
- **체크**
  - [x] username, password 입력과 제출 시 POST가 호출된다. (`createAdminUser`)
  - [x] 성공 후 목록 갱신 또는 네비게이션된다. (상위에서 users 상태 갱신)
  - [x] 에러 메시지를 사용자에게 보여준다.

---

### 7. features/admin-user-crud — 수정 폼

- **파일**: `web/src/features/admin-user-crud/ui/EditAdminUserForm.tsx`
- **작업**: id로 기존 데이터 로드(getById). username(및 필요 시 비밀번호 변경) 입력. 제출 시 update(id, body). 성공 시 목록/상세 갱신. 404/409 에러 처리.
- **체크**
  - [x] 수정 폼에서 기존 username이 로드되어 표시된다.
  - [x] 제출 시 PUT이 호출되고, 성공 후 화면이 갱신된다.
  - [x] 404/409 에러를 처리한다. (ApiError 메시지 표시)

---

### 8. features/admin-user-crud — 삭제 확인·호출

- **파일**: `web/src/features/admin-user-crud/ui/DeleteAdminUserButton.tsx`
- **작업**: “삭제” 클릭 시 확인 다이얼로그. 확인 후 delete(id) 호출. 성공 시 목록에서 제거 또는 목록 새로고침.
- **체크**
  - [x] 삭제 전 확인 UI가 있다. (`window.confirm`)
  - [x] 확인 시 DELETE가 호출되고, 성공 시 목록이 갱신된다.

---

### 9. pages/admin-users — CRUD 페이지 조합

- **파일**: `web/src/pages/AdminUsersPage.tsx`에서 features 조합.
- **작업**: 목록 + “추가” 버튼 → 생성 폼(같은 페이지 내). 행 “수정” → 수정 폼. 행 “삭제” → 삭제 확인. 라우트는 `/admin/users` (MVP에서는 단일 페이지로 처리).
- **체크**
  - [x] 한 페이지에서 목록·생성·수정·삭제가 모두 동작한다.
  - [x] 기존 AdminUsersPage가 FSD 구조(entities/features)를 사용하도록 정리되어 있다.

---

### 10. app — 라우터에 Admin 경로 반영

- **파일**: `web/src/App.tsx` (또는 app/router 등)
- **작업**: `/admin/users`(및 필요 시 `/admin/users/new`, `/admin/users/:id/edit`) 라우트가 해당 페이지를 렌더링하도록 설정.
- **체크**
  - [x] `/admin/users` 접근 시 Admin User CRUD 페이지가 열린다.
  - [ ] (선택) 생성/수정 전용 라우트가 동작한다.

---

## Phase 3 체크리스트 (완료 기준)

- [x] shared에 Admin User API 클라이언트와 타입이 있고, api-spec과 일치한다.
- [x] entities/admin-user에 타입(및 선택적 UI)이 있다.
- [x] features/admin-user-crud에서 목록·생성·수정·삭제가 구현되어 있다.
- [x] pages에서 위 feature들을 조합한 CRUD 페이지가 있다.
- [x] app 라우터에 Admin User 관련 경로가 등록되어 있다.
- [x] 로딩·에러 상태가 적절히 표시된다.
- [x] 기존 목록 동작이 유지되며, 생성·수정·삭제가 정상 동작한다.

---

## 참고

- [phase-1-spec-and-db.md](phase-1-spec-and-db.md), [phase-2-backend-crud.md](phase-2-backend-crud.md)
- [AGENTS.md](../../../AGENTS.md) — Frontend(FSD)
- [Feature-Sliced Design](https://feature-sliced.design/)
