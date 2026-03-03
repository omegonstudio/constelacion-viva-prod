"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { RoleGuard } from "@/components/RoleGuard"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <RoleGuard roles={["student", "admin", "super_admin"]}>{children}</RoleGuard>
    </AuthGuard>
  )
}

