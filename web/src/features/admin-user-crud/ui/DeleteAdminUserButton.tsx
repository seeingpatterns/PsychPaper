import { useState } from 'react'
import { deleteAdminUser } from '../../../shared/api/admin-user'
import type { ApiError } from '../../../shared/api/client'

type Props = {
  userId: number
  onDeleted: () => void
}

export function DeleteAdminUserButton({ userId, onDeleted }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    const confirmed = window.confirm('정말 이 Admin User를 삭제할까요?')
    if (!confirmed) return
    setError(null)
    setLoading(true)
    try {
      await deleteAdminUser(userId)
      onDeleted()
    } catch (err) {
      const apiErr = err as ApiError
      setError(apiErr.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="text-xs px-2 py-1 rounded border border-[var(--red)] text-[var(--red)] hover:bg-[color-mix(in_oklab,var(--red)_10%,transparent)] disabled:opacity-60"
      >
        {loading ? '삭제 중…' : '삭제'}
      </button>
      {error && (
        <p className="mt-1 text-[10px] text-[var(--red)] max-w-[160px] text-right">
          {error}
        </p>
      )}
    </div>
  )
}

