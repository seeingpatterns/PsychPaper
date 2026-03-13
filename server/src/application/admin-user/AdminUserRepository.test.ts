import { describe, it, expect } from 'vitest'
import { InMemoryAdminUserRepository } from './InMemoryAdminUserRepository.js'

describe('IAdminUserRepository (InMemory)', () => {
  it('findAll returns empty array when no users', async () => {
    const repo = new InMemoryAdminUserRepository()
    const list = await repo.findAll()
    expect(list).toEqual([])
  })

  it('create then findById returns the user', async () => {
    const repo = new InMemoryAdminUserRepository()
    const created = await repo.create({ username: 'admin', passwordHash: 'hashed' })
    expect(created.id).toBeGreaterThan(0)
    expect(created.username).toBe('admin')
    expect(created.password_hash).toBe('hashed')

    const found = await repo.findById(created.id)
    expect(found).not.toBeNull()
    expect(found!.username).toBe('admin')
  })

  it('findById returns null for missing id', async () => {
    const repo = new InMemoryAdminUserRepository()
    const found = await repo.findById(999)
    expect(found).toBeNull()
  })

  it('update modifies user and returns updated row', async () => {
    const repo = new InMemoryAdminUserRepository()
    const created = await repo.create({ username: 'old', passwordHash: 'hash' })
    const updated = await repo.update(created.id, { username: 'new' })
    expect(updated).not.toBeNull()
    expect(updated!.username).toBe('new')

    const found = await repo.findById(created.id)
    expect(found!.username).toBe('new')
  })

  it('update returns null for missing id', async () => {
    const repo = new InMemoryAdminUserRepository()
    const updated = await repo.update(999, { username: 'x' })
    expect(updated).toBeNull()
  })

  it('delete removes user and returns true', async () => {
    const repo = new InMemoryAdminUserRepository()
    const created = await repo.create({ username: 'del', passwordHash: 'h' })
    const deleted = await repo.delete(created.id)
    expect(deleted).toBe(true)
    expect(await repo.findById(created.id)).toBeNull()
  })

  it('delete returns false for missing id', async () => {
    const repo = new InMemoryAdminUserRepository()
    const deleted = await repo.delete(999)
    expect(deleted).toBe(false)
  })
})
