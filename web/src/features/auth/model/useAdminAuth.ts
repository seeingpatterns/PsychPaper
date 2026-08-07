import { useCallback, useEffect, useState } from 'react'
import type { AdminUser } from '../../../entities/admin-user/model/types'
import { getAdminUsers } from '../../../shared/api/admin-user'
import { loginAdmin, logoutAdmin, type AdminLoginInput } from '../../../shared/api/admin-auth'
import type { ApiError } from '../../../shared/api/client'

/**
 * 세션 쿠키 기반 관리자 인증 상태.
 * 서버가 401을 주면 비인증으로 전환한다(프론트만 믿지 않음).
 */
export function useAdminAuth() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getAdminUsers()
      setUsers(list)
      setIsAuthenticated(true)
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.status === 401) {
        setIsAuthenticated(false)
        setUsers([])
      } else {
        setError(apiErr.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const login = useCallback(
    async (input: AdminLoginInput) => {
      setLoginError(null)
      setLoginLoading(true)
      try {
        await loginAdmin(input)
        await loadUsers()
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
    },
    [loadUsers]
  )

  const logout = useCallback(async () => {
    setLogoutLoading(true)
    setError(null)
    try {
      await logoutAdmin()
    } catch {
      // 서버 세션이 이미 없더라도 프론트 상태는 로그아웃으로 전환
    } finally {
      setIsAuthenticated(false)
      setUsers([])
      setLogoutLoading(false)
    }
  }, [])

  /** 생성·수정 후 목록을 서버 응답과 맞추기(동일 id면 교체, 없으면 추가 후 id 정렬) */
  const upsertUser = useCallback((user: AdminUser) => {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === user.id)
      if (idx === -1) {
        return [...prev, user].sort((a, b) => a.id - b.id)
      }
      const next = [...prev]
      next[idx] = user
      return next
    })
  }, [])

  const removeUser = useCallback((id: number) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }, [])

  return {
    users,
    upsertUser,
    removeUser,
    isAuthenticated,
    loading,
    error,
    setError,
    loginLoading,
    loginError,
    logoutLoading,
    login,
    logout,
    refreshUsers: loadUsers,
  }
}
