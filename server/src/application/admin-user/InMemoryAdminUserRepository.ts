import type { AdminUserRow } from '../../domain/admin-user/AdminUser.js'
import type { IAdminUserRepository } from './AdminUserRepository.js'

/**
 * 테스트용 in-memory 구현. DB 없이 Repository 계약을 검증할 때 사용.
 */
export class InMemoryAdminUserRepository implements IAdminUserRepository {
  private nextId = 1
  private rows: Map<number, AdminUserRow> = new Map()

  async findAll(): Promise<AdminUserRow[]> {
    return Array.from(this.rows.values()).sort((a, b) => a.id - b.id)
  }

  async findById(id: number): Promise<AdminUserRow | null> {
    return this.rows.get(id) ?? null
  }

  async create(data: { username: string; passwordHash: string }): Promise<AdminUserRow> {
    const id = this.nextId++
    const row: AdminUserRow = {
      id,
      username: data.username,
      created_at: new Date(),
      password_hash: data.passwordHash,
    }
    this.rows.set(id, row)
    return { ...row, created_at: new Date(row.created_at.getTime()) }
  }

  async update(
    id: number,
    data: { username?: string; passwordHash?: string }
  ): Promise<AdminUserRow | null> {
    const existing = this.rows.get(id)
    if (!existing) return null
    const updated: AdminUserRow = {
      ...existing,
      ...(data.username !== undefined && { username: data.username }),
      ...(data.passwordHash !== undefined && { password_hash: data.passwordHash }),
    }
    this.rows.set(id, updated)
    return { ...updated }
  }

  async delete(id: number): Promise<boolean> {
    return this.rows.delete(id)
  }
}
