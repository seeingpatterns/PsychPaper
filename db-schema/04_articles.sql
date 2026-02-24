-- ============================================================
-- 04_articles.sql — 아티클 본체 (핵심 테이블)
-- 의존: 00_init.sql, 01_admin_users.sql, 02_categories.sql (optional)
-- 관계: admin_user_id → admin_users (발행자), category_id → categories (1:N), 1:N → comments
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
