import { Link, useParams } from 'react-router-dom'
import { getPublicArticleBySlug } from '@/entities/article/model/articlePublicList'
import { AuthorStamp } from '@/shared/ui/AuthorStamp'

const DEEP_DIVE_ARTICLE = 'sleep-mortality-130man'

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const isDeepDive = slug === DEEP_DIVE_ARTICLE
  const meta = slug ? getPublicArticleBySlug(slug) : undefined

  return (
    <>
      <div className="noise" aria-hidden="true" />
      <main
        className="relative z-0 max-w-[900px] mx-auto px-6 py-12 pb-24"
        style={{ color: 'var(--text)' }}
      >
        <Link
          to="/"
          className="inline-block text-[var(--blue)] hover:underline mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] rounded font-[inherit] no-underline"
        >
          ← PsychPaper
        </Link>

        <div className="mb-8">
          <AuthorStamp
            name={meta?.author.name ?? 'Jung Kim'}
            role={meta?.author.role ?? 'Psykid'}
            photoUrl={meta?.authorPhotoUrl}
          />
        </div>

        {isDeepDive ? (
          <iframe
            src="/articles/sleep-mortality-130man.html"
            title="잠이 부족해도, 너무 많이 자도 죽는다 - 130만 명 메타분석"
            className="w-full border-0 rounded-lg overflow-hidden bg-[var(--bg)]"
            style={{ minHeight: 'calc(100vh - 8rem)' }}
          />
        ) : (
          <article className="pt-4">
            <div className="section-num">논문 설명</div>
            <h1 className="font-black text-2xl md:text-3xl leading-snug text-[var(--text)] mb-4">
              {slug}
            </h1>
            <p className="text-[0.95rem] text-[var(--dim)] leading-relaxed">
              여기에 Deep Dive 본문이 표시됩니다. (추후 연동)
            </p>
          </article>
        )}
      </main>
    </>
  )
}
