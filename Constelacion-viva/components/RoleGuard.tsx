"use client"

import { useAuth } from "@/lib/useAuth"

interface RoleGuardProps {
  roles: string[]
  children: React.ReactNode
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const { hasRole } = useAuth()
  const allowed = roles.some((role) => hasRole(role))

  if (!allowed) {
    return <div className="text-white/80 bg-red-500/10 border border-red-500/30 rounded-md p-3">No autorizado</div>
  }

  return <>{children}</>
}

