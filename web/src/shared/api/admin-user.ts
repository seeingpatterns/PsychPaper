import { apiFetch } from './client'

export type AdminUser = {
  id: number
  username: string
  created_at: string
}

export type AdminUserCreateInput = {
  username: string
  password: string
}

export type AdminUserUpdateInput = {
  username?: string
  password?: string
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const data = await apiFetch<{ users: AdminUser[] }>('/admin/users', {
    method: 'GET',
  })
  return data.users
}

export async function getAdminUser(id: number): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${id}`, { method: 'GET' })
}

export async function createAdminUser(
  input: AdminUserCreateInput
): Promise<AdminUser> {
  return apiFetch<AdminUser>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateAdminUser(
  id: number,
  input: AdminUserUpdateInput
): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteAdminUser(id: number): Promise<void> {
  await apiFetch<unknown>(`/admin/users/${id}`, {
    method: 'DELETE',
  })
}

