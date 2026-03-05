"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { SectionTitle } from "@/components/atoms/section-title"
import { FilterTabs, type FilterOption } from "@/components/molecules/filter-tabs"
import { GalleryItem } from "@/components/molecules/gallery-item"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useGallery } from "@/hooks/useGallery"
import { DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export function GalleryGrid() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("todos")
  const [selectedVideo, setSelectedVideo] = useState<{
    title: string
    videoSrc?: string | null
  } | null>(null)
  const { data, loading, error } = useGallery()

  const galleryItems = useMemo(() => data ?? [], [data])

  const filteredItems =
    activeFilter === "todos" ? galleryItems : galleryItems.filter((item) => item.category === activeFilter)

  return (
    <section id="galeria" className="py-20 md:py-32 bg-[#060000]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <SectionTitle className="mb-6 text-white">
            <span className="text-[#ed7417]">Galería</span>
          </SectionTitle>
          <p className="font-serif text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Explora momentos de nuestros eventos y sesiones terapéuticas
          </p>
        </div>

        <FilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      {/*     {loading && (
            <div className="col-span-full text-center text-white/70 font-sans">Cargando galería…</div>
          )}
          {error && (
            <div className="col-span-full text-center text-red-200 font-sans">
              No pudimos cargar la galería. Intenta nuevamente.
            </div>
          )} */}
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <GalleryItem
                  title={item.title}
                  type={item.type}
                  src={item.src}
                  category={item.category}
                  onVideoClick={
                    item.type === "video" && item.videoSrc ? () => setSelectedVideo({ title: item.title, videoSrc: item.videoSrc }) : undefined
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Video Dialog */}
      <Dialog
        open={!!selectedVideo}
        onOpenChange={(open) => {
          if (!open) setSelectedVideo(null)
        }}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          <VisuallyHidden>
            <DialogTitle>{selectedVideo?.title ?? "Video"}</DialogTitle>
          </VisuallyHidden>

          <button
            onClick={() => setSelectedVideo(null)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Cerrar video"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {selectedVideo?.videoSrc ? (
            <video src={selectedVideo.videoSrc} controls autoPlay className="w-full aspect-video">
              <track kind="captions" />
            </video>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}
