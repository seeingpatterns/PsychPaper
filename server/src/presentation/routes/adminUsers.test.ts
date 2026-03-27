import { describe, it, expect } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { createApp } from '../../app.js'
import { AdminUserService } from '../../application/admin-user/AdminUserService.js'
import { InMemoryAdminUserRepository } from '../../application/admin-user/InMemoryAdminUserRepository.js'

type QueryResult = { rowCount: number; rows: Array<{ id: number; password_hash: string }> }

class FakePool {
  private adminUser = {
    id: 1,
    username: 'admin',
    password_hash: bcrypt.hashSync('Password123!', 10),
  }

  async query(sql: string, values: unknown[]): Promise<QueryResult> {
    const isLoginQuery = sql.includes('FROM admin_users WHERE username = $1 LIMIT 1')
    if (!isLoginQuery) {
      return { rowCount: 0, rows: [] }
    }
    const [username] = values
    if (username === this.adminUser.username) {
      return {
        rowCount: 1,
        rows: [{ id: this.adminUser.id, password_hash: this.adminUser.password_hash }],
      }
    }
    return { rowCount: 0, rows: [] }
  }
}

function createTestApp() {
  process.env.SESSION_SECRET = 'test-session-secret'
  const repo = new InMemoryAdminUserRepository()
  const service = new AdminUserService(repo)
  const pool = new FakePool()
  return createApp({ adminUserService: service, pool: pool as never })
}

async function loginAsAdmin(agent: ReturnType<typeof request.agent>) {
  const loginRes = await agent.post('/api/admin/login').send({
    username: 'admin',
    password: 'Password123!',
  })
  expect(loginRes.status).toBe(200)
}

describe('GET /api/admin/users', () => {
  it('returns 401 without session', async () => {
    const app = createTestApp()
    const res = await request(app).get('/api/admin/users')
    expect(res.status).toBe(401)
  })

  it('returns 200 and users array', async () => {
    const app = createTestApp()
    const agent = request.agent(app)
    await loginAsAdmin(agent)
    const res = await agent.get('/api/admin/users')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('users')
    expect(Array.isArray(res.body.users)).toBe(true)
  })
})

describe('GET /api/admin/users/:id', () => {
  it('returns 404 when user not found', async () => {
    const app = createTestApp()
    const agent = request.agent(app)
    await loginAsAdmin(agent)
    const res = await agent.get('/api/admin/users/999')
    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ code: expect.any(String), message: expect.any(String) })
  })

  it('returns 200 and user when found', async () => {
    const app = createTestApp()
    const agent = request.agent(app)
    await loginAsAdmin(agent)
    const createRes = await agent
      .post('/api/admin/users')
      .send({ username: 'founduser', password: 'Password123!' })
    expect(createRes.status).toBe(201)
    const id = createRes.body.id
    const res = await agent.get(`/api/admin/users/${id}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id, username: 'founduser', created_at: expect.any(String) })
    expect(res.body).not.toHaveProperty('password_hash')
  })
})

describe('POST /api/admin/users', () => {
  it('returns 201 and Location header and user body', async () => {
    const app = createTestApp()
    const agent = request.agent(app)
    await loginAsAdmin(agent)
    const res = await agent
      .post('/api/admin/users')
      .send({ username: 'newadmin', password: 'Password123!' })
    expect(res.status).toBe(201)
    expect(res.headers.location).toMatch(/\/api\/admin\/users\/\d+$/)
    expect(res.body).toHaveProperty('id')
    expect(res.body.username).toBe('newadmin')
    expect(res.body).toHaveProperty('created_at')
    expect(res.body).not.toHaveProperty('password_hash')
  })

  it('returns 409 when username already exists', async () => {
    const app = createTestApp()
    const agent = request.agent(app)
    await loginAsAdmin(agent)
    await agent.post('/api/admin/users').send({ username: 'dup', password: 'Password123!' })
    const res = await agent.post('/api/admin/users').send({ username: 'dup', password: 'Other456!' })
    expect(res.status).toBe(409)
    expect(res.body).toMatchObject({ code: expect.any(String), message: expect.any(String) })
  })

  it('returns 400 when body invalid', async () => {
    const app = createTestApp()
    const agent = request.agent(app)
    await loginAsAdmin(agent)
    const res = await agent.post('/api/admin/users').send({ username: 'ab', password: 'short' })
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ code: expect.any(String), message: expect.any(String) })
  })
})

describe('PUT /api/admin/users/:id', () => {
  it('returns 404 when user not found', async () => {
    const app = createTestApp()
    const agent = request.agent(app)
    await loginAsAdmin(agent)
    const res = await agent.put('/api/admin/users/999').send({ username: 'newname' })
    expect(res.status).toBe(404)
  })

  it('returns 200 and updated user', async () => {
    const app = createTestApp()
    const agent = request.agent(app)
    await loginAsAdmin(agent)
    const createRes = await agent
      .post('/api/admin/users')
      .send({ username: 'orig', password: 'Password123!' })
    const id = createRes.body.id
    const res = await agent.put(`/api/admin/users/${id}`).send({ username: 'updated' })
    expect(res.status).toBe(200)
    expect(res.body.username).toBe('updated')
  })

  it('returns 409 when new username already taken', async () => {
    const app = createTestApp()
    const agent = request.agent(app)
    await loginAsAdmin(agent)
    await agent.post('/api/admin/users').send({ username: 'first', password: 'Password123!' })
    const createRes = await agent.post('/api/admin/users').send({ username: 'second', password: 'Password123!' })
    const id = createRes.body.id
    const res = await agent.put(`/api/admin/users/${id}`).send({ username: 'first' })
    expect(res.status).toBe(409)
  })
})

describe('DELETE /api/admin/users/:id', () => {
  it('returns 404 when user not found', async () => {
    const app = createTestApp()
    const agent = request.agent(app)
    await loginAsAdmin(agent)
    const res = await agent.delete('/api/admin/users/999')
    expect(res.status).toBe(404)
  })

  it('returns 204 when user deleted', async () => {
    const app = createTestApp()
    const agent = request.agent(app)
    await loginAsAdmin(agent)
    // Create a dummy user first so the next one gets id != 1 (admin's id)
    await agent.post('/api/admin/users').send({ username: 'dummy', password: 'Password123!' })
    const createRes = await agent
      .post('/api/admin/users')
      .send({ username: 'todel', password: 'Password123!' })
    const id = createRes.body.id
    const res = await agent.delete(`/api/admin/users/${id}`)
    expect(res.status).toBe(204)
    expect(res.body).toEqual({})
  })
})

describe('POST /api/admin/logout', () => {
  it('returns 401 without session', async () => {
    const app = createTestApp()
    const res = await request(app).post('/api/admin/logout')
    expect(res.status).toBe(401)
  })

  it('returns 204 after login and blocks subsequent access', async () => {
    const app = createTestApp()
    const agent = request.agent(app)
    await loginAsAdmin(agent)

    const logoutRes = await agent.post('/api/admin/logout')
    expect(logoutRes.status).toBe(204)

    const usersRes = await agent.get('/api/admin/users')
    expect(usersRes.status).toBe(401)
  })
})
