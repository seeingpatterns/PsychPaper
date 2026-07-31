import type { Request } from 'express'

/** IPv4-mapped IPv6 (::ffff:x.x.x.x) → IPv4 문자열로 통일 */
export function normalizeClientIp(ip: string): string {
  if (ip.startsWith('::ffff:')) return ip.slice(7)
  return ip
}

export function getClientIp(req: Request): string {
  // X-Forwarded-For를 직접 파싱하지 않는다 — 첫 값은 요청자가 임의로 쓸 수 있어 스푸핑됨.
  // req.ip는 Express가 trust proxy 설정(신뢰 홉 수) 기준으로 계산한 값만 반환한다.
  return normalizeClientIp(req.ip ?? req.socket.remoteAddress ?? '')
}
