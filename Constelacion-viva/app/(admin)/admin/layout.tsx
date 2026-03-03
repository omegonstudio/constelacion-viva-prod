"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { RoleGuard } from "@/components/RoleGuard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <RoleGuard roles={["admin", "super_admin"]}>{children}</RoleGuard>
    </AuthGuard>
  )
}

