import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AdminLoginForm } from '../features/auth/ui/AdminLoginForm'
import { getAdminMe, loginAdmin, type AdminLoginInput } from '../shared/api/admin-auth'
import type { ApiError } from '../shared/api/client'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function checkSession() {
      try {
        await getAdminMe()
        if (active) navigate('/admin/users', { replace: true })
      } catch (err) {
        const apiErr = err as ApiError
        if (apiErr.status !== 401 && active) {
          setPageError(apiErr.message)
        }
      } finally {
        if (active) setChecking(false)
      }
    }

    void checkSession()
    return () => {
      active = false
    }
  }, [navigate])

  async function handleLogin(input: AdminLoginInput) {
    setLoginError(null)
    setLoginLoading(true)
    try {
      await loginAdmin(input)
      navigate('/admin/users', { replace: true })
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.status === 401) {
        setLoginError('아이디 또는 비밀번호가 맞지 않습니다.')
      } else {
        setLoginError(apiErr.message)
      }
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6">
      <div className="max-w-xl mx-auto">
        <nav className="mb-8">
          <Link
            to="/"
            className="text-[var(--blue)] hover:underline text-sm"
          >
            ← PsychPaper 홈
          </Link>
        </nav>

        <h1 className="text-xl font-bold text-[var(--text)] mb-4">
          Admin 로그인
        </h1>

        {checking && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--dim)]">
            인증 상태 확인 중…
          </div>
        )}

        {!checking && pageError && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--red)]">
            {pageError}
          </div>
        )}

        {!checking && !pageError && (
          <AdminLoginForm
            loading={loginLoading}
            error={loginError}
            onSubmit={handleLogin}
          />
        )}
      </div>
    </div>
  )
}
