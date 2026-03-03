"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Play } from "lucide-react"
import Image from "next/image"

interface GalleryItemProps {
  title: string
  type: "image" | "video"
  src: string
  category: "eventos" | "terapeutas"
  onVideoClick?: () => void
}

export function GalleryItem({ title, type, src, category, onVideoClick }: GalleryItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isRemote = src?.startsWith("http")

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="relative aspect-square overflow-hidden cursor-pointer group"
      style={{ borderRadius: "var(--radius)" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={type === "video" ? onVideoClick : undefined}
      role={type === "video" ? "button" : undefined}
      aria-label={type === "video" ? `Ver video: ${title}` : title}
    >
      {isRemote ? (
        <img
          src={src || "/placeholder.svg"}
          alt={title}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
          style={{ objectFit: "cover" }}
        />
      ) : (
        <Image
          src={src || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      )}

      {type === "video" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110">
            <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-6"
      >
        <h3 className="font-serif text-xl md:text-2xl font-bold text-white text-balance">{title}</h3>
      </motion.div>
    </motion.div>
  )
}
