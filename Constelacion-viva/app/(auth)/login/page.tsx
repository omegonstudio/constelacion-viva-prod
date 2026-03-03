"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { login, fetchMe, logout, backendLogout } from "@/lib/auth"
import { getAccessToken, setAccessToken } from "@/lib/api"

type Role = "admin" | "super_admin" | "therapist" | "student" | string

function resolveRedirect(role: Role) {
  if (role === "admin" || role === "super_admin") return "/admin/dashboard"
  if (role === "therapist") return "/therapist/dashboard"
  if (role === "student") return "/student/dashboard"
  return "/"
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("admin@local.dev")
  const [password, setPassword] = useState("admin12345!")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetchMe = useCallback(async (accessToken: string) => {
    const me = await fetchMe(accessToken)
    const destination = resolveRedirect(me.role)
    router.push(destination)
  }, [router])

  useEffect(() => {
    const current = getAccessToken()
    if (current) {
      handleFetchMe(current).catch(() => {
        logout()
      })
    }
  }, [handleFetchMe])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await login(email, password)
      if (res.access_token) {
        setAccessToken(res.access_token)
        await handleFetchMe(res.access_token)
      }
    } catch (err) {
      setError((err as Error).message || "No se pudo iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 border border-white/10 rounded-xl p-6 bg-white/5 backdrop-blur">
        <h1 className="text-2xl font-semibold text-center">Iniciar sesión</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              className="w-full rounded-md px-3 py-2 bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input
              className="w-full rounded-md px-3 py-2 bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-md bg-orange-500 hover:bg-orange-400 text-white font-medium transition"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        {error && <div className="text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-md p-3">{error}</div>}

        <button
          onClick={() => {
            backendLogout().catch(() => null)
            logout()
          }}
          className="w-full py-2 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium transition"
        >
          Limpiar sesión
        </button>
      </div>
    </div>
  )
}

