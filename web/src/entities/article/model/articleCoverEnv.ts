/** Unsplash 기본값 — `VITE_COVER_SLEEP_MORTALITY_130MAN` 미설정 시 사용 */
const DEFAULT_SLEEP_MORTALITY_COVER =
  'https://images.unsplash.com/photo-1541788884943-8b1b3e5f3a0a?auto=format&fit=crop&w=1200&q=80'

/**
 * 수면 메타분석 아티클 히어로 이미지.
 * `web/.env`에 `VITE_COVER_SLEEP_MORTALITY_130MAN` 을 넣으면 그 값이 우선합니다.
 * - `public` 기준: `/covers/my-photo.webp`
 * - 외부 URL: `https://...`
 */
export function getSleepMortalityCoverUrl(): string {
  const raw = import.meta.env.VITE_COVER_SLEEP_MORTALITY_130MAN
  if (typeof raw === 'string') {
    const v = raw.trim()
    if (v.length > 0) return v
  }
  return DEFAULT_SLEEP_MORTALITY_COVER
}
