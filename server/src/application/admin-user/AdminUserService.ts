import bcrypt from 'bcryptjs'
import { toAdminUser, type AdminUser } from '../../domain/admin-user/AdminUser.js'
import type { IAdminUserRepository } from './AdminUserRepository.js'

const SALT_ROUNDS = 10

export class AdminUserService {
  constructor(private readonly repo: IAdminUserRepository) {}

  async list(): Promise<AdminUser[]> {
    const rows = await this.repo.findAll()
    return rows.map(toAdminUser)
  }

  async getById(id: number): Promise<AdminUser | null> {
    const row = await this.repo.findById(id)
    return row ? toAdminUser(row) : null
  }

  async create(data: { username: string; password: string }): Promise<
    | { user: AdminUser }
    | { conflict: true }
  > {
    const all = await this.repo.findAll()
    if (all.some((r) => r.username === data.username)) {
      return { conflict: true }
    }
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)
    const row = await this.repo.create({ username: data.username, passwordHash })
    return { user: toAdminUser(row) }
  }

  async update(
    id: number,
    data: { username?: string; password?: string }
  ): Promise<{ user: AdminUser } | { conflict: true } | null> {
    const existing = await this.repo.findById(id)
    if (!existing) return null

    const updates: { username?: string; passwordHash?: string } = {}
    if (data.username !== undefined) {
      const all = await this.repo.findAll()
      const taken = all.some((r) => r.id !== id && r.username === data.username)
      if (taken) return { conflict: true }
      updates.username = data.username
    }
    if (data.password !== undefined && data.password !== '') {
      updates.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)
    }
    if (Object.keys(updates).length === 0) {
      return { user: toAdminUser(existing) }
    }
    const row = await this.repo.update(id, updates)
    return row ? { user: toAdminUser(row) } : null
  }

  async delete(id: number): Promise<boolean> {
    return this.repo.delete(id)
  }
}
