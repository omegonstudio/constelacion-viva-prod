const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function clearAccessToken() {
  accessToken = null
}

export function getAccessToken() {
  return accessToken
}

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

type ApiOptions = RequestInit & { skipJson?: boolean }

export async function apiFetch<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL no está definido")
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  const doFetch = async () =>
    fetch(url, {
      ...options,
      headers,
      credentials: "include",   
    })

  let response = await doFetch()

  if (!response.ok) {
    // If unauthorized, try refresh once
    if (response.status === 401) {
      try {
        await refreshAccessToken()
        response = await doFetch()
      } catch (err) {
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
  }

  if (options.skipJson) return undefined as T
  return (await response.json()) as T
}

export { API_BASE_URL }


