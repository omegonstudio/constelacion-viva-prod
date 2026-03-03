"use client"

import { useEffect, useRef } from "react"

interface VideoBackgroundProps {
  src?: string
  poster?: string
  className?: string
}

export function VideoBackground({
  src = "/constelacion.mp4",
  poster = "/holistic-therapy-nature-meditation.jpg",
  className = "",
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log("Video autoplay failed:", error)
      })
    }
  }, [])

  return (
    <video ref={videoRef} className={className} autoPlay muted loop playsInline poster={poster} aria-hidden="true">
      <source src={src} type="video/mp4" />
    </video>
  )
}
