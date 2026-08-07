import pino from 'pino'

export const adminAuditLogger = pino({
  name: 'admin-audit',
  level:
    process.env.LOG_LEVEL === 'debug'
      ? 'debug'
      : process.env.NODE_ENV === 'test'
        ? 'silent'
        : 'info',
})
