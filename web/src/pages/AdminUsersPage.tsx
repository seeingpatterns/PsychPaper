import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminUsers } from '../shared/api/admin-user'
import { getAdminMe, logoutAdmin } from '../shared/api/admin-auth'
import type { AdminUser } from '../entities/admin-user/model/types'
import type { ApiError } from '../shared/api/client'
import AdminShell from '../features/admin-layout/ui/AdminShell'

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadPage() {
      setLoading(true)
      setError(null)
      try {
        await getAdminMe()
        const list = await getAdminUsers()
        if (!active) return
        setUsers(list)
      } catch (err) {
        const apiErr = err as ApiError
        if (apiErr.status === 401) {
          navigate('/admin/login', { replace: true })
          return
        }
        if (apiErr.status === 403) {
          if (active) setError('Access denied')
          return
        }
        if (active) setError(apiErr.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadPage()
    return () => {
      active = false
    }
  }, [navigate])

  async function handleLogoutClick() {
    setLogoutLoading(true)
    setError(null)
    try {
      await logoutAdmin()
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.status !== 401) {
        setError(apiErr.message)
        setLogoutLoading(false)
        return
      }
    }
    window.localStorage.removeItem('pp_admin_username')
    setLogoutLoading(false)
    navigate('/admin/login', { replace: true })
  }

  return (
    <AdminShell
      section="users"
      title="Admin Users"
      subtitle="Manage administrator accounts"
      onLogout={handleLogoutClick}
      logoutDisabled={logoutLoading}
      actions={<button type="button" className="admin-primary-btn">Add Admin User</button>}
    >
      <section className="admin-panel">
        <h3 style={{ marginTop: 0 }}>Admin user list</h3>
        {loading && <p>Loading admin users...</p>}
        {!loading && error && <p>{error}</p>}
        {!loading && !error && users.length === 0 && <p>No admin users found.</p>}
        {!loading && !error && users.length > 0 && (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 0' }}>ID</th>
                <th style={{ padding: '8px 0' }}>Username</th>
                <th style={{ padding: '8px 0' }}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 0' }}>{user.id}</td>
                  <td style={{ padding: '8px 0' }}>{user.username}</td>
                  <td style={{ padding: '8px 0' }}>{new Date(user.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AdminShell>
  )
}
