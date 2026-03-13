import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminUserList } from '../features/admin-user-crud/ui/AdminUserList'
import { CreateAdminUserForm } from '../features/admin-user-crud/ui/CreateAdminUserForm'
import { EditAdminUserForm } from '../features/admin-user-crud/ui/EditAdminUserForm'
import { DeleteAdminUserButton } from '../features/admin-user-crud/ui/DeleteAdminUserButton'
import { getAdminUsers } from '../shared/api/admin-user'
import type { AdminUser } from '../entities/admin-user/model/types'
import type { ApiError } from '../shared/api/client'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const list = await getAdminUsers()
      setUsers(list)
    } catch (err) {
      const apiErr = err as ApiError
      setError(apiErr.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function handleCreated(user: AdminUser) {
    setUsers((prev) => [...prev, user].sort((a, b) => a.id - b.id))
  }

  function handleUpdated(user: AdminUser) {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)))
  }

  function handleDeleted(id: number) {
    setUsers((prev) => prev.filter((u) => u.id !== id))
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
          onDelete={(user) => {
            setEditing(null)
            handleDeleted(user.id)
          }}
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

        {users.map((u) => (
          <div
            key={u.id}
            className="hidden"
          >
            {/* for DeleteAdminUserButton tree-shaking avoid; actual button is in row via onDelete */}
            <DeleteAdminUserButton
              userId={u.id}
              onDeleted={() => handleDeleted(u.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

