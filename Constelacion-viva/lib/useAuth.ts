"use client"

import { useEffect, useState } from "react"
import { fetchMe, logout as logoutHelper, bootstrapSession, MeResponse } from "@/lib/auth"
import { getAccessToken } from "@/lib/api"

interface UseAuthResult {
  user: MeResponse | null
  loading: boolean
  isAuthenticated: boolean
  logout: () => void
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function initAuth() {
      try {
        const token = getAccessToken()

        if (!token) {
          // No token in memory or sessionStorage (e.g. browser was closed and
          // reopened). Attempt a silent refresh using the httpOnly cookie before
          // making any authenticated request.
          const refreshed = await bootstrapSession()
          if (!refreshed) throw new Error("No session")
        }

        const me = await fetchMe()

        if (!cancelled) {
          setUser(me)
        }
      } catch {
        if (!cancelled) {
          logoutHelper()
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    initAuth()
    return () => {
      cancelled = true
    }
  }, [])

  const logout = () => {
    logoutHelper()
    setUser(null)
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    hasRole: (role: string) => (user?.role ?? "").toLowerCase() === role.toLowerCase(),
    hasPermission: (permission: string) => {
      if (!user?.permissions) return false
      if (user.permissions.includes("*")) return true
      return user.permissions.includes(permission)
    },
  }
}

