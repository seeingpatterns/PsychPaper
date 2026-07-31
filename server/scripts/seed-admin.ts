/**
 * 관리자 계정 1건 추가용 SQL 생성
 * 사용: SEED_ADMIN_USERNAME='이름' SEED_ADMIN_PASSWORD='강한비밀번호' npx tsx scripts/seed-admin.ts
 *
 * 비밀번호를 소스에 하드코딩하지 않는다 — 평문이 git 이력에 영구 보존되기 때문.
 * 생성된 SQL도 파일로 저장하지 말고 psql에 바로 붙여넣은 뒤 터미널 기록을 지울 것.
 */
import bcrypt from 'bcryptjs';

// adminUsersCrud.ts의 서버측 검증과 동일 규칙 (대문자+소문자+숫자+특수문자, 8~72자)
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,72}$/;
const SALT_ROUNDS = 10;

const username = process.env.SEED_ADMIN_USERNAME?.trim();
const plainPassword = process.env.SEED_ADMIN_PASSWORD;

if (!username || !plainPassword) {
  console.error(
    "사용법: SEED_ADMIN_USERNAME='이름' SEED_ADMIN_PASSWORD='비밀번호' npx tsx scripts/seed-admin.ts"
  );
  process.exit(1);
}

if (!PASSWORD_PATTERN.test(plainPassword)) {
  console.error(
    '비밀번호가 서버 정책에 맞지 않습니다: 8~72자, 대문자·소문자·숫자·특수문자 각 1개 이상.'
  );
  process.exit(1);
}

const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
const escapedUsername = username.replace(/'/g, "''"); // SQL 이스케이프
const escapedHash = hash.replace(/'/g, "''");

console.log('-- 아래 SQL을 PostgreSQL에서 실행하세요. (이 출력물을 파일로 커밋하지 말 것)\n');
console.log(
  `INSERT INTO admin_users (username, password_hash)\nVALUES ('${escapedUsername}', '${escapedHash}');`
);
