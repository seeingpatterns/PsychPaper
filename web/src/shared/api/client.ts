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
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
      ...options,
    })
  } catch {
    // 오프라인·서버 다운 등 네트워크 실패 — TypeError("Failed to fetch")를
    // 화면에 그대로 흘리지 않고 다른 API 오류와 같은 모양(ApiError)으로 정규화한다
    const error: ApiError = {
      status: 0,
      code: 'NETWORK_ERROR',
      message: '네트워크 연결을 확인한 뒤 다시 시도해주세요.',
    }
    throw error
  }

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

