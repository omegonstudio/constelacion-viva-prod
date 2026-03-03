"use client"

import { AdminGalleryUploader } from "@/components/organisms/admin-gallery-uploader"
import { AdminGalleryList } from "@/components/organisms/admin-gallery-list"
import { useState } from "react"

export default function AdminGalleryPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const triggerRefresh = () => setRefreshKey((v) => v + 1)

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="border border-white/10 rounded-xl p-6 bg-white/5 backdrop-blur space-y-4">
          <h1 className="text-2xl font-semibold">Galería (Admin)</h1>
          <p className="text-sm text-white/70">Sube imágenes o videos para que aparezcan en la galería pública.</p>
          <AdminGalleryUploader onUploaded={triggerRefresh} />
        </div>

        <div className="border border-white/10 rounded-xl p-6 bg-white/5 backdrop-blur space-y-4">
          <AdminGalleryList refreshSignal={refreshKey} onDeleted={triggerRefresh} />
        </div>
      </div>
    </div>
  )
}

