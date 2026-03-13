---
name: phase-doc-sync
description: >-
  Guides the agent to update epic phase documentation and related specs after a phase implementation is complete. Use right after finishing a phase (e.g. phase-1/2/3/4) for any epic under docs/epic/ to ensure README, phase docs, and api-spec.yaml stay in sync with the actual behavior.
---

# Phase Doc Sync (PsychPaper)

## 목적

PsychPaper에서 **에픽의 특정 Phase 구현을 끝낸 직후**, 관련 문서들이 실제 동작과 정확히 맞도록 정리·갱신하게 만든다.

이 스킬은 다음과 같은 문서를 대상으로 한다:

- `docs/epic/README.md`
- 각 에픽의 `README.md` (예: `docs/epic/epic-admin-user-crud/README.md`)
- 해당 에픽의 Phase 문서 (예: `phase-1-spec-and-db.md`, `phase-2-backend-crud.md`, `phase-3-frontend-crud.md`, `phase-4-integration.md`)
- 루트 `api-spec.yaml` (필요 시)

## 사용 시점

- 에픽의 **특정 Phase 구현이 막 끝난 직후**:
  - 예: Admin User CRUD의 Phase 3 프론트엔드 구현이 완료된 직후
- 에픽 전체 DoD(Definition of Done)를 체크하거나 갱신할 때

---

## 워크플로 개요

항상 아래 순서로 진행한다.

1. **대상 에픽·Phase 확인**
2. **관련 문서 열기**
3. **현재 구현 상태 정리**
4. **Phase 문서 갱신**
5. **에픽 README 및 상위 README 갱신**
6. **api-spec.yaml 및 기타 참조 파일 점검**
7. **최종 검증 (체크리스트)**

아래 상세 단계를 그대로 따라간다.

---

## 1. 대상 에픽·Phase 확인

1. 사용자가 방금 작업한 에픽과 Phase를 명확히 말하게 한다.
   - 예: "epic-admin-user-crud / phase-3-frontend-crud"
2. 해당 에픽 폴더를 기준으로 경로를 정한다.
   - 예: `docs/epic/epic-admin-user-crud/`

이 정보를 기준으로 이후 단계에서 다룰 파일을 결정한다.

---

## 2. 관련 문서 열기

다음 파일들을 우선적으로 연다(존재하는 경우에만):

- 에픽 README:
  - 예: `docs/epic/epic-admin-user-crud/README.md`
- Phase 문서:
  - 예: `docs/epic/epic-admin-user-crud/phase-3-frontend-crud.md`
- 상위 에픽 목록:
  - `docs/epic/README.md`
- API 스펙:
  - `api-spec.yaml` (해당 Phase가 API 계약에 영향을 주는 경우)

필요하다면 구현 코드도 참고하되, 이 스킬의 초점은 **문서와 스펙**이다.

---

## 3. 현재 구현 상태 정리

Phase 구현 결과를 간단한 요약으로 정리한다(한국어 3~7줄 정도).

권장 구조:

- **무엇을 구현했는지** (기능/흐름)
- **어떤 API/엔드포인트를 사용했는지**
- **중요한 제약이나 예외 케이스**
- **TODO 또는 미완료 항목**

예시:

- Admin User 목록 조회, 생성, 수정, 삭제를 지원하는 `AdminUsersPage` 구현
- 백엔드 `/api/admin/users`, `/api/admin/users/:id` 엔드포인트를 호출
- 실패 시 에러 토스트를 보여주고, 간단한 폼 검증만 적용
- 페이징/검색은 이번 Phase 범위에 포함되지 않음 (TODO)

이 요약은 이후 Phase 문서와 README를 갱신할 때 그대로 활용한다.

---

## 4. Phase 문서 갱신

대상 Phase 문서(예: `phase-3-frontend-crud.md`)에서 다음을 수행한다.

### 4.1 상태 섹션 업데이트

- "현재 상태" 또는 유사한 섹션이 있다면:
  - 구현이 완료되었음을 명시
  - 3단계에서 정리한 요약을 반영

### 4.2 체크리스트/ToDo 정리

- `[ ]` 체크 항목이 있다면:
  - 이번 Phase에서 실제로 완료된 항목은 `[x]`로 변경
  - 범위를 벗어나서 다음 Phase로 넘길 항목은 명시적으로 "다음 Phase로 이관"이라고 적는다.

### 4.3 범위(Scope)와 비범위(Out of Scope) 분리

- 구현하면서 빠졌거나 의도적으로 제외한 기능이 있다면:
  - "Out of Scope" 또는 "다음 Phase" 섹션을 만들어 한 줄씩 적어 둔다.

---

## 5. 에픽 README 및 상위 README 갱신

### 5.1 에픽 README (예: `epic-admin-user-crud/README.md`)

다음 항목들을 중점적으로 맞춘다.

- **현재 상태**:
  - Phase별 완료 여부를 한눈에 볼 수 있도록 문장을 조정한다.
  - 예: "Phase 3 완료 — FSD 구조 기반 Admin User CRUD UI 제공"
- **Phase 문서 표**:
  - 새로 추가되거나 이름이 바뀐 Phase 문서가 있다면 표에 반영
- **에픽 DoD(Definition of Done)**:
  - 이번 Phase로 인해 충족되거나 가까워진 조건을 정리

### 5.2 상위 에픽 목록 (`docs/epic/README.md`)

필요하다면:

- Admin User CRUD 에픽의 상태를 업데이트
  - 예: "진행 중" → "Phase 3까지 완료"
- 설명이 너무 오래된 경우, 한두 줄로 현재 상황을 요약해서 갱신

---

## 6. api-spec.yaml 및 기타 참조 파일 점검

이번 Phase가 API에 영향을 주는 경우(특히 Phase 1/2):

- `api-spec.yaml`에서:
  - 새로 사용한 엔드포인트, 요청/응답 스키마가 정의되어 있는지 확인
  - 실제 구현과 응답 필드가 다른 부분이 있다면 스펙 또는 구현 중 하나를 수정해야 함을 명시

기타 참조 파일:

- DB 스키마 SQL (`db-schema/*.sql`)
- 디자인 문서, AGENTS 규칙 등

이 스킬에서는 **스펙과 문서의 정합성**을 우선하고, 코드 수정은 별도 Phase나 작업으로 분리한다.

---

## 7. 최종 체크리스트

마지막으로, 아래 체크리스트를 복사해서 모두 확인한다.

```markdown
Phase Doc Sync 체크리스트:
- [ ] 이번에 작업한 에픽과 Phase를 명확히 적었다.
- [ ] 해당 에픽의 README를 열고 현재 상태를 반영했다.
- [ ] 대상 Phase 문서(phase-*.md)를 열고 구현 내용을 요약했다.
- [ ] Phase 문서의 체크리스트/ToDo를 실제 구현 상태에 맞게 정리했다.
- [ ] Out of Scope / 다음 Phase로 미룬 항목을 문서에 남겼다.
- [ ] 상위 `docs/epic/README.md`가 필요하다면 갱신했다.
- [ ] api-spec.yaml(또는 관련 스펙/SQL)이 실제 구현과 어긋나지 않는지 확인했다.
```

모든 항목을 검토한 뒤에야 해당 Phase가 "문서까지 포함해" 완전히 정리된 것으로 본다.

