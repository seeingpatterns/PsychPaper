import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminUserList } from '../features/admin-user-crud/ui/AdminUserList'
import { CreateAdminUserForm } from '../features/admin-user-crud/ui/CreateAdminUserForm'
import { EditAdminUserForm } from '../features/admin-user-crud/ui/EditAdminUserForm'
import { useAdminAuth } from '../features/auth/model/useAdminAuth'
import { AdminLoginForm } from '../features/auth/ui/AdminLoginForm'
import { deleteAdminUser } from '../shared/api/admin-user'
import type { AdminUser } from '../entities/admin-user/model/types'
import type { ApiError } from '../shared/api/client'

export default function AdminUsersPage() {
  const {
    users,
    upsertUser,
    removeUser,
    isAuthenticated,
    loading,
    error,
    setError,
    loginLoading,
    loginError,
    logoutLoading,
    login,
    logout,
  } = useAdminAuth()

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)

  function handleCreated(user: AdminUser) {
    upsertUser(user)
  }

  function handleUpdated(user: AdminUser) {
    upsertUser(user)
  }

  async function handleDeleteUser(user: AdminUser) {
    const confirmed = window.confirm('정말 이 Admin User를 삭제할까요?')
    if (!confirmed) return
    setEditing(null)
    setError(null)
    try {
      await deleteAdminUser(user.id)
      removeUser(user.id)
    } catch (err) {
      const apiErr = err as ApiError
      setError(apiErr.message)
    }
  }

  async function handleLogoutClick() {
    await logout()
    setShowCreate(false)
    setEditing(null)
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
            {isAuthenticated && (
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
            )}
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogoutClick}
                disabled={logoutLoading}
                className="text-xs px-3 py-1 rounded border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface2)] disabled:opacity-60"
              >
                {logoutLoading ? '로그아웃 중…' : '로그아웃'}
              </button>
            )}
          </div>
        </nav>

        <h1 className="text-xl font-bold text-[var(--text)] mb-4">
          Admin User 관리
        </h1>

        {!isAuthenticated && !loading && (
          <AdminLoginForm
            loading={loginLoading}
            error={loginError}
            onSubmit={login}
          />
        )}

        {isAuthenticated && (
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
        )}

        {isAuthenticated && showCreate && (
          <CreateAdminUserForm
            onCreated={handleCreated}
            onClose={() => setShowCreate(false)}
          />
        )}

        {isAuthenticated && editing && (
          <EditAdminUserForm
            user={editing}
            onUpdated={handleUpdated}
            onCancel={() => setEditing(null)}
          />
        )}

        {isAuthenticated && !loading && !error && users.length > 0 && (
          <div className="mt-4 text-[var(--dim)] text-xs">
            행의 삭제 버튼을 누르면 확인 후 즉시 삭제됩니다.
          </div>
        )}
      </div>
    </div>
  )
}
