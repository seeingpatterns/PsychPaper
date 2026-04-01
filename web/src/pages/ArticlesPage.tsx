import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { ArticleListItem } from '@/entities/article/model/articlePublicList'
import { publicArticles } from '@/entities/article/model/articlePublicList'
import { AuthorStamp } from '@/shared/ui/AuthorStamp'
import { PsychPaperCubeLogo } from '@/shared/ui/PsychPaperCubeLogo'

const articles = publicArticles

function renderTitle(title: string, highlight?: ArticleListItem['highlight']): ReactNode {
  if (!highlight?.phrase) return title
  const i = title.indexOf(highlight.phrase)
  if (i === -1) return title
  const markClass =
    highlight.variant === 'secondary'
      ? 'magazine-mark magazine-mark--secondary'
      : highlight.variant === 'tertiary'
        ? 'magazine-mark magazine-mark--tertiary'
        : 'magazine-mark'
  return (
    <>
      {title.slice(0, i)}
      <mark className={markClass}>{highlight.phrase}</mark>
      {title.slice(i + highlight.phrase.length)}
    </>
  )
}

function MagazineArticleCard({ article }: { article: ArticleListItem }) {
  const size = article.titleSize ?? 'medium'
  const titleClass =
    size === 'large'
      ? 'magazine-article-title magazine-article-title--large'
      : size === 'small'
        ? 'magazine-article-title magazine-article-title--small'
        : 'magazine-article-title magazine-article-title--medium'

  return (
    <article className="magazine-article-block">
      {article.imageUrl ? (
        <figure className="magazine-figure magazine-figure--compact">
          <img src={article.imageUrl} alt={article.imageAlt ?? ''} loading="lazy" />
        </figure>
      ) : null}

      <small className="magazine-category">{article.badge}</small>

      <h2 className={titleClass}>
        <Link to={`/article/${article.slug}`} className="magazine-article-link">
          {renderTitle(article.title, article.highlight)}
        </Link>
      </h2>

      <div className="magazine-excerpt">
        <p>{article.excerpt}</p>
      </div>

      {article.byline ? (
        <div className="magazine-creditation">
          <p>{article.byline}</p>
        </div>
      ) : null}

      <div className="magazine-author">
        <AuthorStamp
          name={article.author.name}
          role={article.author.role}
          photoUrl={article.authorPhotoUrl}
        />
      </div>
    </article>
  )
}

function SlotPlaceholder({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="magazine-slot-placeholder">
      <p className="magazine-slot-placeholder-label">{label}</p>
      {children}
    </div>
  )
}

function FeaturedColumn({ article }: { article: ArticleListItem | undefined }) {
  if (!article) {
    return (
      <SlotPlaceholder label="히어로 아티클">
        <div className="magazine-slot-hero" aria-hidden="true" />
        <p className="magazine-slot-hint">대표 논문이 여기에 큰 이미지와 함께 들어갑니다.</p>
      </SlotPlaceholder>
    )
  }

  const heroTitleClass =
    article.titleSize === 'large'
      ? 'magazine-article-title magazine-article-title--large'
      : article.titleSize === 'small'
        ? 'magazine-article-title magazine-article-title--small'
        : 'magazine-article-title magazine-article-title--medium'

  return (
    <article className="magazine-article-block border-0 pt-0 mt-0">
      {article.imageUrl ? (
        <figure className="magazine-figure magazine-figure--hero m-0">
          <img src={article.imageUrl} alt={article.imageAlt ?? ''} loading="eager" />
        </figure>
      ) : (
        <div className="magazine-slot-hero" aria-hidden="true" />
      )}
      <small className="magazine-category mt-4">{article.badge}</small>
      <h2 className={heroTitleClass}>
        <Link to={`/article/${article.slug}`} className="magazine-article-link">
          {renderTitle(article.title, article.highlight)}
        </Link>
      </h2>
      <div className="magazine-excerpt">
        <p>{article.excerpt}</p>
      </div>
      <div className="magazine-author">
        <AuthorStamp
          name={article.author.name}
          role={article.author.role}
          photoUrl={article.authorPhotoUrl}
        />
      </div>
      <Link
        to={`/article/${article.slug}`}
        className="mt-4 inline-block text-[0.92rem] font-bold text-[var(--blue)] hover:underline"
      >
        아티클 열기 →
      </Link>
    </article>
  )
}

function DeepDiveMiniPlaceholder() {
  return (
    <div className="magazine-deep-dive-strip">
      <small className="magazine-category !mb-3">Deep Dive · 오디오</small>
      <h3 className="magazine-article-title magazine-article-title--small mb-3">
        <span className="text-[var(--dim)]">곧 추가될 해설·내레이션</span>
      </h3>
      <div className="magazine-audio-row" aria-hidden="true">
        <button type="button" className="magazine-audio-play" disabled tabIndex={-1}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="18" height="18" fill="currentColor">
            <path d="M232.3 114.3L88.3 26.4A16 16 0 0 0 64 40v176a16 16 0 0 0 24.3 13.6l144-86a16 16 0 0 0 0-27.3z" />
          </svg>
        </button>
        <div className="magazine-audio-progress" />
        <span className="magazine-audio-time">—:—</span>
      </div>
      <p className="mt-2 text-[0.78rem] text-[var(--dim)]">준비되면 재생 시간이 표시됩니다.</p>
    </div>
  )
}

export default function ArticlesPage() {
  const featured = articles[0]
  const col1 = articles.slice(1, 3)
  const col3 = articles.slice(3, 5)
  const col4 = articles[5]

  return (
    <>
      <div className="noise" aria-hidden="true" />

      <div className="magazine-shell">
        <header className="magazine-header">
          <div className="magazine-header-brand">
            <Link to="/" className="magazine-header-logo pp-cube-logo" title="PsychPaper">
              <span className="pp-cube-logo__vh">PsychPaper</span>
              <PsychPaperCubeLogo />
            </Link>
          </div>
          <p className="magazine-header-tagline">심리학 논문 해설 &amp; 지식 탐색</p>
          <nav className="magazine-header-nav" aria-label="아티클 페이지">
            <Link to="/" className="magazine-header-link">
              Home
            </Link>
            <Link to="/articles" className="magazine-header-link" aria-current="page">
              Articles
            </Link>
          </nav>
        </header>

        <main className="magazine-layout">
        <div className="magazine-page-title">
          <h1>최신 논문 해설</h1>
        </div>

        {/* 레퍼런스: 5칸 그리드 = 열1(1) + 히어로(2) + 열3(1) + 열4(1) */}
        <div className="magazine-layout-grid">
          <section className="magazine-column magazine-column--span-1">
            {col1.length === 0 ? (
              <div className="magazine-slot-stack">
                <SlotPlaceholder label="텍스트 아티클">
                  <p className="magazine-slot-hint">요약·서론 위주 카드가 위아래로 쌓입니다.</p>
                </SlotPlaceholder>
                <SlotPlaceholder label="텍스트 아티클">
                  <p className="magazine-slot-hint">두 번째 슬롯</p>
                </SlotPlaceholder>
              </div>
            ) : (
              col1.map((a) => <MagazineArticleCard key={a.slug} article={a} />)
            )}
          </section>

          <section className="magazine-column magazine-column--span-2">
            <FeaturedColumn article={featured} />
          </section>

          <section className="magazine-column magazine-column--span-1">
            {col3.length === 0 ? (
              <div className="magazine-slot-stack">
                <SlotPlaceholder label="썸네일 아티클">
                  <div className="magazine-slot-thumb" aria-hidden="true" />
                  <p className="magazine-slot-hint">이미지 + 짧은 제목</p>
                </SlotPlaceholder>
                <SlotPlaceholder label="썸네일 아티클">
                  <div className="magazine-slot-thumb" aria-hidden="true" />
                  <p className="magazine-slot-hint">두 번째 슬롯</p>
                </SlotPlaceholder>
              </div>
            ) : (
              col3.map((a) => <MagazineArticleCard key={a.slug} article={a} />)
            )}
          </section>

          <section className="magazine-column magazine-column--span-1">
            {col4 ? (
              <MagazineArticleCard article={col4} />
            ) : (
              <div className="magazine-slot-stack">
                <SlotPlaceholder label="피처 · 메모">
                  <p className="magazine-slot-hint">긴 글 한 편 또는 에디터 노트.</p>
                </SlotPlaceholder>
                <div className="magazine-deep-dive-block">
                  <DeepDiveMiniPlaceholder />
                  <div className="magazine-author mt-6">
                    <AuthorStamp name="Jung Kim" role="Psykid" />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {articles.length > 6 ? (
          <div className="magazine-more-grid">
            {articles.slice(6).map((article) => (
              <div key={article.slug} className="magazine-more-cell">
                <MagazineArticleCard article={article} />
              </div>
            ))}
          </div>
        ) : null}
        </main>
      </div>
    </>
  )
}
