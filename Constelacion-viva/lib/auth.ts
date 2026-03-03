import { API_BASE_URL, setAccessToken, clearAccessToken, apiFetch, getAccessToken } from "@/lib/api"

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

export async function fetchMe(token: string): Promise<MeResponse> {
  const current = token || getAccessToken()
  if (!current) {
    throw new Error("No hay token disponible")
  }
  return apiFetch<MeResponse>("/auth/me", { headers: { Authorization: `Bearer ${current}` } })
}

export async function backendLogout() {
  if (!API_BASE_URL) throw new Error("NEXT_PUBLIC_API_URL no está definido")
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  })
  clearAccessToken()
}

