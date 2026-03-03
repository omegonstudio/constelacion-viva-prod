"use client"

import { useMemo, useState, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  MapPin,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MessageCircle,
  Info,
  Users
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Footer } from "@/components/organisms/footer"
import { getTherapistBySlug, getRelatedTherapists, type Therapist } from "@/lib/therapists-data"
import { toast } from "sonner"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function TherapistProfilePage({ params }: PageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)

  const therapist = getTherapistBySlug(slug)
  const relatedTherapists = getRelatedTherapists(slug, 3)

  if (!therapist) {
    const fallback = {
      name: searchParams.get("name") || searchParams.get("email") || "Terapeuta",
      bio: searchParams.get("bio"),
      email: searchParams.get("email"),
    }

    // Fallback mínimo para navegación desde /nuestrosterapeutas cuando backend no provee slug/detalle aún.
    return (
      <div className="min-h-screen bg-background">
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#060000]/95 backdrop-blur-md border-b border-primary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/images/design-mode/Logo%20amarillo.png"
                  alt="Constelación Viva"
                  width={36}
                  height={36}
                  className="w-9 h-9"
                />
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-white/80 hover:text-primary transition-colors font-sans text-sm">
                  Inicio
                </Link>
                <Link href="/nuestrosterapeutas" className="text-white/80 hover:text-primary transition-colors font-sans text-sm">
                  Nuestros Terapeutas
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="pt-28 pb-16 px-4">
          <div className="container mx-auto max-w-3xl space-y-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/nuestrosterapeutas")}
              className="text-muted-foreground hover:text-primary"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Volver al directorio
            </Button>

            <Card className="bg-card border-border overflow-hidden">
              <div className="relative aspect-[16/10] bg-muted">
                <Image src="/placeholder-user.jpg" alt={fallback.name} fill className="object-cover" />
              </div>
              <CardContent className="p-6 space-y-3">
                <h1 className="font-serif text-3xl font-semibold text-white">{fallback.name}</h1>
                {fallback.email && <p className="text-sm text-muted-foreground font-sans">{fallback.email}</p>}
                <p className="text-muted-foreground font-sans">
                  {fallback.bio || "Perfil público detallado disponible próximamente."}
                </p>
                <div className="pt-2">
                  <Button onClick={() => setBookingDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                    Agendar sesión
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-serif text-white">Agenda próximamente</DialogTitle>
                  <DialogDescription className="font-sans text-muted-foreground">
                    La agenda de sesiones estará disponible próximamente.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
                    Entendido
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  const handleBooking = () => {
    setBookingDialogOpen(true)
    toast("Reserva en desarrollo")
  }

  const handleConsult = () => {
    toast("Consulta enviada")
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % therapist.photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + therapist.photos.length) % therapist.photos.length)
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Simple Navbar */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#060000]/95 backdrop-blur-md border-b border-primary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/images/design-mode/Logo%20amarillo.png"
                  alt="Constelación Viva"
                  width={36}
                  height={36}
                  className="w-9 h-9"
                />
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-white/80 hover:text-primary transition-colors font-sans text-sm">
                  Inicio
                </Link>
                <Link href="/nuestrosterapeutas" className="text-white/80 hover:text-primary transition-colors font-sans text-sm">
                  Nuestros Terapeutas
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="pt-20">
          {/* Back Button */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/nuestrosterapeutas")}
              className="text-muted-foreground hover:text-primary"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Volver al directorio
            </Button>
          </div>

          {/* Profile Content */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Photo Gallery */}
                <PhotoGallery
                  photos={therapist.photos}
                  currentIndex={currentPhotoIndex}
                  onNext={nextPhoto}
                  onPrev={prevPhoto}
                  onSelect={setCurrentPhotoIndex}
                  name={therapist.name}
                />

                {/* Profile Header */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">
                      {therapist.name}
                    </h1>
                    <div className="flex items-center gap-1 bg-primary/20 rounded-full px-3 py-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium text-white">{therapist.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-sans">{therapist.location}</span>
                    <span className="text-primary">•</span>
                    <span className="font-sans">{therapist.sessionsCount} sesiones realizadas</span>
                  </div>

                  {/* Therapies */}
                  <div className="flex flex-wrap gap-2">
                    {therapist.therapies.map(therapy => (
                      <Badge
                        key={therapy}
                        variant="secondary"
                        className="bg-primary/10 text-primary border border-primary/20"
                      >
                        {therapy}
                      </Badge>
                    ))}
                  </div>

                  {/* Full Bio */}
                  <p className="text-muted-foreground font-sans leading-relaxed">
                    {therapist.bioFull}
                  </p>
                </div>

                {/* About Therapy Section */}
                <section>
                  <h2 className="font-serif text-2xl font-semibold text-white mb-4">
                    Sobre la terapia
                  </h2>
                  <Accordion type="single" collapsible defaultValue="about">
                    <AccordionItem value="about" className="border-border">
                      <AccordionTrigger className="text-white hover:text-primary font-sans">
                        Metodología y enfoque
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground font-sans leading-relaxed">
                        {therapist.aboutTherapy}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </section>

                {/* FAQs Section */}
                <section>
                  <h2 className="font-serif text-2xl font-semibold text-white mb-4">
                    Preguntas frecuentes
                  </h2>
                  <Accordion type="single" collapsible>
                    {therapist.faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`} className="border-border">
                        <AccordionTrigger className="text-white hover:text-primary font-sans text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground font-sans leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>

                {/* Related Therapists */}
                <section>
                  <h2 className="font-serif text-2xl font-semibold text-white mb-6">
                    Otros terapeutas
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {relatedTherapists.map(related => (
                      <RelatedTherapistCard key={related.slug} therapist={related} />
                    ))}
                  </div>
                </section>
              </div>

              {/* Booking Sidebar */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-28">
                  <Card className="bg-card border-border">
                    <CardContent className="p-6 space-y-6">
                      {/* Price */}
                      <div className="text-center pb-4 border-b border-border">
                        <span className="font-serif text-3xl font-bold text-primary">
                          ${therapist.price} USD
                        </span>
                        <p className="text-sm text-muted-foreground font-sans mt-1">
                          por sesión
                        </p>
                      </div>

                      {/* Session Info */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Clock className="w-5 h-5 text-primary" />
                          <span className="font-sans">{therapist.sessionDuration} minutos</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <MapPin className="w-5 h-5 text-primary" />
                          <span className="font-sans">Presencial en {therapist.location}</span>
                        </div>
                      </div>

                      {/* CTAs */}
                      <div className="space-y-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleBooking}
                              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                              size="lg"
                            >
                              <Calendar className="w-4 h-4 mr-2" />
                              Agendar sesión
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>ToDo (Objetivo 2)</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleConsult}
                              variant="outline"
                              className="w-full border-primary text-primary hover:bg-primary/10 bg-transparent"
                              size="lg"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Consultar disponibilidad
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>ToDo (Objetivo 2)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Disclaimer */}
                      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground font-sans">
                          El pago se divide 70/30 entre el terapeuta y la plataforma.
                          Procesamiento seguro a través de nuestra plataforma.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />

        {/* Booking Dialog */}
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-serif text-white">Reserva en desarrollo</DialogTitle>
              <DialogDescription className="font-sans text-muted-foreground">
                El flujo de reservas está siendo implementado. Pronto podrás agendar sesiones directamente con {therapist.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
                Entendido
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

interface PhotoGalleryProps {
  photos: string[]
  currentIndex: number
  onNext: () => void
  onPrev: () => void
  onSelect: (index: number) => void
  name: string
}

function PhotoGallery({ photos, currentIndex, onNext, onPrev, onSelect, name }: PhotoGalleryProps) {
  const hasMultiplePhotos = photos.length > 1

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-card">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={photos[currentIndex] || "/placeholder.svg"}
              alt={`${name} - Foto ${currentIndex + 1}`}
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {hasMultiplePhotos && (
          <>
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              aria-label="Foto siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Photo Counter */}
        {hasMultiplePhotos && (
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-sm text-white font-sans">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultiplePhotos && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => onSelect(index)}
              className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ${
                index === currentIndex
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "opacity-60 hover:opacity-100"
              }`}
              aria-label={`Ver foto ${index + 1}`}
            >
              <Image
                src={photo || "/placeholder.svg"}
                alt={`${name} - Miniatura ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface RelatedTherapistCardProps {
  therapist: Therapist
}

function RelatedTherapistCard({ therapist }: RelatedTherapistCardProps) {
  return (
    <Link href={`/terapeutas/${therapist.slug}`}>
      <Card className="group bg-card border-border overflow-hidden hover:border-primary/50 transition-all duration-300">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={therapist.photos[0] || "/placeholder.svg"}
            alt={therapist.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <h3 className="font-serif text-sm font-semibold text-white truncate">
              {therapist.name}
            </h3>
            <p className="text-xs text-white/80 font-sans">{therapist.location}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}

function NotFoundState() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#060000]/95 backdrop-blur-md border-b border-primary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/design-mode/Logo%20amarillo.png"
                alt="Constelación Viva"
                width={36}
                height={36}
                className="w-9 h-9"
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-20">
        <div className="text-center px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-card flex items-center justify-center">
            <Users className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white mb-2">
            Terapeuta no encontrado
          </h1>
          <p className="text-muted-foreground font-sans mb-6 max-w-md mx-auto">
            El perfil que buscas no existe o no está disponible actualmente.
          </p>
          <Link href="/nuestrosterapeutas">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Ver todos los terapeutas
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
