import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAdminMe } from '../../../shared/api/admin-auth'
import type { ApiError } from '../../../shared/api/client'

type AdminProtectedRouteProps = {
  children: ReactNode
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    let active = true

    async function checkAdminSession() {
      try {
        await getAdminMe()
        if (!active) return
        setAuthenticated(true)
      } catch (err) {
        const apiErr = err as ApiError
        if (!active) return
        if (apiErr.status === 403) {
          setForbidden(true)
        } else {
          setAuthenticated(false)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void checkAdminSession()
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <main>Checking admin authentication...</main>
  }

  if (forbidden) {
    return <main>Access denied</main>
  }

  if (!authenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/admin/login?next=${next}`} replace />
  }

  return <>{children}</>
}
