import type { AdminUser } from '../../../entities/admin-user/model/types'
import { AdminUserRow } from '../../../entities/admin-user/ui/AdminUserRow'

type Props = {
  users: AdminUser[]
  onEdit: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
  loading: boolean
  error: string | null
}

export function AdminUserList({ users, onEdit, onDelete, loading, error }: Props) {
  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-center text-[var(--dim)] text-sm">
        로딩 중…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-center text-[var(--red)] text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface2)]">
            <th className="px-4 py-3 font-semibold text-[var(--dim)]">ID</th>
            <th className="px-4 py-3 font-semibold text-[var(--dim)]">Username</th>
            <th className="px-4 py-3 font-semibold text-[var(--dim)]">Created at</th>
            <th className="px-4 py-3 font-semibold text-right text-[var(--dim)]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <AdminUserRow
              key={u.id}
              user={u}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <p className="px-4 py-3 text-[var(--dim)] text-sm">
          등록된 관리자가 없습니다.
        </p>
      )}
    </div>
  )
}

