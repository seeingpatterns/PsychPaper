# Phase 4: 연동·검증 및 정리

## 목표

- Admin User CRUD 전체 플로우가 스펙·DB·백엔드·프론트엔드와 일치하는지 검증한다.
- 문서를 갱신하고, 에픽 완료 기준을 만족시킨다.

---

## 구현 계획

### 1. api-spec과 백엔드 응답 일치 확인

- **작업**:
  - api-spec.yaml에 정의된 Admin User 경로·요청/응답 스키마를 한 번씩 확인.
  - 각 엔드포인트(GET 목록·단건, POST, PUT, DELETE)를 실제로 호출( curl, Postman, 또는 테스트 스크립트 )하고, 상태 코드·본문 형식이 스펙과 같은지 확인.
- **명령 예시** (서버 실행 후):
  - `curl -s http://localhost:3000/api/admin/users`
  - `curl -s -X POST http://localhost:3000/api/admin/users -H "Content-Type: application/json" -d '{"username":"test","password":"test123"}'`
  - (이후 PUT, DELETE도 동일하게)

**체크**

- [ ] GET /api/admin/users — 200, body에 users 배열, 각 항목에 id, username, created_at만 있다.
- [ ] GET /api/admin/users/:id — 존재 시 200(AdminUser), 없으면 404.
- [ ] POST /api/admin/users — 유효 body 시 201(및 Location 또는 본문), 잘못된 body 400, username 중복 409.
- [ ] PUT /api/admin/users/:id — 성공 200, 없음 404, 중복 409.
- [ ] DELETE /api/admin/users/:id — 성공 204(또는 200), 없음 404.

---

### 2. 프론트엔드 CRUD 시나리오 검증

- **작업**: 브라우저에서 다음 시나리오를 수동 실행(또는 E2E 테스트 작성).
  1. **목록**: `/admin/users` 접속 → 목록 로드, id/username/created_at 표시.
  2. **생성**: “추가” → username/password 입력 → 제출 → 목록에 새 항목 반영 또는 상세로 이동.
  3. **수정**: 목록에서 “수정” → username(및 비밀번호) 변경 → 제출 → 목록/상세 갱신.
  4. **삭제**: “삭제” → 확인 → 항목 제거 또는 목록 새로고침.
  5. **에러**: 잘못된 입력·중복 username·존재하지 않는 id 수정/삭제 시 에러 메시지 표시.

**체크**

- [ ] 목록 조회가 정상 동작한다.
- [ ] 새 Admin User 생성이 되고 목록에 반영된다.
- [ ] 수정이 반영된다.
- [ ] 삭제 후 목록에서 제거된다.
- [ ] 에러 케이스에서 적절한 메시지가 보인다.

---

### 3. (선택) 인증 연동 확인

- **작업**: Admin 전용 라우트에 JWT 등 인증이 적용된 경우, 로그인 후 CRUD가 동작하는지, 비인증 시 401이 나오는지 확인.
- **체크**
  - [ ] 인증 사용 시: 로그인 후 CRUD 동작, 비인증 시 401(또는 스펙대로) 확인되었다.

---

### 4. 문서·참고 링크 정리

- **작업**:
  - AGENTS.md 또는 .cursor/rules에 Admin User CRUD 관련 경로( api-spec, docs/epic/epic-admin-user-crud )가 반영되어 있는지 확인. 필요 시 한 줄 추가.
  - docs/epic/ 또는 docs/plans에 이 에픽 디렉터리 링크가 있는지 확인.
- **체크**
  - [ ] AGENTS.md “참고 문서”에 api-spec, docs/epic 링크가 있다.
  - [ ] 에픽 완료 후 README.md의 “에픽 완료 기준” 체크리스트를 최종 확인했다.

---

### 5. 에픽 완료 기준 최종 점검

- **작업**: [README.md](README.md)의 “에픽 완료 기준 (Definition of Done)” 항목을 하나씩 확인.
- **체크**
  - [ ] api-spec.yaml에 Admin User CRUD가 정의되어 있고, 백엔드 응답이 스펙과 일치한다.
  - [ ] 백엔드가 Layered/DDD 구조로 CRUD를 구현했고, 테스트가 TDD 사이클로 작성되었다.
  - [ ] 프론트엔드가 FSD 구조로 Admin User CRUD(목록·생성·수정·삭제)를 제공한다.
  - [ ] DB는 기존 admin_users를 사용하며, 필요 시 마이그레이션만 반영되었다.
  - [ ] 연동·검증이 완료되었고, 참고 문서가 갱신되었다.

---

## Phase 4 체크리스트 (완료 기준)

- [ ] api-spec과 백엔드 응답이 모든 엔드포인트에서 일치한다.
- [ ] 프론트엔드에서 목록·생성·수정·삭제 시나리오가 정상 동작한다.
- [ ] (선택) 인증 적용 시 동작이 검증되었다.
- [ ] AGENTS.md 등 참고 문서에 필요한 링크가 반영되어 있다.
- [ ] README의 에픽 완료 기준이 모두 체크되었다.

---

## 참고

- [README.md](README.md)
- [phase-1-spec-and-db.md](phase-1-spec-and-db.md) ~ [phase-3-frontend-crud.md](phase-3-frontend-crud.md)
- [AGENTS.md](../../../AGENTS.md) — verification-before-completion
