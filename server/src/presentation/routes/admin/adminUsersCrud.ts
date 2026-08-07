import { Router, type Request, type Response } from 'express'
import type { AppDeps } from '../../../app.js'

const USERNAME_MIN = 3
const USERNAME_MAX = 50
const PASSWORD_MIN = 8
const PASSWORD_MAX = 72
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,72}$/

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
  if (!PASSWORD_PATTERN.test(password)) {
    return { code: 'VALIDATION_ERROR', message: 'password must include uppercase, lowercase, number, and special character' }
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
    if (!PASSWORD_PATTERN.test(o.password)) {
      return { code: 'VALIDATION_ERROR', message: 'password must include uppercase, lowercase, number, and special character' }
    }
    out.password = o.password
  }
  return out
}

/**
 * AdminUser CRUD만 담당. 인증·IP·감사는 상위 createAdminApiRouter에서 적용한다.
 */
export function createAdminUsersCrudRouter(deps: AppDeps): Router {
  const router = Router()
  const { adminUserService } = deps

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const users = await adminUserService.list()
      res.json({ users })
    } catch (err) {
      console.error('GET /api/admin/users error:', err)
      errorRes(res, 500, 'INTERNAL_ERROR', 'Failed to list admin users')
    }
  })

  router.get('/:id', async (req: Request, res: Response) => {
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

  router.post('/', async (req: Request, res: Response) => {
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

  router.put('/:id', async (req: Request, res: Response) => {
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

  router.delete('/:id', async (req: Request, res: Response) => {
    const id = parseId(req.params.id)
    if (id === null) {
      return errorRes(res, 400, 'VALIDATION_ERROR', 'id must be a positive integer')
    }
    if (id === req.session.adminUserId) {
      return errorRes(res, 403, 'FORBIDDEN', 'Cannot delete your own account')
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

  return router
}
