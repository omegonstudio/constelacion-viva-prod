"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { useAuth } from "@/lib/useAuth"
import { RoleGuard } from "@/components/RoleGuard"

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}

function DashboardContent() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-4 border border-white/10 rounded-xl p-6 bg-white/5 backdrop-blur">
        <h1 className="text-2xl font-semibold">Dashboard (DEV)</h1>
        {user ? (
          <div className="space-y-2">
            <div>Email: {user.email}</div>
            <div>ID: {user.id}</div>
            <div>Rol: {user.role}</div>
            <div className="text-sm text-white/80">
              Permisos: {user.permissions?.length ? user.permissions.join(", ") : "N/A"}
            </div>
          </div>
        ) : (
          <div className="text-white/70">No hay usuario cargado.</div>
        )}
        <button
          onClick={logout}
          className="w-full py-2 rounded-md bg-orange-500 hover:bg-orange-400 text-white font-medium transition"
        >
          Logout
        </button>

        <div className="pt-4 border-t border-white/10 space-y-3">
          <h2 className="text-xl font-semibold">Admin panel</h2>
          <RoleGuard roles={["admin", "super_admin"]}>
            <div className="bg-white/5 border border-white/10 rounded-md p-3 text-sm text-white/80">
              Contenido visible solo para admin/super_admin.
            </div>
          </RoleGuard>
        </div>
      </div>
    </div>
  )
}

