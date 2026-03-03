"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, Users } from "lucide-react"

import { motion, AnimatePresence } from "framer-motion"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Footer } from "@/components/organisms/footer"

import { usePublicTherapists } from "@/hooks/usePublicTherapists"
import { Navbar } from "@/components/organisms/navbar"

function displayNameFrom(t: { display_name?: string | null; email: string }) {
  return t.display_name?.trim() || t.email.split("@")[0]
}

function buildProfileHref(t: { user_id: number; email: string; display_name?: string | null; bio?: string | null }) {
  const params = new URLSearchParams()
  const name = displayNameFrom(t)
  if (name) params.set("name", name)
  if (t.bio) params.set("bio", t.bio)
  if (t.email) params.set("email", t.email)
  const qs = params.toString()
  return qs ? `/terapeutas/${t.user_id}?${qs}` : `/terapeutas/${t.user_id}`
}

export default function NuestrosTerapeutasPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { data: therapists, loading: isLoading, error, refetch } = usePublicTherapists()

  const filteredTherapists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return therapists
    return therapists.filter((t) => {
      const name = displayNameFrom(t).toLowerCase()
      const email = (t.email || "").toLowerCase()
      const bio = (t.bio || "").toLowerCase()
      return name.includes(q) || email.includes(q) || bio.includes(q)
    })
  }, [therapists, searchQuery])

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Navbar */}
    <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 bg-gradient-to-b from-[#060000] to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            Nuestros <span className="text-primary">Terapeutas</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-sans text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Este directorio muestra únicamente terapeutas visibles según el estado de membresía definido en el backend.
          </motion.p>
        </div>
      </section>

      {/* Filters Section (solo UI, sin inventar campos inexistentes) */}
      <section className="sticky top-20 z-40 bg-background/95 backdrop-blur-md border-b border-border py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          {error && (
            <div className="mb-6 rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">{error}</div>
              <Button variant="outline" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-6 font-sans">
            {filteredTherapists.length} terapeuta{filteredTherapists.length !== 1 ? "s" : ""} disponible
            {filteredTherapists.length !== 1 ? "s" : ""}
          </p>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-card border-border overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTherapists.length > 0 ? (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredTherapists.map((t, index) => {
                  const name = displayNameFrom(t)
                  return (
                    <motion.div
                      key={t.user_id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                    >
                      <Card className="group bg-card border-border overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                          <Image
                            src="/placeholder-user.jpg"
                            alt={name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </div>

                        <CardContent className="p-5 space-y-4">
                          <h3 className="font-serif text-xl font-semibold text-white group-hover:text-primary transition-colors">
                            {name}
                          </h3>

                          <p className="text-xs text-muted-foreground font-sans">{t.email}</p>

                          <p className="text-sm text-muted-foreground font-sans line-clamp-3">
                            {t.bio || "Perfil disponible próximamente."}
                          </p>

                          {/* CTA (mantener) */}
                          <Link href={buildProfileHref(t)} className="block">
                            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                              Ver perfil
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-card flex items-center justify-center">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-white mb-2">No hay terapeutas disponibles</h3>
              <p className="text-muted-foreground font-sans mb-6 max-w-md mx-auto">
                En este momento no hay terapeutas visibles. Volvé a intentarlo más tarde.
              </p>
              {searchQuery.trim() && (
                <Button onClick={() => setSearchQuery("")} variant="outline">
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}


