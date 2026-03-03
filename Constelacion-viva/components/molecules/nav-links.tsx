"use client"

import type React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

const navItems = [
  { label: "Inicio", href: "#hero" },
  { label: "Servicios", href: "#servicios" },
  { label: "Sobre Nosotros", href: "#sobre" },
  { label: "Galería", href: "#galeria" },
  { label: "Contacto", href: "#contacto" },
  { label: "Nuestros Terapeutas", href: "/nuestrosterapeutas" },

]

interface NavLinksProps {
  className?: string
  onLinkClick?: () => void
}

export function NavLinks({ className, onLinkClick }: NavLinksProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
      onLinkClick?.()
    }
  }

  return (
    <nav className={cn("flex items-center gap-6", className)}>
   {navItems.map((item) =>
      item.href.startsWith("#") ? (
        <a
          key={item.href}
          href={item.href}
          onClick={(e) => handleClick(e, item.href)}
          className="..."
        >
          {item.label}
        </a>
      ) : (
        <Link key={item.href} href={item.href} className="...">
          {item.label}
        </Link>
      )
    )}
    </nav>
  )
}
