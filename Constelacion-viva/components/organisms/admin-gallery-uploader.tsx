"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAccessToken } from "@/lib/api"
import { toast } from "sonner"

interface AdminGalleryUploaderProps {
  onUploaded: () => void
}

export function AdminGalleryUploader({ onUploaded }: AdminGalleryUploaderProps) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [type, setType] = useState<"image" | "video" | "">("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (!file || !title || !category || !type) {
      toast.error("Completa todos los campos y selecciona un archivo.")
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title)
      formData.append("type", type)
      formData.append("category", category)

      const token = getAccessToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/media`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.detail || "No se pudo subir el archivo")
      }

      toast.success("Archivo subido correctamente")
      setTitle("")
      setCategory("")
      setType("")
      setFile(null)
      onUploaded()
    } catch (err) {
      toast.error((err as Error).message || "Error al subir")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm text-white/80">Título</label>
        <Input value={title} disabled={loading} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-white/80">Categoría</label>
        <Input value={category} disabled={loading} onChange={(e) => setCategory(e.target.value)} placeholder="eventos / terapeutas / ..." />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-white/80">Tipo</label>
        <Select
          value={type}
          onValueChange={(v) => setType(v as "image" | "video")}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Imagen</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-sm text-white/80">Archivo</label>
        <Input
          type="file"
          disabled={loading}
          accept="image/*,video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Subiendo..." : "Subir"}
      </Button>
    </form>
  )
}

