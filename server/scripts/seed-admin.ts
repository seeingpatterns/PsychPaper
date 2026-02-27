/**
 * 관리자 계정 1건 추가용 SQL 생성
 * 사용: npx tsx scripts/seed-admin.ts
 * 비밀번호는 bcrypt 해시로 저장 (bcryptjs 호환)
 */
import bcrypt from 'bcryptjs';

const USERNAME = 'lee jung jun';
const PLAIN_PASSWORD = '1234';
const SALT_ROUNDS = 10;

const hash = await bcrypt.hash(PLAIN_PASSWORD, SALT_ROUNDS);
const escapedUsername = USERNAME.replace(/'/g, "''"); // SQL 이스케이프
const escapedHash = hash.replace(/'/g, "''");

console.log('-- 아래 SQL을 PostgreSQL에서 실행하세요.\n');
console.log(
  `INSERT INTO admin_users (username, password_hash)\nVALUES ('${escapedUsername}', '${escapedHash}');`
);
