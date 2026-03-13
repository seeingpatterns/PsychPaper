import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../app.js'
import { AdminUserService } from '../../application/admin-user/AdminUserService.js'
import { InMemoryAdminUserRepository } from '../../application/admin-user/InMemoryAdminUserRepository.js'

function createTestApp() {
  const repo = new InMemoryAdminUserRepository()
  const service = new AdminUserService(repo)
  return createApp({ adminUserService: service, pool: null })
}

describe('GET /api/admin/users', () => {
  it('returns 200 and users array', async () => {
    const app = createTestApp()
    const res = await request(app).get('/api/admin/users')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('users')
    expect(Array.isArray(res.body.users)).toBe(true)
  })
})

describe('GET /api/admin/users/:id', () => {
  it('returns 404 when user not found', async () => {
    const app = createTestApp()
    const res = await request(app).get('/api/admin/users/999')
    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ code: expect.any(String), message: expect.any(String) })
  })

  it('returns 200 and user when found', async () => {
    const app = createTestApp()
    const createRes = await request(app)
      .post('/api/admin/users')
      .send({ username: 'founduser', password: 'password123' })
    expect(createRes.status).toBe(201)
    const id = createRes.body.id
    const res = await request(app).get(`/api/admin/users/${id}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id, username: 'founduser', created_at: expect.any(String) })
    expect(res.body).not.toHaveProperty('password_hash')
  })
})

describe('POST /api/admin/users', () => {
  it('returns 201 and Location header and user body', async () => {
    const app = createTestApp()
    const res = await request(app)
      .post('/api/admin/users')
      .send({ username: 'newadmin', password: 'password123' })
    expect(res.status).toBe(201)
    expect(res.headers.location).toMatch(/\/api\/admin\/users\/\d+$/)
    expect(res.body).toHaveProperty('id')
    expect(res.body.username).toBe('newadmin')
    expect(res.body).toHaveProperty('created_at')
    expect(res.body).not.toHaveProperty('password_hash')
  })

  it('returns 409 when username already exists', async () => {
    const app = createTestApp()
    await request(app).post('/api/admin/users').send({ username: 'dup', password: 'password123' })
    const res = await request(app).post('/api/admin/users').send({ username: 'dup', password: 'other456' })
    expect(res.status).toBe(409)
    expect(res.body).toMatchObject({ code: expect.any(String), message: expect.any(String) })
  })

  it('returns 400 when body invalid', async () => {
    const app = createTestApp()
    const res = await request(app).post('/api/admin/users').send({ username: 'ab', password: 'short' })
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ code: expect.any(String), message: expect.any(String) })
  })
})

describe('PUT /api/admin/users/:id', () => {
  it('returns 404 when user not found', async () => {
    const app = createTestApp()
    const res = await request(app).put('/api/admin/users/999').send({ username: 'newname' })
    expect(res.status).toBe(404)
  })

  it('returns 200 and updated user', async () => {
    const app = createTestApp()
    const createRes = await request(app)
      .post('/api/admin/users')
      .send({ username: 'orig', password: 'password123' })
    const id = createRes.body.id
    const res = await request(app).put(`/api/admin/users/${id}`).send({ username: 'updated' })
    expect(res.status).toBe(200)
    expect(res.body.username).toBe('updated')
  })

  it('returns 409 when new username already taken', async () => {
    const app = createTestApp()
    await request(app).post('/api/admin/users').send({ username: 'first', password: 'password123' })
    const createRes = await request(app).post('/api/admin/users').send({ username: 'second', password: 'password123' })
    const id = createRes.body.id
    const res = await request(app).put(`/api/admin/users/${id}`).send({ username: 'first' })
    expect(res.status).toBe(409)
  })
})

describe('DELETE /api/admin/users/:id', () => {
  it('returns 404 when user not found', async () => {
    const app = createTestApp()
    const res = await request(app).delete('/api/admin/users/999')
    expect(res.status).toBe(404)
  })

  it('returns 204 when user deleted', async () => {
    const app = createTestApp()
    const createRes = await request(app)
      .post('/api/admin/users')
      .send({ username: 'todel', password: 'password123' })
    const id = createRes.body.id
    const res = await request(app).delete(`/api/admin/users/${id}`)
    expect(res.status).toBe(204)
    expect(res.body).toEqual({})
  })
})
