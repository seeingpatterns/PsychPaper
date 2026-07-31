import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { getClientIp, normalizeClientIp } from './clientIp.js'
import { adminIpWhitelistMiddleware } from './ipWhitelist.js'
import { createRequireAdminSession } from './requireAdminSession.js'

const ORIGINAL_WHITELIST = process.env.ADMIN_IP_WHITELIST

afterEach(() => {
  if (ORIGINAL_WHITELIST === undefined) delete process.env.ADMIN_IP_WHITELIST
  else process.env.ADMIN_IP_WHITELIST = ORIGINAL_WHITELIST
})

function appReportingIp(trustProxyHops?: number) {
  const app = express()
  if (trustProxyHops) app.set('trust proxy', trustProxyHops)
  app.get('/ip', (req, res) => res.json({ ip: getClientIp(req) }))
  return app
}

describe('getClientIp — X-Forwarded-For 스푸핑 방어 (회귀 테스트)', () => {
  it('trust proxy가 꺼져 있으면 XFF 헤더를 무시하고 소켓 주소를 쓴다', async () => {
    const res = await request(appReportingIp())
      .get('/ip')
      .set('X-Forwarded-For', '6.6.6.6')
    expect(res.body.ip).not.toBe('6.6.6.6')
    expect(res.body.ip).toBe('127.0.0.1') // supertest 로컬 접속
  })

  it('trust proxy 1홉이면 마지막 XFF 값(신뢰 프록시가 붙인 것)만 쓴다 — 앞쪽 위조값 무시', async () => {
    const res = await request(appReportingIp(1))
      .get('/ip')
      .set('X-Forwarded-For', '6.6.6.6, 9.9.9.9')
    expect(res.body.ip).toBe('9.9.9.9')
  })

  it('IPv4-mapped IPv6를 IPv4로 정규화한다', () => {
    expect(normalizeClientIp('::ffff:10.0.0.1')).toBe('10.0.0.1')
    expect(normalizeClientIp('203.0.113.5')).toBe('203.0.113.5')
  })
})

describe('adminIpWhitelistMiddleware', () => {
  function appWithWhitelist() {
    const app = express()
    app.use(adminIpWhitelistMiddleware())
    app.get('/secure', (_req, res) => res.json({ ok: true }))
    return app
  }

  it('화이트리스트가 비어 있으면 모두 통과', async () => {
    delete process.env.ADMIN_IP_WHITELIST
    const res = await request(appWithWhitelist()).get('/secure')
    expect(res.status).toBe(200)
  })

  it('허용 IP는 통과한다', async () => {
    process.env.ADMIN_IP_WHITELIST = '127.0.0.1'
    const res = await request(appWithWhitelist()).get('/secure')
    expect(res.status).toBe(200)
  })

  it('XFF로 허용 IP를 위조해도 차단된다 (핵심 시나리오)', async () => {
    process.env.ADMIN_IP_WHITELIST = '203.0.113.5'
    const res = await request(appWithWhitelist())
      .get('/secure')
      .set('X-Forwarded-For', '203.0.113.5')
    expect(res.status).toBe(403)
  })
})

describe('createRequireAdminSession — 세션 폐기 반영', () => {
  type MockRes = {
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
  }
  function mockRes(): MockRes {
    const res = {} as MockRes
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res
  }
  const poolWith = (rowCount: number) =>
    ({ query: vi.fn().mockResolvedValue({ rowCount, rows: [] }) }) as never

  it('세션 없음 → 401', async () => {
    const mw = createRequireAdminSession(poolWith(1))
    const res = mockRes()
    const next = vi.fn()
    await mw({ session: {} } as never, res as never, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('계정이 DB에 살아 있으면 통과', async () => {
    const mw = createRequireAdminSession(poolWith(1))
    const res = mockRes()
    const next = vi.fn()
    const req = { session: { adminUserId: 1 } }
    await mw(req as never, res as never, next)
    expect(next).toHaveBeenCalled()
  })

  it('계정이 삭제됐으면 세션을 파기하고 401 — 좀비 세션 차단', async () => {
    const mw = createRequireAdminSession(poolWith(0))
    const res = mockRes()
    const next = vi.fn()
    const destroy = vi.fn()
    const req = { session: { adminUserId: 99, destroy } }
    await mw(req as never, res as never, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(destroy).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('DB 오류 시 열어주지 않고 500 (fail-closed)', async () => {
    const pool = { query: vi.fn().mockRejectedValue(new Error('db down')) } as never
    const mw = createRequireAdminSession(pool)
    const res = mockRes()
    const next = vi.fn()
    await mw({ session: { adminUserId: 1 } } as never, res as never, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(next).not.toHaveBeenCalled()
  })
})

describe('감사 로그가 IP 차단보다 먼저 실행된다', () => {
  afterEach(() => {
    vi.doUnmock('../../infrastructure/logging/adminAuditLogger.js')
  })

  it('화이트리스트에 차단된 403도 감사 로그에 남는다', async () => {
    vi.resetModules()
    process.env.ADMIN_IP_WHITELIST = '203.0.113.5'
    const infoSpy = vi.fn()
    vi.doMock('../../infrastructure/logging/adminAuditLogger.js', () => ({
      adminAuditLogger: { info: infoSpy },
    }))
    const { createAdminApiRouter } = await import(
      '../../presentation/routes/admin/createAdminApiRouter.js'
    )

    const app = express()
    app.use('/api/admin', createAdminApiRouter({ adminUserService: {} as never, pool: null }))
    const res = await request(app).get('/api/admin/me')
    expect(res.status).toBe(403)

    await vi.waitFor(() => {
      expect(infoSpy).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
    })
  })
})
