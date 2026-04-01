export type HighlightVariant = 'primary' | 'secondary' | 'tertiary'

import { getSleepMortalityCoverUrl } from './articleCoverEnv'

export type ArticleListItem = {
  slug: string
  badge: string
  title: string
  excerpt: string
  highlight?: { phrase: string; variant: HighlightVariant }
  imageUrl?: string
  imageAlt?: string
  /** `/public` 기준 경로 예: `/authors/jung-kim.jpg` */
  authorPhotoUrl?: string
  author: { name: string; role: string }
  titleSize?: 'large' | 'medium' | 'small'
  byline?: string
}

/** 공개 논문 메타 — 첫 항목은 매거진 히어로(가운데 2칸), 나머지 칸은 데이터가 늘면 채움 */
export const publicArticles: ArticleListItem[] = [
  {
    slug: 'sleep-mortality-130man',
    badge: 'Deep Dive · 수면',
    title: '잠이 부족해도, 너무 많이 자도 위험하다 — 130만 명 메타분석',
    highlight: { phrase: '130만 명', variant: 'primary' },
    excerpt:
      '수면 시간과 사망 위험은 U자 관계를 보입니다. 너무 짧거나 너무 긴 수면 모두 건강에 대한 시사점이 있습니다.',
    imageUrl: getSleepMortalityCoverUrl(),
    imageAlt: '어두운 침실에서 창문으로 들어오는 빛',
    authorPhotoUrl: undefined,
    author: { name: 'Jung Kim', role: 'Psykid' },
    titleSize: 'large',
  },
]

export function getPublicArticleBySlug(slug: string): ArticleListItem | undefined {
  return publicArticles.find((a) => a.slug === slug)
}
