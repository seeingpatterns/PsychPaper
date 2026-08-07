import { useState, type FormEvent } from 'react'
import type { AdminLoginInput } from '../../../shared/api/admin-auth'

type Props = {
  loading: boolean
  error: string | null
  onSubmit: (input: AdminLoginInput) => Promise<void>
}

export function AdminLoginForm({ loading, error, onSubmit }: Props) {
  const [form, setForm] = useState<AdminLoginInput>({ username: '', password: '' })

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await onSubmit(form)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3"
    >
      <p className="text-sm text-[var(--dim)]">
        관리자 로그인 후 AdminUser 관리 기능을 사용할 수 있습니다.
      </p>
      <div>
        <label className="block text-xs text-[var(--dim)] mb-1">아이디</label>
        <input
          value={form.username}
          onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
          className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label className="block text-xs text-[var(--dim)] mb-1">비밀번호</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          autoComplete="current-password"
          required
        />
      </div>
      {error && <p className="text-xs text-[var(--red)]">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="text-xs px-3 py-2 rounded bg-[var(--blue)] text-white disabled:opacity-60"
      >
        {loading ? '로그인 중…' : '로그인'}
      </button>
    </form>
  )
}
