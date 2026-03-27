import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import type { AppDeps } from '../../../app.js'

const cookieOpts = () => ({
  httpOnly: true,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
})

export function createAdminAuthHandlers(deps: AppDeps) {
  const { pool } = deps

  async function me(req: Request, res: Response) {
    if (!pool) {
      return res.status(503).json({ code: 'SERVICE_UNAVAILABLE', message: 'Admin auth unavailable' })
    }

    const adminUserId = req.session.adminUserId
    if (typeof adminUserId !== 'number') {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' })
    }

    try {
      const result = await pool.query(
        `SELECT id, username FROM admin_users WHERE id = $1 LIMIT 1`,
        [adminUserId]
      )
      if (result.rowCount === 0) {
        req.session.destroy(() => {})
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' })
      }
      const user = result.rows[0] as { id: number; username: string }
      return res.json({ user })
    } catch (err) {
      console.error('admin me error:', err)
      return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to resolve current admin' })
    }
  }

  async function login(req: Request, res: Response) {
    if (!pool) {
      return res.status(503).json({ ok: false, error: 'Admin auth unavailable' })
    }
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
  }

  function logout(req: Request, res: Response) {
    req.session.destroy((err) => {
      if (err) {
        console.error('admin logout error:', err)
        return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to logout' })
      }
      res.clearCookie('pp_session', cookieOpts())
      return res.status(204).send()
    })
  }

  return { me, login, logout }
}
