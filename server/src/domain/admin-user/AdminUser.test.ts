import { describe, it, expect } from 'vitest'
import { toAdminUser, type AdminUserRow } from './AdminUser.js'

describe('AdminUser', () => {
  it('has id, username, created_at', () => {
    const row: AdminUserRow = {
      id: 1,
      username: 'admin',
      created_at: new Date('2024-01-01T00:00:00Z'),
    }
    const user = toAdminUser(row)
    expect(user.id).toBe(1)
    expect(user.username).toBe('admin')
    expect(user.created_at).toBe('2024-01-01T00:00:00.000Z')
  })

  it('does not expose password_hash in result', () => {
    const row: AdminUserRow = {
      id: 2,
      username: 'other',
      created_at: new Date('2024-02-01T12:00:00Z'),
      password_hash: 'hashed',
    }
    const user = toAdminUser(row)
    expect(user).not.toHaveProperty('password_hash')
    expect(Object.keys(user)).toEqual(['id', 'username', 'created_at'])
  })
})
