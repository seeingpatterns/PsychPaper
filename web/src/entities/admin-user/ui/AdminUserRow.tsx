import type { AdminUser } from '../model/types'

type Props = {
  user: AdminUser
  onEdit?: (user: AdminUser) => void
  onDelete?: (user: AdminUser) => void
}

export function AdminUserRow({ user, onEdit, onDelete }: Props) {
  return (
    <tr className="border-b border-[var(--border)] last:border-b-0">
      <td className="px-4 py-3 font-mono text-[var(--dim)]">{user.id}</td>
      <td className="px-4 py-3">{user.username}</td>
      <td className="px-4 py-3 text-[var(--dim)]">
        {new Date(user.created_at).toLocaleString('ko-KR')}
      </td>
      <td className="px-4 py-3 text-right space-x-2">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(user)}
            className="text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface2)]"
          >
            수정
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(user)}
            className="text-xs px-2 py-1 rounded border border-[var(--red)] text-[var(--red)] hover:bg-[color-mix(in_oklab,var(--red)_10%,transparent)]"
          >
            삭제
          </button>
        )}
      </td>
    </tr>
  )
}

