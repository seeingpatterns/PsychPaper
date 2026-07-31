import type { Request, Response, NextFunction } from 'express'
import type { Pool } from 'pg'

const BY_ID_SQL = `SELECT id FROM admin_users WHERE id = $1 LIMIT 1`

/**
 * 세션 검증 + 폐기(revocation) 반영.
 * 세션에 adminUserId가 있어도 계정이 DB에서 삭제됐으면 즉시 401 — 세션 쿠키가
 * TTL(7일) 동안 "죽지 않는 열쇠"가 되는 것을 막는다. 로그인과 같은 소스(pool)를 재확인한다.
 */
export function createRequireAdminSession(pool: Pool | null) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const adminUserId = req.session?.adminUserId
    if (typeof adminUserId === 'undefined') {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' })
    }
    if (typeof adminUserId !== 'number') {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' })
    }
    if (pool) {
      try {
        const result = await pool.query(BY_ID_SQL, [adminUserId])
        if (!result.rowCount) {
          req.session.destroy((destroyErr) => {
            if (destroyErr) console.error('session destroy error:', destroyErr)
          })
          return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Session is no longer valid' })
        }
      } catch (err) {
        console.error('session revalidation error:', err)
        return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Session validation failed' })
      }
    }
    ;(req as Request & { adminUserId?: number }).adminUserId = adminUserId
    return next()
  }
}
