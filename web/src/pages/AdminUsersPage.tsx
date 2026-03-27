import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AdminUserList } from '../features/admin-user-crud/ui/AdminUserList'
import { CreateAdminUserForm } from '../features/admin-user-crud/ui/CreateAdminUserForm'
import { EditAdminUserForm } from '../features/admin-user-crud/ui/EditAdminUserForm'
import { deleteAdminUser, getAdminUsers } from '../shared/api/admin-user'
import { getAdminMe, logoutAdmin } from '../shared/api/admin-auth'
import type { AdminUser } from '../entities/admin-user/model/types'
import type { ApiError } from '../shared/api/client'

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)

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

  function handleCreated(user: AdminUser) {
    setUsers((prev) => [...prev, user].sort((a, b) => a.id - b.id))
  }

  function handleUpdated(user: AdminUser) {
    setUsers((prev) => prev.map((item) => (item.id === user.id ? user : item)))
  }

  async function handleDeleteUser(user: AdminUser) {
    const confirmed = window.confirm('정말 이 Admin User를 삭제할까요?')
    if (!confirmed) return
    setEditing(null)
    setError(null)
    try {
      await deleteAdminUser(user.id)
      setUsers((prev) => prev.filter((item) => item.id !== user.id))
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.status === 401) {
        navigate('/admin/login', { replace: true })
        return
      }
      setError(apiErr.message)
    }
  }

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
    setLogoutLoading(false)
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6">
      <div className="max-w-3xl mx-auto">
        <nav className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="text-[var(--blue)] hover:underline text-sm"
          >
            ← PsychPaper 홈
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setShowCreate((prev) => !prev)
              }}
              className="text-xs px-3 py-1 rounded bg-[var(--blue)] text-white"
            >
              {showCreate ? '추가 폼 닫기' : '새 Admin User 추가'}
            </button>
            <button
              type="button"
              onClick={handleLogoutClick}
              disabled={logoutLoading}
              className="text-xs px-3 py-1 rounded border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface2)] disabled:opacity-60"
            >
              {logoutLoading ? '로그아웃 중…' : '로그아웃'}
            </button>
          </div>
        </nav>

        <h1 className="text-xl font-bold text-[var(--text)] mb-4">
          Admin User 관리
        </h1>

        <AdminUserList
          users={users}
          loading={loading}
          error={error}
          onEdit={(user) => {
            setShowCreate(false)
            setEditing(user)
          }}
          onDelete={handleDeleteUser}
        />

        {showCreate && (
          <CreateAdminUserForm
            onCreated={handleCreated}
            onClose={() => setShowCreate(false)}
          />
        )}

        {editing && (
          <EditAdminUserForm
            user={editing}
            onUpdated={handleUpdated}
            onCancel={() => setEditing(null)}
          />
        )}

        {!loading && !error && users.length > 0 && (
          <div className="mt-4 text-[var(--dim)] text-xs">
            행의 삭제 버튼을 누르면 확인 후 즉시 삭제됩니다.
          </div>
        )}
      </div>
    </div>
  )
}
