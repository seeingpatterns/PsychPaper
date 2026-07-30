import { useNavigate } from 'react-router-dom'
import AdminShell from '../features/admin-layout/ui/AdminShell'
import { logoutAdmin } from '../shared/api/admin-auth'
import { useState } from 'react'

export default function AdminArticlesPage() {
  const navigate = useNavigate()
  const [logoutLoading, setLogoutLoading] = useState(false)

  async function handleLogoutClick() {
    setLogoutLoading(true)
    try {
      await logoutAdmin()
    } catch {
      // keep flow simple
    } finally {
      window.localStorage.removeItem('pp_admin_username')
      setLogoutLoading(false)
      navigate('/admin/login', { replace: true })
    }
  }

  return (
    <AdminShell
      section="articles"
      title="Articles"
      subtitle="Manage article content"
      onLogout={handleLogoutClick}
      logoutDisabled={logoutLoading}
      actions={<button type="button" className="admin-primary-btn">New Article</button>}
    >
      <section className="admin-panel">
        <h3 style={{ marginTop: 0 }}>Article list</h3>
        <p>No articles found.</p>
      </section>
    </AdminShell>
  )
}
