export type ApiError = {
  status: number
  code: string
  message: string
}

async function parseJsonOrNull(res: Response): Promise<unknown | null> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  const data = await parseJsonOrNull(res)

  if (!res.ok) {
    const errorBody = (data ?? {}) as { code?: string; message?: string }
    const error: ApiError = {
      status: res.status,
      code: errorBody.code ?? 'UNKNOWN_ERROR',
      message: errorBody.message ?? '요청 처리 중 오류가 발생했습니다.',
    }
    throw error
  }

  return data as T
}

