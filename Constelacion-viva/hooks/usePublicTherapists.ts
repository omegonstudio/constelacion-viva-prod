"use client"

import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"

// Shape real del backend: GET /public/therapists
export type PublicTherapist = {
  user_id: number
  email: string
  display_name?: string | null
  bio?: string | null
}

export function usePublicTherapists() {
  const [data, setData] = useState<PublicTherapist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<PublicTherapist[]>("/public/therapists")
      setData(Array.isArray(res) ? res : [])
    } catch (err: any) {
      setError(err?.message || "Error al cargar terapeutas")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    fetchAll().catch(() => {})
    return () => {
      mounted = false
    }
  }, [fetchAll])

  return { data, loading, error, refetch: fetchAll }
}
