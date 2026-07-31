-- 관리자 계정 1건 추가 템플릿
-- 해시 생성: cd server && SEED_ADMIN_USERNAME='이름' SEED_ADMIN_PASSWORD='강한비밀번호' npx tsx scripts/seed-admin.ts
-- 실행: psql로 대상 DB 접속 후 생성된 INSERT 문을 붙여넣기
--
-- ⚠️ 실제 사용자명·비밀번호·해시를 이 파일에 적어 커밋하지 말 것.
--    (과거 이력에 남아 있던 '1234' 해시는 공개 저장소 노출로 폐기 — 해당 비밀번호는 어떤 계정에도 재사용 금지)

INSERT INTO admin_users (username, password_hash)
VALUES ('<username>', '<bcrypt-hash-from-seed-admin-script>');
