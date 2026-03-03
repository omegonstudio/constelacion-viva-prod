 "use client"

import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"

export type AdminTherapistMembershipStatus = "active" | "pending" | "inactive"
export type AdminTherapistPaymentStatus = "paid" | "pending" | "overdue" | "na"

export type AdminTherapistListItem = {
  id: number
  full_name: string
  email: string
  role: string
  membership_status: AdminTherapistMembershipStatus
  payment_status: AdminTherapistPaymentStatus
  grace_until?: string | null
  current_period_end?: string | null
}

export function useAdminTherapists() {
  const [data, setData] = useState<AdminTherapistListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await apiFetch<AdminTherapistListItem[]>("/admin/therapists")
      setData(Array.isArray(resp) ? resp : [])
    } catch (err: any) {
      setError(err?.message || "No se pudo cargar el listado de terapeutas.")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { data, loading, error, refetch: fetchAll }
}


