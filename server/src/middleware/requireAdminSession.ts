import type { Request, Response, NextFunction } from 'express'

export function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  if (typeof req.session?.adminUserId !== 'number') {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' })
  }
  return next()
}
