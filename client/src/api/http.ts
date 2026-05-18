// Thin fetch wrapper that attaches the JWT bearer token and unwraps JSON.
// Used by every typed API module under client/src/api/.

const TOKEN_KEY = 'gcs.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  payload: unknown
  constructor(status: number, payload: unknown, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export interface RequestOptions extends RequestInit {
  /** Abort the request after this many ms. Default: 5000. */
  timeoutMs?: number
  /** Set false to skip the Authorization header (e.g. login/register). */
  auth?: boolean
}

export async function request<T>(
  path: string,
  { timeoutMs = 5000, auth = true, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string> | undefined),
  }
  if (auth) {
    const token = getToken()
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(path, { ...init, headers: finalHeaders, signal: controller.signal })
    const body = await res.text()
    const parsed = body ? safeJson(body) : null
    if (!res.ok) {
      const msg =
        (parsed && typeof parsed === 'object' && 'error' in parsed
          ? String((parsed as { error: unknown }).error)
          : null) ?? `Request failed with status ${res.status}`
      throw new ApiError(res.status, parsed, msg)
    }
    return parsed as T
  } finally {
    clearTimeout(timer)
  }
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    return s
  }
}
