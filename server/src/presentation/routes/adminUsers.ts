import { Router, type Request, type Response } from 'express'
import type { AppDeps } from '../../app.js'
import bcrypt from 'bcryptjs'
import { requireAdminSession } from '../../middleware/requireAdminSession.js'

const USERNAME_MIN = 3
const USERNAME_MAX = 50
const PASSWORD_MIN = 8
const PASSWORD_MAX = 72

function parseId(id: string): number | null {
  const n = parseInt(id, 10)
  return Number.isInteger(n) && n > 0 ? n : null
}

function errorRes(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ code, message })
}

function validateCreateBody(body: unknown): { username: string; password: string } | { code: string; message: string } {
  if (body === null || typeof body !== 'object' || !('username' in body) || !('password' in body)) {
    return { code: 'VALIDATION_ERROR', message: 'username and password are required' }
  }
  const username = (body as { username?: unknown }).username
  const password = (body as { password?: unknown }).password
  if (typeof username !== 'string' || typeof password !== 'string') {
    return { code: 'VALIDATION_ERROR', message: 'username and password must be strings' }
  }
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return { code: 'VALIDATION_ERROR', message: `username must be ${USERNAME_MIN}-${USERNAME_MAX} characters` }
  }
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return { code: 'VALIDATION_ERROR', message: `password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters` }
  }
  return { username, password }
}

function validateUpdateBody(body: unknown): { username?: string; password?: string } | { code: string; message: string } {
  const o = (body === null || typeof body !== 'object') ? {} : (body as Record<string, unknown>)
  const out: { username?: string; password?: string } = {}
  if ('username' in o && o.username !== undefined) {
    if (typeof o.username !== 'string') {
      return { code: 'VALIDATION_ERROR', message: 'username must be a string' }
    }
    if (o.username.length < USERNAME_MIN || o.username.length > USERNAME_MAX) {
      return { code: 'VALIDATION_ERROR', message: `username must be ${USERNAME_MIN}-${USERNAME_MAX} characters` }
    }
    out.username = o.username
  }
  if ('password' in o && o.password !== undefined) {
    if (typeof o.password !== 'string') {
      return { code: 'VALIDATION_ERROR', message: 'password must be a string' }
    }
    if (o.password.length < PASSWORD_MIN || o.password.length > PASSWORD_MAX) {
      return { code: 'VALIDATION_ERROR', message: `password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters` }
    }
    out.password = o.password
  }
  return out
}

export function createAdminUsersRouter(deps: AppDeps): Router {
  const router = Router()
  const { adminUserService, pool } = deps

  router.use('/users', requireAdminSession)

  router.get('/users', async (_req: Request, res: Response) => {
    try {
      const users = await adminUserService.list()
      res.json({ users })
    } catch (err) {
      console.error('GET /api/admin/users error:', err)
      errorRes(res, 500, 'INTERNAL_ERROR', 'Failed to list admin users')
    }
  })

  router.get('/users/:id', async (req: Request, res: Response) => {
    const id = parseId(req.params.id)
    if (id === null) {
      return errorRes(res, 400, 'VALIDATION_ERROR', 'id must be a positive integer')
    }
    try {
      const user = await adminUserService.getById(id)
      if (!user) return errorRes(res, 404, 'NOT_FOUND', 'Admin user not found')
      res.json(user)
    } catch (err) {
      console.error('GET /api/admin/users/:id error:', err)
      errorRes(res, 500, 'INTERNAL_ERROR', 'Failed to get admin user')
    }
  })

  router.post('/users', async (req: Request, res: Response) => {
    const validated = validateCreateBody(req.body)
    if ('code' in validated) return errorRes(res, 400, validated.code, validated.message)
    try {
      const result = await adminUserService.create(validated)
      if ('conflict' in result) {
        return errorRes(res, 409, 'CONFLICT', 'Username already exists')
      }
      const user = result.user
      res.status(201).location(`/api/admin/users/${user.id}`).json(user)
    } catch (err) {
      console.error('POST /api/admin/users error:', err)
      errorRes(res, 500, 'INTERNAL_ERROR', 'Failed to create admin user')
    }
  })

  router.put('/users/:id', async (req: Request, res: Response) => {
    const id = parseId(req.params.id)
    if (id === null) {
      return errorRes(res, 400, 'VALIDATION_ERROR', 'id must be a positive integer')
    }
    const validated = validateUpdateBody(req.body)
    if ('code' in validated) return errorRes(res, 400, validated.code, validated.message)
    try {
      const result = await adminUserService.update(id, validated)
      if (result === null) return errorRes(res, 404, 'NOT_FOUND', 'Admin user not found')
      if ('conflict' in result) return errorRes(res, 409, 'CONFLICT', 'Username already exists')
      res.json(result.user)
    } catch (err) {
      console.error('PUT /api/admin/users/:id error:', err)
      errorRes(res, 500, 'INTERNAL_ERROR', 'Failed to update admin user')
    }
  })

  router.delete('/users/:id', async (req: Request, res: Response) => {
    const id = parseId(req.params.id)
    if (id === null) {
      return errorRes(res, 400, 'VALIDATION_ERROR', 'id must be a positive integer')
    }
    try {
      const deleted = await adminUserService.delete(id)
      if (!deleted) return errorRes(res, 404, 'NOT_FOUND', 'Admin user not found')
      res.status(204).send()
    } catch (err) {
      console.error('DELETE /api/admin/users/:id error:', err)
      errorRes(res, 500, 'INTERNAL_ERROR', 'Failed to delete admin user')
    }
  })

  if (pool) {
    router.post('/login', async (req: Request, res: Response) => {
      try {
        const { username, password } = req.body ?? {}
        if (typeof username !== 'string' || typeof password !== 'string') {
          return res.status(400).json({ ok: false, error: 'Invalid payload' })
        }
        const result = await pool.query(
          `SELECT id, password_hash FROM admin_users WHERE username = $1 LIMIT 1`,
          [username]
        )
        if (result.rowCount === 0) return res.status(401).json({ ok: false })
        const { id, password_hash } = result.rows[0] as { id: number; password_hash: string }
        const ok = await bcrypt.compare(password, password_hash)
        if (!ok) return res.status(401).json({ ok: false })
        req.session.adminUserId = id
        return res.json({ ok: true })
      } catch (err) {
        console.error('admin login error:', err)
        return res.status(500).json({ ok: false })
      }
    })

    router.post('/logout', requireAdminSession, (req: Request, res: Response) => {
      req.session.destroy((err) => {
        if (err) {
          console.error('admin logout error:', err)
          return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to logout' })
        }
        res.clearCookie('pp_session', {
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
        return res.status(204).send()
      })
    })
  }

  return router
}
