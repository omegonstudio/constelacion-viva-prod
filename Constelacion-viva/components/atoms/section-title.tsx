import type React from "react"
import { cn } from "@/lib/utils"

interface SectionTitleProps {
  children: React.ReactNode
  className?: string
  as?: "h1" | "h2" | "h3"
}

export function SectionTitle({ children, className, as: Component = "h2" }: SectionTitleProps) {
  return (
    <Component className={cn("font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-balance", className)}>
      {children}
    </Component>
  )
}
