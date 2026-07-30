import type { Request, Response, NextFunction } from 'express'

export function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  const adminUserId = req.session?.adminUserId
  if (typeof adminUserId === 'undefined') {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' })
  }
  if (typeof adminUserId !== 'number') {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' })
  }
  ;(req as Request & { adminUserId?: number }).adminUserId = adminUserId
  return next()
}
