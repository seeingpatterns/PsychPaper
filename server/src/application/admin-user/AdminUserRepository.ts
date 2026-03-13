import type { AdminUserRow } from '../../domain/admin-user/AdminUser.js'

/**
 * Admin User 영속성 계약. Domain/Application은 이 인터페이스에만 의존한다.
 */
export interface IAdminUserRepository {
  findAll(): Promise<AdminUserRow[]>
  findById(id: number): Promise<AdminUserRow | null>
  create(data: { username: string; passwordHash: string }): Promise<AdminUserRow>
  update(id: number, data: { username?: string; passwordHash?: string }): Promise<AdminUserRow | null>
  delete(id: number): Promise<boolean>
}
