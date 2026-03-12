const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

let accessToken: string | null = null

// ---------------------------------------------------------------------------
// Token management — persisted in sessionStorage so reloads preserve the
// session, but the token is cleared when the tab/browser closes.
// ---------------------------------------------------------------------------

export function setAccessToken(token: string | null) {
  accessToken = token

  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem("access_token", token)
    } else {
      sessionStorage.removeItem("access_token")
    }
  }
}

export function clearAccessToken() {
  setAccessToken(null)
}

export function getAccessToken(): string | null {
  // Hydrate from sessionStorage on first access after a page reload.
  if (!accessToken && typeof window !== "undefined") {
    accessToken = sessionStorage.getItem("access_token")
  }
  return accessToken
}

// ---------------------------------------------------------------------------
// Internal: request a new access token using the refresh_token httpOnly cookie.
// ---------------------------------------------------------------------------

async function refreshAccessToken(): Promise<string> {
  if (!API_BASE_URL) throw new Error("NEXT_PUBLIC_API_URL no está definido")

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.access_token) {
    clearAccessToken()
    throw new Error(data.detail || "No se pudo refrescar el token")
  }

  setAccessToken(data.access_token)
  return data.access_token
}

// ---------------------------------------------------------------------------
// apiFetch — authenticated fetch wrapper with automatic token refresh.
// ---------------------------------------------------------------------------

type ApiOptions = RequestInit & { skipJson?: boolean }

export async function apiFetch<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL no está definido")
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`

  // doFetch is called with an explicit token so that the retry after refresh
  // always uses the freshly obtained token instead of a stale captured value.
  const doFetch = async (token?: string | null) => {
    const currentToken = token ?? getAccessToken()

    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined ?? {}),
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    }

    return fetch(url, {
      ...options,
      headers: reqHeaders,
      credentials: "include",
    })
  }

  let response = await doFetch(getAccessToken())

  if (response.status === 401) {
    // Token missing or expired — attempt a silent refresh using the
    // httpOnly refresh_token cookie, then retry the original request once.
    try {
      const newToken = await refreshAccessToken()
      response = await doFetch(newToken)
    } catch (err) {
      // Refresh failed (cookie missing/expired) — propagate so callers can
      // redirect to login.
      throw err
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const errorBody = await response.json()
      message = errorBody.detail || message
    } catch {
      // ignore JSON parse errors
    }
    const error = new Error(message)
    ;(error as any).status = response.status
    throw error
  }

  if (options.skipJson) return undefined as T
  return (await response.json()) as T
}

export { API_BASE_URL }
