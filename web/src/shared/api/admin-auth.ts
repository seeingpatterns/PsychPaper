import { apiFetch } from './client'

export type AdminLoginInput = {
  username: string
  password: string
}

export type AdminLoginResponse = {
  ok: boolean
}

export async function loginAdmin(input: AdminLoginInput): Promise<AdminLoginResponse> {
  return apiFetch<AdminLoginResponse>('/admin/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function logoutAdmin(): Promise<void> {
  await apiFetch<unknown>('/admin/logout', {
    method: 'POST',
  })
}
