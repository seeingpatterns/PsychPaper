import { Link } from 'react-router-dom'

const articles = [
  {
    slug: 'sleep-mortality-130man',
    badge: '첫 논문',
    title: '잠이 부족해도, 너무 많이 자도 죽는다 - 130만 명 메타분석',
    desc: 'Deep Diveㆍ수면 & 사망 위험 U자 곡선',
  },
]

export default function ArticlesPage() {
  return (
    <>
      <div className="noise" aria-hidden="true" />
      <main className="relative z-0 max-w-[980px] mx-auto px-6 py-12 pb-24">
        <header className="mb-8">
          <Link to="/" className="text-[var(--blue)] hover:underline">
            ← PsychPaper
          </Link>
          <h1 className="mt-4 text-3xl font-black">Articles</h1>
          <p className="mt-2 text-[var(--dim)]">현재 공개된 PsychPaper 아티클 목록입니다.</p>
        </header>

        <section className="article-tiles">
          {articles.map((article) => (
            <Link key={article.slug} to={`/article/${article.slug}`} className="article-tile">
              <div className="toc-num">{article.badge}</div>
              <h2 className="toc-title">{article.title}</h2>
              <p className="toc-desc">{article.desc}</p>
              <div className="article-tile-action">Go to article</div>
            </Link>
          ))}
        </section>
      </main>
    </>
  )
}
