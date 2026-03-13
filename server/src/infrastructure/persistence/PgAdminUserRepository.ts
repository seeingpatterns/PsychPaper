import type { Pool } from 'pg'
import type { AdminUserRow } from '../../domain/admin-user/AdminUser.js'
import type { IAdminUserRepository } from '../../application/admin-user/AdminUserRepository.js'

const LIST_SQL = `SELECT id, username, created_at FROM admin_users ORDER BY id`
const BY_ID_SQL = `SELECT id, username, created_at, password_hash FROM admin_users WHERE id = $1`
const CREATE_SQL = `INSERT INTO admin_users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at, password_hash`
const BY_ID_FOR_UPDATE_SQL = `SELECT id, username, created_at, password_hash FROM admin_users WHERE id = $1`
const UPDATE_SQL = `UPDATE admin_users SET username = $2, password_hash = $3 WHERE id = $1 RETURNING id, username, created_at, password_hash`
const DELETE_SQL = `DELETE FROM admin_users WHERE id = $1`

function rowFrom(r: { id: number; username: string; created_at: Date; password_hash?: string }): AdminUserRow {
  return {
    id: r.id,
    username: r.username,
    created_at: r.created_at,
    ...(r.password_hash !== undefined && r.password_hash !== null && { password_hash: r.password_hash }),
  }
}

export class PgAdminUserRepository implements IAdminUserRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<AdminUserRow[]> {
    const result = await this.pool.query(LIST_SQL)
    return result.rows.map((r) => rowFrom(r))
  }

  async findById(id: number): Promise<AdminUserRow | null> {
    const result = await this.pool.query(BY_ID_SQL, [id])
    if (result.rows.length === 0) return null
    return rowFrom(result.rows[0])
  }

  async create(data: { username: string; passwordHash: string }): Promise<AdminUserRow> {
    const result = await this.pool.query(CREATE_SQL, [data.username, data.passwordHash])
    return rowFrom(result.rows[0])
  }

  async update(
    id: number,
    data: { username?: string; passwordHash?: string }
  ): Promise<AdminUserRow | null> {
    const existing = await this.pool.query(BY_ID_FOR_UPDATE_SQL, [id])
    if (existing.rows.length === 0) return null
    const row = existing.rows[0]
    const username = data.username ?? row.username
    const passwordHash = data.passwordHash ?? row.password_hash
    const updateResult = await this.pool.query(UPDATE_SQL, [id, username, passwordHash])
    return rowFrom(updateResult.rows[0])
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.pool.query(DELETE_SQL, [id])
    return (result.rowCount ?? 0) > 0
  }
}
