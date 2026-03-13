import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type AdminUser = {
  id: number
  username: string
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => {
        if (!res.ok) throw new Error('목록을 불러오지 못했습니다.')
        return res.json()
      })
      .then((data: { users: AdminUser[] }) => setUsers(data.users))
      .catch((err) => setError(err instanceof Error ? err.message : '오류가 발생했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6">
        <div className="max-w-2xl mx-auto py-12 text-center text-[var(--dim)]">
          로딩 중…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6">
        <div className="max-w-2xl mx-auto py-12 text-center text-[var(--accent)]">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6">
      <div className="max-w-2xl mx-auto">
        <nav className="mb-8">
          <Link
            to="/"
            className="text-[var(--blue)] hover:underline text-sm"
          >
            ← PsychPaper 홈
          </Link>
        </nav>

        <h1 className="text-xl font-bold text-[var(--text)] mb-6">
          Admin User
        </h1>

        <div className="rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface2)]">
                <th className="px-4 py-3 font-semibold text-[var(--dim)]">ID</th>
                <th className="px-4 py-3 font-semibold text-[var(--dim)]">Username</th>
                <th className="px-4 py-3 font-semibold text-[var(--dim)]">Created at</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[var(--border)] last:border-b-0"
                >
                  <td className="px-4 py-3 font-mono text-[var(--dim)]">{u.id}</td>
                  <td className="px-4 py-3">{u.username}</td>
                  <td className="px-4 py-3 text-[var(--dim)]">
                    {new Date(u.created_at).toLocaleString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <p className="mt-4 text-[var(--dim)] text-sm">등록된 관리자가 없습니다.</p>
        )}
      </div>
    </div>
  )
}
