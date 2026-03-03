"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { RoleGuard } from "@/components/RoleGuard"

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <RoleGuard roles={["therapist", "admin", "super_admin"]}>{children}</RoleGuard>
    </AuthGuard>
  )
}

