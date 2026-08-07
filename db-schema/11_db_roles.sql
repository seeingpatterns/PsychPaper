-- ============================================================
-- 11_db_roles.sql — 앱 서비스 롤 + 팀원 DB 클라이언트 롤
--
-- 실행: 부트스트랩(슈퍼유저/소유자)으로 schema.sql 적용 후
--   psql "$ADMIN_URL" -f db-schema/11_db_roles.sql
--
-- 적용 전 아래 CHANGE_ME_* 비밀번호를 로컬에서만 치환할 것.
-- 실비밀번호는 커밋하지 말 것. 팀원 전달은 secrets/db-access.md 사용.
-- ============================================================

-- 서버 DATABASE_URL용 (DML만, DDL 없음)
CREATE ROLE psychpaper_app WITH
  LOGIN
  PASSWORD 'CHANGE_ME_APP_PASSWORD'
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  INHERIT;

-- 팀원 DB 클라이언트용 (조회·변경·DDL 가능, 슈퍼유저 아님)
CREATE ROLE psychpaper_admin WITH
  LOGIN
  PASSWORD 'CHANGE_ME_ADMIN_PASSWORD'
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  INHERIT;

-- Database connect (로컬 psychpaper / Railway railway 등 current DB 기준)
DO $$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO psychpaper_app', current_database());
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO psychpaper_admin', current_database());
END
$$;

-- Schema
GRANT USAGE ON SCHEMA public TO psychpaper_app;
GRANT USAGE, CREATE ON SCHEMA public TO psychpaper_admin;

-- Existing tables / sequences (schema.sql 이후 실행 가정)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO psychpaper_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO psychpaper_app;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO psychpaper_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO psychpaper_admin;

-- Future objects created by the bootstrap role that runs this script
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO psychpaper_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO psychpaper_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO psychpaper_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO psychpaper_admin;
