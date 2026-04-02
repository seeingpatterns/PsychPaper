-- ============================================================
-- service-account-grants.example.sql
-- 운영용 앱 DB 계정(서비스 계정) — PsychPaper schema.sql 기준 최소 권한
--
-- 대상 PostgreSQL: 15 이상 권장 (아래 ALTER DEFAULT PRIVILEGES … ON TYPES 는 15+)
--
-- 중요 (공식 문서 GRANT synopsis):
--   `GRANT … ON ALL TABLES/SEQUENCES/ROUTINES IN SCHEMA` 는 있지만,
--   **`GRANT … ON ALL TYPES IN SCHEMA` 문법은 PostgreSQL에 존재하지 않습니다.**
--   그래서 `… ALL TYPES …` 를 실행하면 항상 `syntax error at or near "TYPES"` 가 납니다.
--   참고: https://www.postgresql.org/docs/current/sql-grant.html
--   (Description: bulk grant is only for tables, sequences, functions, procedures.)
--
-- 타입(ENUM·도메인·복합·range 등)은 (1) 이미 있는 객체 → 아래 DO 블록 또는 타입별 GRANT,
-- (2) 앞으로 마이그레이션이 만드는 객체 → §5 의 ALTER DEFAULT PRIVILEGES … ON TYPES.
--
-- 실행 주체: 슈퍼유저 또는 DB/스키마 소유자(postgres 등)
-- 실행 시점: schema.sql(또는 동일 스키마) 적용 **이후**
--
-- 주의:
-- - 비밀번호는 환경 변수·시크릿 매니저에 두고, 이 파일에는 실제 값을 넣지 마세요.
-- - DDL(CREATE TABLE 등)은 이 역할에 주지 않습니다. 마이그레이션은 별도 관리자 계정으로 실행합니다.
-- - 매니지드 DB(Railway 등)에서 CREATE ROLE이 막혀 있으면 콘솔에서 유저 생성 후
--   아래 GRANT 부분만 실행하면 됩니다.
-- - 테이블·시퀀스·루틴은 `public` 스키마 단위로 부여합니다. 타입은 위 이유로 별도 처리합니다.
--   앱 전용 DB에서 `public`에 앱 객체만 두는 전제입니다. 다른 용도 객체가 섞이면 별도 스키마를 권장합니다.
-- ============================================================

-- 1) 역할 생성 (이미 있으면 생략하거나 비밀번호만 ALTER)
CREATE ROLE psychpaper_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION CONNECTION LIMIT -1;

-- 비밀번호: 실행 시 한 번만 설정 (예: psql 변수 또는 애플리케이션에서 안전하게 전달)
ALTER ROLE psychpaper_app PASSWORD '여기에_강한_랜덤_문자열';

-- 2) 데이터베이스 연결 허용 (DB 이름은 환경에 맞게 변경)
-- \c psychpaper   -- 예: psql에서 대상 DB로 연결한 뒤 실행
GRANT CONNECT ON DATABASE psychpaper TO psychpaper_app;

-- 3) 스키마 사용 (앱은 public만 쓴다고 가정)
GRANT USAGE ON SCHEMA public TO psychpaper_app;
ALTER ROLE psychpaper_app SET search_path TO public;

-- 4) 이미 존재하는 public 객체 일괄 부여 (테이블·시퀀스·함수·프로시저)
--    `ALL ROUTINES` = 해당 스키마의 FUNCTION + PROCEDURE.
--    uuid-ossp 등 extension이 public에 둔 함수도 포함됩니다.
--    타입은 GRANT에 ALL … IN SCHEMA 가 없으므로 바로 아래 DO 블록으로 처리합니다.

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO psychpaper_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO psychpaper_app;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO psychpaper_app;


-- 5) 앞으로 마이그레이션이 만드는 객체에도 동일 권한 자동 부여
--    FOR ROLE 뒤의 역할 = CREATE TABLE / CREATE TYPE 등을 실행하는 **마이그레이션 주체**
--    (보통 postgres 또는 전용 migration_role). 환경에 맞게 한 곳만 통일해서 바꾸면 됩니다.
--    다른 역할 이름으로 DDL을 실행하면 이 기본 권한이 적용되지 않으므로, 마이그레이션 실행 계정을 고정하는 것이 좋습니다.

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE ON TYPES TO psychpaper_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO psychpaper_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO psychpaper_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON ROUTINES TO psychpaper_app;

-- ============================================================
-- 연결 문자열 예시 (Railway 등)
-- postgresql://psychpaper_app:비밀번호@호스트:5432/psychpaper?sslmode=require
-- ============================================================
