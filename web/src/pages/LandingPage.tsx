import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { CSSProperties } from 'react'

export default function LandingPage() {
  const location = useLocation()
  const navLinkRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [selectorStyle, setSelectorStyle] = useState<CSSProperties>({
    opacity: 0,
    left: 0,
    width: 0,
  })
  const avatarEmoji = useMemo(() => {
    const username = window.localStorage.getItem('pp_admin_username')?.trim()
    if (!username) return '👤'
    return '🧑'
  }, [])

  const navItems = [
    { to: '/', label: 'Home', title: 'Home' },
    { to: '/articles', label: 'Article', title: 'Article' },
    { to: '/admin/login', label: 'Login', title: 'Login' },
  ]

  const activeIndex = useMemo(() => {
    const exactMatch = navItems.findIndex((item) => item.to === location.pathname)
    if (exactMatch >= 0) return exactMatch
    return 0
  }, [location.pathname])

  const updateSelectorByIndex = useCallback((index: number) => {
    const element = navLinkRefs.current[index]
    if (!element) return

    setSelectorStyle({
      opacity: 1,
      left: element.offsetLeft,
      width: element.offsetWidth,
    })
  }, [])

  useEffect(() => {
    updateSelectorByIndex(hoveredIndex ?? activeIndex)
  }, [activeIndex, hoveredIndex, updateSelectorByIndex])

  useEffect(() => {
    const onResize = () => updateSelectorByIndex(hoveredIndex ?? activeIndex)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activeIndex, hoveredIndex, updateSelectorByIndex])

  return (
    <>
      <div className="noise" aria-hidden="true" />

      <div className="relative min-h-screen overflow-hidden">
        <div className="hero-blob" aria-hidden="true" />

        <nav className="navbar navbar-expand-custom navbar-mainbg">
          <div className="landing-navbar-wrap">
            <Link to="/" className="navbar-logo landing-logo-text">PsychPaper</Link>
            <div className="navbar-collapse">
              <ul className="navbar-nav ml-auto" onMouseLeave={() => setHoveredIndex(null)}>
                <div className="hori-selector" style={selectorStyle} />
                {navItems.map((item, index) => (
                  <li key={item.to} className={`nav-item${location.pathname === item.to ? ' active' : ''}`}>
                    <Link
                      ref={(el) => { navLinkRefs.current[index] = el }}
                      className="nav-link"
                      to={item.to}
                      aria-label={item.title}
                      title={item.title}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onFocus={() => setHoveredIndex(index)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="landing-nav-actions">
                <Link to="/admin" className="landing-action-btn" aria-label="Settings" title="Settings">⚙️</Link>
                <Link to="/admin" className="landing-avatar" aria-label="Avatar" title="Avatar">{avatarEmoji}</Link>
              </div>
            </div>
          </div>
        </nav>

        <header className="relative z-0 min-h-[70vh] flex flex-col justify-center px-6 py-12 max-w-[900px] mx-auto landing-hero-offset">
          <Link
            to="/"
            className="text-inherit no-underline hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] rounded"
          >
            <h1 className="font-black text-[clamp(2rem,5.5vw,3.5rem)] leading-tight">
              <span className="text-[var(--blue)]">PsychPaper</span>
              <br />
              심리학 논문 해설 &<br />
              지식 탐색 플랫폼
            </h1>
            <p className="mt-5 text-base text-[var(--dim)] max-w-[620px]">
              심리학 대학원생이 학술 논문을 읽고, 핵심을 시각적으로 매력적인 글로 해설하여
              일반 대중과 공유하는 논문 해설 블로그 + 지식 탐색 플랫폼
            </p>
          </Link>
        </header>

        <nav className="relative z-0 max-w-[900px] mx-auto px-6 pb-12">
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
          >
            <Link
              to="/article/sleep-mortality-130man"
              className="toc-item focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            >
              <div className="toc-num">첫 논문</div>
              <div className="toc-title">
                잠이 부족해도, 너무 많이 자도 죽는다 - 130만 명 메타분석
              </div>
              <div className="toc-desc">
                Deep Diveㆍ수면 & 사망 위험 U자 곡선
              </div>
            </Link>
          </div>
        </nav>
      </div>
    </>
  )
}
