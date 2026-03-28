import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAdminMe, loginAdmin, type AdminLoginInput } from '../shared/api/admin-auth'
import type { ApiError } from '../shared/api/client'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [form, setForm] = useState<AdminLoginInput>({ username: '', password: '' })
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await handleLogin(form)
  }

  return (
    <div className="admin-login-page min-h-screen bg-[var(--bg)] text-[var(--text)] p-6">
      <div className="admin-login-wrap max-w-xl mx-auto">
        <nav className="mb-6">
          <Link
            to="/"
            className="text-[var(--blue)] hover:underline text-sm"
          >
            ← PsychPaper 홈
          </Link>
        </nav>

        <div className="admin-login-rotator">
          <div className="admin-login-card">
            <div className="admin-avatar" aria-hidden="true">👤</div>
            <h1 className="admin-login-title">Admin 로그인</h1>
            <p className="admin-login-subtitle">PsychPaper 관리 기능에 접근합니다.</p>

            {checking && (
              <div className="admin-login-info">인증 상태 확인 중…</div>
            )}

            {!checking && pageError && (
              <div className="admin-login-error">{pageError}</div>
            )}

            {!checking && !pageError && (
              <form onSubmit={handleSubmit} className="admin-login-form">
                <label className="admin-input-wrap" htmlFor="admin-username">
                  <span className="admin-input-icon" aria-hidden="true">👤</span>
                  <input
                    id="admin-username"
                    value={form.username}
                    onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                    className="admin-neumorph-input"
                    placeholder="username"
                    autoComplete="username"
                    required
                  />
                </label>

                <label className="admin-input-wrap" htmlFor="admin-password">
                  <span className="admin-input-icon" aria-hidden="true">🔒</span>
                  <input
                    id="admin-password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="admin-neumorph-input"
                    placeholder="password"
                    autoComplete="current-password"
                    required
                  />
                </label>

                {loginError && <p className="admin-login-error">{loginError}</p>}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="admin-login-btn"
                >
                  {loginLoading ? '로그인 중…' : 'Login'}
                </button>

                <div className="admin-login-options">
                  <button
                    type="button"
                    disabled
                    className="admin-option-disabled"
                    title="아직 준비 중인 기능입니다."
                  >
                    Forgot password
                  </button>
                  <span aria-hidden="true">or</span>
                  <button
                    type="button"
                    disabled
                    className="admin-option-disabled"
                    title="Admin 회원가입은 내부에서만 생성합니다."
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
