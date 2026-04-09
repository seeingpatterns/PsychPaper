import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import type { CSSProperties } from 'react'
import type { ReactNode } from 'react'

type AdminSection = 'dashboard' | 'users' | 'articles'

type AdminShellProps = {
  section: AdminSection
  title: string
  subtitle?: string
  actions?: ReactNode
  onLogout?: () => void
  logoutDisabled?: boolean
  children: ReactNode
}

export default function AdminShell({
  section,
  title,
  subtitle,
  actions,
  children,
}: AdminShellProps) {
  const sideLinkRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [selectorStyle, setSelectorStyle] = useState<CSSProperties>({
    opacity: 0,
    top: 0,
    height: 0,
  })
  const sideNavItems = useMemo(() => ([
    { to: '/admin', label: 'Dashboard', section: 'dashboard' as const },
    { to: '/admin/users', label: 'Admin Users', section: 'users' as const },
    { to: '/admin/articles', label: 'Articles', section: 'articles' as const },
  ]), [])
  const updateSelectorByIndex = useCallback((index: number | null) => {
    if (index === null) {
      setSelectorStyle({
        opacity: 0,
        top: 0,
        height: 0,
      })
      return
    }

    const element = sideLinkRefs.current[index]
    if (!element) return

    setSelectorStyle({
      opacity: 1,
      top: element.offsetTop,
      height: element.offsetHeight,
    })
  }, [])

  useEffect(() => {
    updateSelectorByIndex(hoveredIndex)
  }, [hoveredIndex, updateSelectorByIndex])

  useEffect(() => {
    const onResize = () => updateSelectorByIndex(hoveredIndex)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [hoveredIndex, updateSelectorByIndex])

  return (
    <div className="admin-shell">
      <header className="admin-shell-header">
        <div className="admin-shell-logo">
          <h1><Link to="/" className="admin-shell-logo-link">PsychPaper</Link></h1>
          <p>Management Console</p>
        </div>
      </header>

      <div className="admin-shell-body">
        <aside className="admin-shell-sidebar">
          <nav className="admin-shell-side-nav" aria-label="Admin side navigation" onMouseLeave={() => setHoveredIndex(null)}>
            <div className="admin-side-selector" style={selectorStyle} />
            {sideNavItems.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                ref={(el) => { sideLinkRefs.current[index] = el }}
                className={section === item.section ? 'active' : undefined}
                onMouseEnter={() => setHoveredIndex(index)}
                onFocus={() => setHoveredIndex(index)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <footer className="admin-shell-footer">
            <Link to="/">Back to Home</Link>
          </footer>
        </aside>

        <main className="admin-shell-main">
          <div className="admin-shell-main-header">
            <div>
              <h2>{title}</h2>
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
            {actions ? <div>{actions}</div> : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
