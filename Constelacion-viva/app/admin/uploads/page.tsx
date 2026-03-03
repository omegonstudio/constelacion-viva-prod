"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { RoleGuard } from "@/components/RoleGuard"
import { apiFetch, getAccessToken } from "@/lib/api"
import { useAuth } from "@/lib/useAuth"

interface UploadItem {
  id: number
  filename: string
  url: string
  content_type?: string
  created_at: string
}

export default function AdminUploadsPage() {
  return (
    <AuthGuard>
      <RoleGuard roles={["admin", "super_admin"]}>
        <UploadsContent />
      </RoleGuard>
    </AuthGuard>
  )
}

function UploadsContent() {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadUploads = async () => {
    try {
      const data = await apiFetch<UploadItem[]>("/admin/uploads")
      setUploads(data)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  useEffect(() => {
    loadUploads()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Selecciona un archivo")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const token = getAccessToken()
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/uploads`, {
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
      setFile(null)
      await loadUploads()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="border border-white/10 rounded-xl p-6 bg-white/5 backdrop-blur space-y-4">
          <h1 className="text-2xl font-semibold">Uploads (DEV)</h1>
          <p className="text-sm text-white/70">Subida simple a LocalStack S3 (solo dev).</p>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-orange-500 hover:bg-orange-400 text-white font-medium"
            >
              {loading ? "Subiendo..." : "Subir"}
            </button>
          </form>
          {error && <div className="text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-md p-3">{error}</div>}
          <div className="space-y-2">
            <div className="font-semibold text-lg">Uploads</div>
            {uploads.length === 0 && <div className="text-white/70 text-sm">No hay archivos aún.</div>}
            <ul className="space-y-2">
              {uploads.map((u) => (
                <li key={u.id} className="p-3 border border-white/10 rounded-md bg-white/5 text-sm">
                  <div className="font-medium">{u.filename}</div>
                  <div className="text-white/70 break-all">
                    <a href={u.url} className="text-orange-300 underline" target="_blank" rel="noreferrer">
                      {u.url}
                    </a>
                  </div>
                  <div className="text-white/60">Tipo: {u.content_type || "N/D"}</div>
                  <div className="text-white/60">Subido: {new Date(u.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

