"use client"

import { useEffect, useState } from "react"
import { fetchMe, logout as logoutHelper, MeResponse } from "@/lib/auth"
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
    const load = async () => {
      try {
        const me = await fetchMe("")
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

    load()
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

