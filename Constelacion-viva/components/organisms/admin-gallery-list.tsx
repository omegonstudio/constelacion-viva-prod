"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/atoms/button"
import { ConfirmDeleteDialog } from "@/components/molecules/confirm-delete-dialog"
import { apiFetch, getAccessToken } from "@/lib/api"
import { toast } from "sonner"

interface MediaItem {
  id: number
  title: string
  type: "image" | "video"
  category: string
  public_url: string
  storage_key: string
  created_at: string
}

interface AdminGalleryListProps {
  refreshSignal?: number
  onDeleted?: () => void
}

export function AdminGalleryList({ refreshSignal, onDeleted }: AdminGalleryListProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fetchInFlightRef = useRef(false)

  const fetchItems = useCallback(async () => {
    if (fetchInFlightRef.current) return
    fetchInFlightRef.current = true
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<MediaItem[]>("/gallery")
      setItems(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
      fetchInFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems, refreshSignal])

  const handleConfirmDelete = async () => {
    if (!deleteId) return
    if (deleting) return
    setDeleting(true)
    try {
      const token = getAccessToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/media/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (res.status === 204) {
        toast.success("Archivo eliminado")
        setConfirmOpen(false)
        setDeleteId(null)
        fetchItems()
        onDeleted?.()
        return
      }

      if (res.status === 403) {
        throw new Error("No autorizado")
      }

      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail || "No se pudo eliminar")
    } catch (err) {
      toast.error((err as Error).message || "Error al eliminar")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Archivos subidos</h2>
        <Button variant="secondary" onClick={fetchItems} disabled={loading || deleting}>
          Refrescar
        </Button>
      </div>
      {loading && <div className="text-white/70 text-sm">Cargando...</div>}
      {error && <div className="text-red-200 text-sm">{error}</div>}
      {!loading && items.length === 0 && <div className="text-white/70 text-sm">No hay archivos aún.</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="p-3 border border-white/10 rounded-lg bg-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <div className="font-semibold">{item.title}</div>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={() => {
                  setDeleteId(item.id)
                  setConfirmOpen(true)
                }}
              >
                Eliminar
              </Button>
            </div>
            <div className="text-xs text-white/60">
              {item.type} • {item.category}
            </div>
            <div className="aspect-video relative overflow-hidden rounded-md bg-black/30">
              {item.type === "image" ? (
                <Image src={item.public_url} alt={item.title} fill className="object-cover" />
              ) : (
                <video src={item.public_url} controls className="w-full h-full object-cover" />
              )}
            </div>
            <div className="text-xs break-all text-white/60">{item.public_url}</div>
          </div>
        ))}
      </div>

      <ConfirmDeleteDialog
        open={confirmOpen}
        onCancel={() => {
          if (deleting) return
          setConfirmOpen(false)
          setDeleteId(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar archivo"
        description="Esta acción eliminará el archivo de la galería."
        loading={deleting}
      />
    </div>
  )
}

