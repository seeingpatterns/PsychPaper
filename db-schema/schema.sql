-- ============================================================
-- schema.sql — PsychPaper MVP (00 + 01 + 02 + 04 + 08 통합)
-- Docker DB 최초 기동 시 /docker-entrypoint-initdb.d/ 에서 자동 실행
-- ============================================================

-- ============================================================
-- 00_init.sql — Extension + ENUM 타입
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE content_type AS ENUM ('markdown', 'html');
CREATE TYPE article_status AS ENUM ('draft', 'published');
CREATE TYPE pars_axis AS ENUM ('phenomenon', 'application', 'research_type', 'scale');

-- ============================================================
-- 01_admin_users.sql — 관리자 계정
-- ============================================================

CREATE TABLE admin_users (
    id              SERIAL          PRIMARY KEY,
    username        VARCHAR(50)     NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,           -- bcrypt 해시. 평문 저장 금지
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admin_users IS '관리자 계정. MVP에서는 1인만 사용';

-- ============================================================
-- 02_categories.sql — 카테고리 마스터 (선택)
-- ============================================================

CREATE TABLE categories (
    id              SERIAL          PRIMARY KEY,
    axis            pars_axis       NOT NULL,           -- P / A / R / S 구분
    name            VARCHAR(100)    NOT NULL,           -- 예: '수면 & 각성'
    slug            VARCHAR(100)    NOT NULL UNIQUE,    -- URL용: 'sleep-and-arousal'
    icon            VARCHAR(10)     DEFAULT '',         -- 이모지: '🌙'
    description     TEXT            DEFAULT '',         -- 카테고리 설명
    sort_order      INTEGER         NOT NULL DEFAULT 0  -- 표시 순서
);

COMMENT ON TABLE categories IS 'PARS 분류 체계의 카테고리. axis로 4개 축 구분';

-- ============================================================
-- 04_articles.sql — 아티클 본체 (핵심 테이블)
-- ============================================================

CREATE TABLE articles (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(255)    NOT NULL UNIQUE,         -- URL: /article/:slug
    title           VARCHAR(500)    NOT NULL,                -- 제목
    subtitle        VARCHAR(500)    DEFAULT '',              -- 부제목
    content_type    content_type    NOT NULL DEFAULT 'markdown',
    content         TEXT            NOT NULL DEFAULT '',     -- 본문 (Markdown 또는 HTML)
    view_count      INTEGER         NOT NULL DEFAULT 0,      -- 조회수
    status          article_status  NOT NULL DEFAULT 'draft',
    category_id     INTEGER         DEFAULT NULL REFERENCES categories(id) ON DELETE SET NULL,  -- 1:N, optional
    admin_user_id   INTEGER         DEFAULT NULL REFERENCES admin_users(id) ON DELETE SET NULL,  -- 발행한 관리자
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    published_at    TIMESTAMP       DEFAULT NULL             -- 발행 전에는 NULL
);

COMMENT ON TABLE articles IS '아티클 본체. Markdown 글과 Deep Dive HTML 글 모두 저장';
COMMENT ON COLUMN articles.id IS 'UUID — SNS 공유 시 글 순서 노출 방지';
COMMENT ON COLUMN articles.slug IS 'URL용 고유 문자열. 사람이 읽을 수 있는 형태';
COMMENT ON COLUMN articles.admin_user_id IS '아티클을 발행한 관리자. NULL이면 미지정 또는 초안';

-- ============================================================
-- 08_comments.sql — 독자 댓글 (Admin 승인제)
-- ============================================================

CREATE TABLE comments (
    id              SERIAL          PRIMARY KEY,
    article_id      UUID            NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    parent_id       INTEGER         DEFAULT NULL REFERENCES comments(id) ON DELETE CASCADE,
    nickname        VARCHAR(50)     NOT NULL,                -- 닉네임 (로그인 없이 자유 입력)
    content         TEXT            NOT NULL,                -- 댓글 내용 (서버에서 XSS 새니타이즈 필수)
    ip_address      VARCHAR(45)     DEFAULT NULL,            -- 스팸 IP 차단용 (IPv6 대응: 45자)
    is_approved     BOOLEAN         NOT NULL DEFAULT FALSE,  -- Admin 승인 전엔 독자에게 안 보임
    approved_at     TIMESTAMP       DEFAULT NULL,            -- Admin 승인 시각
    is_deleted      BOOLEAN         NOT NULL DEFAULT FALSE,  -- 소프트 삭제 (실수 복구 가능)
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE comments IS '독자 댓글. Admin 승인제: is_approved=true만 공개';
COMMENT ON COLUMN comments.parent_id IS 'NULL=최상위 댓글, 값=대댓글. MVP에서 1 depth만';
COMMENT ON COLUMN comments.is_approved IS 'false=비공개. Admin 승인 후 true로 변경';
COMMENT ON COLUMN comments.ip_address IS '스팸 추적용. 서버에서 req.ip로 수집';
