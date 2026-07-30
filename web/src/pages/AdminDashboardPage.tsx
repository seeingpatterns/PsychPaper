import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminShell from '../features/admin-layout/ui/AdminShell'
import { getAdminMe, logoutAdmin } from '../shared/api/admin-auth'
import type { ApiError } from '../shared/api/client'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [sessionStatus, setSessionStatus] = useState('Checking...')
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true
    async function checkSession() {
      try {
        await getAdminMe()
        if (active) setSessionStatus('Authenticated admin session')
      } catch (err) {
        const apiErr = err as ApiError
        if (!active) return
        if (apiErr.status === 401) {
          setSessionStatus('Not logged in')
          navigate('/admin/login', { replace: true })
          return
        }
        if (apiErr.status === 403) {
          setSessionStatus('Access denied')
          return
        }
        setSessionStatus('Session check failed')
      }
    }
    void checkSession()
    return () => {
      active = false
    }
  }, [navigate])

  async function handleLogout() {
    setLogoutLoading(true)
    try {
      await logoutAdmin()
    } catch {
      // keep minimal: always move to login after logout attempt
    } finally {
      window.localStorage.removeItem('pp_admin_username')
      setLogoutLoading(false)
      navigate('/admin/login', { replace: true })
    }
  }

  return (
    <AdminShell
      section="dashboard"
      title="Admin Dashboard"
      subtitle="Minimal admin home for real management actions"
      onLogout={handleLogout}
      logoutDisabled={logoutLoading}
    >
      <section className="admin-grid">
        <article className="admin-cta">
          <h3>Manage Admin Users</h3>
          <p>Go to admin account management.</p>
          <Link to="/admin/users">Open Admin Users</Link>
        </article>
        <article className="admin-cta">
          <h3>Manage Articles</h3>
          <p>Go to article management.</p>
          <Link to="/admin/articles">Open Articles</Link>
        </article>
      </section>

      <section className="admin-panel" style={{ marginTop: '14px' }}>
        <h3 style={{ marginTop: 0 }}>Session Status</h3>
        <p>{sessionStatus}</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/admin/users">/admin/users</Link>
          <Link to="/admin/articles">/admin/articles</Link>
        </div>
      </section>
    </AdminShell>
  )
}
