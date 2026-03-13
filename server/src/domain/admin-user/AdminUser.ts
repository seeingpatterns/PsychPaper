/**
 * API/응답에 노출하는 Admin User 타입. password_hash는 포함하지 않는다.
 */
export type AdminUser = {
  id: number
  username: string
  created_at: string
}

/**
 * DB row (persistence layer에서 반환하는 형태).
 * password_hash는 선택적 — 조회 시 포함될 수 있음.
 */
export type AdminUserRow = {
  id: number
  username: string
  created_at: Date
  password_hash?: string
}

/**
 * Row를 API 스펙 형태(AdminUser)로 변환. password_hash는 제외한다.
 */
export function toAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    username: row.username,
    created_at: row.created_at.toISOString(),
  }
}
