-- 관리자 계정 1건 추가 (username: lee jung jun, 비밀번호: 1234)
-- 실행: docker compose exec db psql -U postgres -d psychpaper -f /path/to/seed-admin-lee.sql
-- 또는 psql로 DB 접속 후 아래 내용 붙여넣기

INSERT INTO admin_users (username, password_hash)
VALUES ('lee jung jun', '$2b$10$TMmlnQfkchrawCVKbN2u6OBu.1x84sizt5JOUkZX9vqnLOnh9uYyy');
