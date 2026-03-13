import { describe, it, expect, vi } from 'vitest'
import { AdminUserService } from './AdminUserService.js'
import type { IAdminUserRepository } from './AdminUserRepository.js'
import type { AdminUserRow } from '../../domain/admin-user/AdminUser.js'

function mockRepo(overrides: Partial<IAdminUserRepository> = {}): IAdminUserRepository {
  return {
    findAll: vi.fn<() => Promise<AdminUserRow[]>>(),
    findById: vi.fn<(id: number) => Promise<AdminUserRow | null>>(),
    create: vi.fn<(data: { username: string; passwordHash: string }) => Promise<AdminUserRow>>(),
    update: vi.fn<(id: number, data: { username?: string; passwordHash?: string }) => Promise<AdminUserRow | null>>(),
    delete: vi.fn<(id: number) => Promise<boolean>>(),
    ...overrides,
  }
}

function row(id: number, username: string, createdAt?: Date): AdminUserRow {
  return {
    id,
    username,
    created_at: createdAt ?? new Date('2024-01-01T00:00:00Z'),
  }
}

describe('AdminUserService', () => {
  it('list returns all users from repository', async () => {
    const repo = mockRepo({
      findAll: vi.fn().mockResolvedValue([row(1, 'a'), row(2, 'b')]),
    })
    const service = new AdminUserService(repo)
    const list = await service.list()
    expect(list).toHaveLength(2)
    expect(list[0].username).toBe('a')
    expect(list[1].username).toBe('b')
  })

  it('getById returns user when found', async () => {
    const repo = mockRepo({ findById: vi.fn().mockResolvedValue(row(1, 'admin')) })
    const service = new AdminUserService(repo)
    const user = await service.getById(1)
    expect(user).not.toBeNull()
    expect(user!.username).toBe('admin')
  })

  it('getById returns null when not found', async () => {
    const repo = mockRepo({ findById: vi.fn().mockResolvedValue(null) })
    const service = new AdminUserService(repo)
    const user = await service.getById(999)
    expect(user).toBeNull()
  })

  it('create hashes password and calls repository with hash', async () => {
    const created = row(1, 'newuser')
    const repo = mockRepo({
      findAll: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(created),
    })
    const service = new AdminUserService(repo)
    const result = await service.create({ username: 'newuser', password: 'plaintext123' })
    expect('user' in result && result.user).toBeTruthy()
    expect('user' in result && result.user?.username).toBe('newuser')
    expect(repo.create).toHaveBeenCalledWith({
      username: 'newuser',
      passwordHash: expect.any(String),
    })
    expect((repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0].passwordHash).not.toBe('plaintext123')
  })

  it('create returns 409 when username already exists', async () => {
    const repo = mockRepo({
      findAll: vi.fn().mockResolvedValue([row(1, 'existing')]),
    })
    const service = new AdminUserService(repo)
    const result = await service.create({ username: 'existing', password: 'password123' })
    expect('conflict' in result && result.conflict).toBe(true)
    expect('user' in result).toBe(false)
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('update returns null when user not found', async () => {
    const repo = mockRepo({ findById: vi.fn().mockResolvedValue(null) })
    const service = new AdminUserService(repo)
    const result = await service.update(999, { username: 'x' })
    expect(result).toBeNull()
  })

  it('update returns 409 when new username already taken by another user', async () => {
    const repo = mockRepo({
      findById: vi.fn().mockResolvedValue(row(1, 'me')),
      findAll: vi.fn().mockResolvedValue([row(1, 'me'), row(2, 'other')]),
      update: vi.fn(),
    })
    const service = new AdminUserService(repo)
    const result = await service.update(1, { username: 'other' })
    expect(result !== null && 'conflict' in result && result.conflict).toBe(true)
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('delete returns false when user not found', async () => {
    const repo = mockRepo({ delete: vi.fn().mockResolvedValue(false) })
    const service = new AdminUserService(repo)
    const ok = await service.delete(999)
    expect(ok).toBe(false)
  })

  it('delete returns true when user was deleted', async () => {
    const repo = mockRepo({ delete: vi.fn().mockResolvedValue(true) })
    const service = new AdminUserService(repo)
    const ok = await service.delete(1)
    expect(ok).toBe(true)
  })
})
