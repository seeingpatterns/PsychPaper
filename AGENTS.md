# PsychPaper — Agent 가이드

이 문서는 AI 에이전트(Claude 등)가 PsychPaper 프로젝트에서 일관되게 동작하도록 하는 규칙과 컨텍스트를 정의합니다.

---

## 1. Coding Convention (기술 스택 공식 가이드 기준)

프로젝트 기술 스택의 **공식 스타일/가이드**를 따릅니다. 아래는 요약된 Todo / Not to do입니다.

### 1.1 React (react.dev)

| Todo | Not to do |
|------|-----------|
| 함수형 컴포넌트 + Hooks만 사용 | 클래스 컴포넌트 사용 |
| 컴포넌트·훅은 순수하게 (같은 입력 → 같은 출력) | 렌더 중에 부수 효과 실행 |
| props/state를 불변으로 취급 | props/state 직접 변경 |
| 훅은 컴포넌트 최상위에서만 호출 | 훅을 조건/반복/콜백 안에서 호출 |
| 컴포넌트 이름은 PascalCase, 파일 최상위에 정의 | 컴포넌트를 다른 컴포넌트 안에 중첩 정의 |
| 상태는 필요한 가장 낮은 공통 조상에 두기 | 파생 값까지 state로 저장 (필요 시 useMemo) |
| 부수 효과는 `useEffect`에만 | 계산 로직을 `useEffect`에 넣기 |
| 재사용 로직은 커스텀 훅으로 분리 | 불필요한 useMemo/useCallback/React.memo (프로파일 전) |
| 시맨틱 HTML·접근성 기본 적용 | div/span 남발 |
| React Strict Mode + react-hooks ESLint 사용 | 훅 규칙 위반 방치 |

### 1.2 TypeScript (TypeScript Handbook / ts.dev)

| Todo | Not to do |
|------|-----------|
| 원시 타입 사용: `number`, `string`, `boolean`, `object` | 래퍼 타입 사용: `Number`, `String`, `Boolean`, `Object` |
| 알 수 없는 값은 `unknown` 사용 | `any` 사용 (마이그레이션 외) |
| 콜백 반환값 무시 시 `void` 명시 | 콜백 반환 타입을 `any`로 두기 |
| 클래스/인터페이스/타입/enum: UpperCamelCase | 약어만 대문자 (예: loadHTTPURL) |
| 변수/파라미터/함수/프로퍼티: lowerCamelCase | |
| 상수: CONSTANT_CASE | |
| `import type`으로 타입만 가져오기 (verbatimModuleSyntax 대응) | 타입을 값처럼 import 하여 런타임 오류 유발 |

### 1.3 Node.js / Express (expressjs.com, Node 권장사항)

| Todo | Not to do |
|------|-----------|
| 비동기 함수 사용, 콜백에서 err 먼저 검사 | 동기 블로킹 API를 프로덕션에서 사용 |
| 중앙화된 에러 처리 미들웨어 사용 | 라우트마다 try/catch만 하고 일관 처리 없음 |
| 로깅은 Pino 등 라이브러리, 디버깅은 debug 모듈 | 프로덕션에 `console.log` 남기기 |
| NODE_ENV=production 설정 | 환경 변수 없이 배포 |
| 라우트/컨트롤러/미들웨어/서비스 분리·모듈화 | 한 파일에 모든 로직 |
| gzip 등 압축은 미들웨어 또는 리버스 프록시 | 응답 압축 없이 대용량 JSON |

### 1.4 Tailwind CSS (tailwindcss.com)

| Todo | Not to do |
|------|-----------|
| 유틸리티 클래스로 스타일 구성 | 인라인 스타일·전역 CSS 남발 |
| 반응형은 `sm:`, `md:`, `lg:` 등 브레이크포인트 사용 | 뷰포트 고정·user-scalable:false (접근성 위반) |
| 디자인 토큰(색, 간격)은 설정에서 일원화 | 하드코딩 색상/px 값 난립 |
| `@apply`는 공통 패턴만, 컴포넌트 단위로 제한 | 모든 스타일을 @apply로 옮기기 |

---

## 2. Backend 아키텍처

- **DDD (Domain-Driven Design)**  
  - 도메인 모델·유비쿼터스 언어를 코드와 문서에 반영합니다.  
  - 복잡한 비즈니스 로직은 도메인 레이어에 두고, 인프라/프레임워크에 의존하지 않도록 합니다.

- **Layered Architecture (계층형)**  
  - **Presentation** (HTTP, 라우트, 요청/응답) → **Application** (유스케이스/서비스 오케스트레이션) → **Domain** (엔티티, 값 객체, 도메인 서비스) → **Infrastructure** (DB, 외부 API, 파일 등).  
  - 의존 방향: 상위 레이어만 하위 레이어를 참조. Domain은 다른 레이어에 의존하지 않습니다.

구체적인 폴더/패키지 구조는 [docs/](docs/) 또는 [.cursor/rules/architecture.md](.cursor/rules/architecture.md)(존재 시)를 따릅니다.

---

## 3. Frontend 아키텍처 (Feature-Sliced Design)

프론트엔드는 **Feature-Sliced Design (FSD)** 를 따른다.

- **레이어(위 → 아래만 의존)**  
  `app` → `processes`(선택) → `pages` → `features` → `entities` → `shared`
- **세그먼트**  
  각 슬라이스는 필요에 따라 `ui`, `model`, `api`, `lib`, `config` 등으로 구분한다.
- **의존 규칙**  
  상위 레이어만 하위 레이어를 import 한다. 같은 레이어 간 의존·하위가 상위 참조는 금지한다.

**PsychPaper 예시 (web/src 기준)**  
- `shared`: 공통 UI, api 클라이언트, 유틸, 타입  
- `entities`: article, comment, pars-category (도메인 엔티티 단위)  
- `features`: comment-form, share-buttons, pars-explorer (사용자 시나리오 단위)  
- `pages`: 라우트별 페이지 (home, article-page, category-page 등)  
- `app`: 프로바이더, 라우터, 전역 스타일

공식 문서: [Feature-Sliced Design](https://feature-sliced.design/).

---

## 4. SDD (Specification-Driven Development)

- **에픽 문서**  
  - `docs/epic/` 아래에 에픽별 문서를 생성·관리합니다.  
  - 에픽 = 큰 기능/도메인 단위 (예: 댓글 시스템, PARS 탐색, Admin API).

- **Phase별 Spec**  
  - 각 에픽을 phase로 나누고, phase마다 spec(요구사항·인수조건·테스트 관점)을 작성한 뒤 구현합니다.  
  - spec이 먼저 있고, 그에 맞춰 계획(writing-plans)과 구현(executing-plans, TDD)을 진행합니다.

---

## 5. API Spec (api-spec.yaml)

REST API의 **단일 소스 오브 트루스**는 `api-spec.yaml`(또는 프로젝트에서 정한 경로)이다.

- **위치**  
  프로젝트 루트 또는 `docs/` — 예: [api-spec.yaml](api-spec.yaml) 또는 [docs/api-spec.yaml](docs/api-spec.yaml).
- **형식**  
  **OpenAPI 3.x** YAML. 경로, 메서드, 요청/응답 스키마, 에러 응답을 명시한다.
- **작성·갱신**  
  - 새 엔드포인트 추가·변경 시 **먼저** api-spec.yaml을 수정한다.  
  - SDD phase에서 API가 포함되면 해당 phase spec과 함께 api-spec.yaml에 반영한다.  
  - 백엔드 구현은 스펙에 맞춰 하고, 프론트는 스펙에서 타입/클라이언트를 생성해 사용할 수 있다.
- **포함할 내용**  
  - 서버 URL(환경별 선택 가능하면 optional)  
  - 인증 방식(예: Bearer JWT)  
  - 각 경로별: summary, parameters, requestBody, responses(200, 4xx, 5xx), 스키마 참조  
  - 재사용 스키마는 `components/schemas`에 정의

스펙 먼저 → 구현(TDD) 순서를 지키면, API 계약이 문서와 코드에서 일치하도록 유지할 수 있다.

---

## 6. Superpowers 플러그인 및 TDD

- **TDD (Test-Driven Development)**  
  - **항상** 새 기능·버그 수정·리팩터링 전에 **실패하는 테스트를 먼저** 작성합니다.  
  - Red → (실패 확인) → Green → (통과 확인) → Refactor 사이클을 따릅니다.  
  - 프로덕션 코드는 “실패한 테스트가 먼저 있고, 그 테스트를 통과시키기 위한 최소 구현” 이후에만 추가합니다.  
  - 상세 규칙은 superpowers **test-driven-development** 스킬을 따릅니다.

- **관련 스킬 참고**  
  - **writing-plans**: 여러 단계가 있는 작업은 코드에 손대기 전에 `docs/plans/` 등에 구현 계획을 작성합니다. 계획에는 TDD 단계(실패 테스트 → 통과 확인 → 최소 구현 → 커밋)를 포함합니다.  
  - **executing-plans**: 저장된 계획을 태스크 단위로 실행할 때 사용합니다.  
  - **verification-before-completion**: “완료했다”고 말하기 전에 **실제로 테스트/빌드/린트 명령을 실행**하고, 출력(실패 수, exit code)을 확인한 뒤에만 완료를 주장합니다.  
  - **subagent-driven-development**: 큰 계획을 여러 태스크로 나누어 서브에이전트로 실행할 때 사용합니다.

---

## 7. 참고 문서

- **프로젝트 컨텍스트**: [CLAUDE.md](CLAUDE.md)
- **규칙 상세**: [.cursor/rules/](.cursor/rules/) — project, architecture, technical, api, security, testing 등
- **API 스펙**: [api-spec.yaml](api-spec.yaml) 또는 [docs/api-spec.yaml](docs/api-spec.yaml) — OpenAPI 3.x, REST 단일 소스
- **디자인 레퍼런스**: [docs/design-reference.html](docs/design-reference.html)
- **에픽·스펙**: [docs/epic/](docs/epic/)
- **구현 계획**: [docs/plans/](docs/plans/) — writing-plans 사용 시
