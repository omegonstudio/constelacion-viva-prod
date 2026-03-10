import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"

export type GalleryCategory = "eventos" | "terapeutas"
export type GalleryType = "image" | "video"

export interface GalleryItem {
  id: number
  title: string
  type: GalleryType
  category: GalleryCategory
  src: string
  videoSrc?: string | null
}

let cachedGallery: GalleryItem[] | null = null

export function useGallery() {
  const [data, setData] = useState<GalleryItem[] | null>(cachedGallery)
  const [loading, setLoading] = useState(!cachedGallery)
  const [error, setError] = useState<Error | null>(null)

  /* ---------- GET ---------- */
  const fetchGallery = async () => {
    const response = await apiFetch<any[]>("/public/gallery")
    return response.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      category: item.category,
      src: item.src,
      videoSrc: item.video_src ?? null,
    }))
  }

  useEffect(() => {
    if (cachedGallery) return

    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const mapped = await fetchGallery()
        if (!cancelled) {
          cachedGallery = mapped
          setData(mapped)
        }
      } catch (err) {
        if (!cancelled) setError(err as Error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const refetch = async () => {
    cachedGallery = null
    setLoading(true)
    try {
      const mapped = await fetchGallery()
      cachedGallery = mapped
      setData(mapped)
    } finally {
      setLoading(false)
    }
  }

  /* ---------- CREATE ---------- */
  const createItem = async ({
    title,
    type,
    category,
    file,
  }: {
    title: string
    type: GalleryType
    category: GalleryCategory
    file: File
  }) => {
    // 1. pedir presigned
    const presign = await apiFetch<{
      uploadUrl: string
      objectKey: string
      publicUrl: string
    }>("/admin/gallery/presign", {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
      }),
    })

    // 2. subir a S3
    const uploadResponse = await fetch(presign.uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
        "x-amz-acl": "public-read",
      }
    })
    if (!uploadResponse.ok) {
      throw new Error(`Error subiendo a S3 (status ${uploadResponse.status})`)
    }

    // 3. guardar en DB
    await apiFetch("/admin/gallery", {
      method: "POST",
      body: JSON.stringify({
        title,
        type,
        category,
        src: presign.publicUrl,
      }),
    })

    await refetch()
  }

  /* ---------- UPDATE ---------- */
  const updateItem = async (
    id: number,
    payload: { title?: string; category?: GalleryCategory },
  ) => {
    await apiFetch(`/admin/gallery/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    await refetch()
  }

  /* ---------- DELETE ---------- */
  const deleteItem = async (id: number) => {
    await apiFetch(`/admin/gallery/${id}`, {
      method: "DELETE",
    })
    await refetch()
  }

  return {
    data,
    loading,
    error,
    refetch,
    createItem,
    updateItem,
    deleteItem,
  }
}
