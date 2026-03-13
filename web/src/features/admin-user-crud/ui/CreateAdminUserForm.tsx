import { useState } from 'react'
import { createAdminUser } from '../../../shared/api/admin-user'
import type { AdminUser } from '../../../entities/admin-user/model/types'
import type { ApiError } from '../../../shared/api/client'

type Props = {
  onCreated: (user: AdminUser) => void
  onClose?: () => void
}

export function CreateAdminUserForm({ onCreated, onClose }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const user = await createAdminUser({ username, password })
      onCreated(user)
      setUsername('')
      setPassword('')
      if (onClose) onClose()
    } catch (err) {
      const apiErr = err as ApiError
      setError(apiErr.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text)]">새 Admin User 추가</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[var(--dim)] hover:text-[var(--text)]"
          >
            닫기
          </button>
        )}
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
          Password
          <input
            className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface2)] px-2 py-1 text-sm text-[var(--text)]"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            maxLength={72}
            required
          />
        </label>
      </div>
      {error && (
        <p className="text-xs text-[var(--red)]">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-3 py-1 rounded text-xs font-medium bg-[var(--blue)] text-white disabled:opacity-60"
        >
          {submitting ? '저장 중…' : '추가'}
        </button>
      </div>
    </form>
  )
}

