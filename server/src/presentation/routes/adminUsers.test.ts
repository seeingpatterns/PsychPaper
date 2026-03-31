import { describe, it, expect } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { createApp } from '../../app.js'
import { AdminUserService } from '../../application/admin-user/AdminUserService.js'
import { InMemoryAdminUserRepository } from '../../application/admin-user/InMemoryAdminUserRepository.js'

type QueryResult = { rowCount: number; rows: Array<{ id: number; password_hash: string; username?: string }> }

class FakePool {
  private adminUser = {
    id: 1,
    username: 'admin',
    password_hash: bcrypt.hashSync('password123', 10),
  }

  async query(sql: string, values: unknown[]): Promise<QueryResult> {
    const isLoginQuery = sql.includes('FROM admin_users WHERE username = $1 LIMIT 1')
    const isMeQuery = sql.includes('FROM admin_users WHERE id = $1 LIMIT 1')
    if (!isLoginQuery) {
      if (isMeQuery) {
        const [id] = values
        if (id === this.adminUser.id) {
          return {
            rowCount: 1,
            rows: [{ id: this.adminUser.id, password_hash: this.adminUser.password_hash, username: this.adminUser.username }],
          }
        }
      }
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

class FakePoolWithNonAdminSession extends FakePool {
  override async query(sql: string, values: unknown[]): Promise<QueryResult> {
    const isLoginQuery = sql.includes('FROM admin_users WHERE username = $1 LIMIT 1')
    if (!isLoginQuery) {
      return super.query(sql, values)
    }

    const [username] = values
    if (username === 'nonadmin') {
      return {
        rowCount: 1,
        rows: [{ id: '1' as unknown as number, password_hash: bcrypt.hashSync('password123', 10) }],
      }
    }
    return super.query(sql, values)
  }
}

describe('GET /api/admin/me', () => {
  it('returns 401 without session', async () => {
    const app = createTestApp()
    const res = await request(app).get('/api/admin/me')
    expect(res.status).toBe(401)
  })

  it('returns current admin after login', async () => {
    const app = createTestApp()
    const agent = request.agent(app)
    await loginAsAdmin(agent)
    const res = await agent.get('/api/admin/me')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ admin: true })
  })

  it('returns 403 when session exists but not admin', async () => {
    const app = createTestAppWithNonAdminSession()
    const agent = request.agent(app)
    const loginRes = await agent.post('/api/admin/login').send({
      username: 'nonadmin',
      password: 'password123',
    })
    expect(loginRes.status).toBe(200)
    const meRes = await agent.get('/api/admin/me')
    expect(meRes.status).toBe(403)
  })
})

function createTestApp() {
  process.env.SESSION_SECRET = 'test-session-secret'
  const repo = new InMemoryAdminUserRepository()
  const service = new AdminUserService(repo)
  const pool = new FakePool()
  return createApp({ adminUserService: service, pool: pool as never })
}

function createTestAppWithNonAdminSession() {
  process.env.SESSION_SECRET = 'test-session-secret'
  const repo = new InMemoryAdminUserRepository()
  const service = new AdminUserService(repo)
  const pool = new FakePoolWithNonAdminSession()
  return createApp({ adminUserService: service, pool: pool as never })
}

async function loginAsAdmin(agent: ReturnType<typeof request.agent>) {
  const loginRes = await agent.post('/api/admin/login').send({
    username: 'admin',
    password: 'password123',
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

  it('returns 403 when session exists but not admin', async () => {
    const app = createTestAppWithNonAdminSession()
    const agent = request.agent(app)
    const loginRes = await agent.post('/api/admin/login').send({
      username: 'nonadmin',
      password: 'password123',
    })
    expect(loginRes.status).toBe(200)

    const usersRes = await agent.get('/api/admin/users')
    expect(usersRes.status).toBe(403)
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
      .send({ username: 'founduser', password: 'password123' })
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
    const agent = request.agent(app)
    await loginAsAdmin(agent)
    await agent.post('/api/admin/users').send({ username: 'dup', password: 'password123' })
    const res = await agent.post('/api/admin/users').send({ username: 'dup', password: 'other456' })
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
      .send({ username: 'orig', password: 'password123' })
    const id = createRes.body.id
    const res = await agent.put(`/api/admin/users/${id}`).send({ username: 'updated' })
    expect(res.status).toBe(200)
    expect(res.body.username).toBe('updated')
  })

  it('returns 409 when new username already taken', async () => {
    const app = createTestApp()
    const agent = request.agent(app)
    await loginAsAdmin(agent)
    await agent.post('/api/admin/users').send({ username: 'first', password: 'password123' })
    const createRes = await agent.post('/api/admin/users').send({ username: 'second', password: 'password123' })
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
    const createRes = await agent
      .post('/api/admin/users')
      .send({ username: 'todel', password: 'password123' })
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
