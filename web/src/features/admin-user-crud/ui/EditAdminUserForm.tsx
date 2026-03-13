import { useState } from 'react'
import { updateAdminUser } from '../../../shared/api/admin-user'
import type { AdminUser } from '../../../entities/admin-user/model/types'
import type { ApiError } from '../../../shared/api/client'

type Props = {
  user: AdminUser
  onUpdated: (user: AdminUser) => void
  onCancel: () => void
}

export function EditAdminUserForm({ user, onUpdated, onCancel }: Props) {
  const [username, setUsername] = useState(user.username)
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const updated = await updateAdminUser(user.id, {
        username: username !== user.username ? username : undefined,
        password: password || undefined,
      })
      onUpdated(updated)
    } catch (err) {
      const apiErr = err as ApiError
      setError(apiErr.message)
      setSubmitting(false)
      return
    }
    onCancel()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text)]">
          Admin User 수정 (ID {user.id})
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-[var(--dim)] hover:text-[var(--text)]"
        >
          닫기
        </button>
      </div>
      <div className="space-y-2">
        <label className="block text-xs text-[var(--dim)]">
          Username
          <input
            className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface2)] px-2 py-1 text-sm text-[var(--text)]"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={50}
            required
          />
        </label>
        <label className="block text-xs text-[var(--dim)]">
          Password (변경 시에만 입력)
          <input
            className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface2)] px-2 py-1 text-sm text-[var(--text)]"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={0}
            maxLength={72}
          />
        </label>
      </div>
      {error && (
        <p className="text-xs text-[var(--red)]">
          {error}
        </p>
      )}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 rounded text-xs border border-[var(--border)] text-[var(--dim)] hover:bg-[var(--surface2)]"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-3 py-1 rounded text-xs font-medium bg-[var(--blue)] text-white disabled:opacity-60"
        >
          {submitting ? '저장 중…' : '저장'}
        </button>
      </div>
    </form>
  )
}

