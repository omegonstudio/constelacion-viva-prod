import { API_BASE_URL, setAccessToken, clearAccessToken, apiFetch } from "@/lib/api"

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type?: string
}


export interface MeResponse {
  id: number
  email: string
  role: string
  permissions: string[]
}

export function logout() {
  clearAccessToken()
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  if (!API_BASE_URL) throw new Error("NEXT_PUBLIC_API_URL no está definido")

  const response = await fetch(`${API_BASE_URL}/auth/login?tenant_id=1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || "Credenciales inválidas")
  }

  if (data.access_token) {
    setAccessToken(data.access_token)
  }

  return data as LoginResponse
}

export async function fetchMe(): Promise<MeResponse> {
  // apiFetch injects the Authorization header automatically via getAccessToken()
  // and will trigger the refresh flow on 401 if the cookie is present.
  return apiFetch<MeResponse>("/auth/me")
}

export async function backendLogout() {
  if (!API_BASE_URL) throw new Error("NEXT_PUBLIC_API_URL no está definido")
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  })
  clearAccessToken()
}

/**
 * Attempt to restore a session silently using the httpOnly refresh_token cookie.
 *
 * Called on app boot when no access token is present in memory or sessionStorage
 * (e.g. browser was closed and reopened). Returns true and stores the new
 * access token if the cookie is still valid; returns false otherwise.
 *
 * Does NOT throw — callers can treat a false return as "no session available".
 */
export async function bootstrapSession(): Promise<boolean> {
  if (!API_BASE_URL) return false

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })

    if (!res.ok) return false

    const data = await res.json()

    if (data?.access_token) {
      setAccessToken(data.access_token)
      return true
    }

    return false
  } catch {
    return false
  }
}

