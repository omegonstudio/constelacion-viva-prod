"use client"

import Image from "next/image"

export function Logo() {
  return (
    <a
    href="#hero"
    onClick={(e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }}
    className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
    aria-label="Constelación Viva - Inicio"
  >
    <Image
      src="/images/design-mode/constelacion.png"
      alt="Constelación Viva Logo"
      width={12}
      height={12}
      className="w-12 h-12"
    />
    <span className="font-serif text-xl font-bold sr-only">
      Constelación Viva
    </span>
  </a>  )
}