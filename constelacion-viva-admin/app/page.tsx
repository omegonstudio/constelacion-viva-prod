"use client"

import { useState, useEffect } from "react"
import { EventForm } from "@/components/event-form"
import { EventPreview } from "@/components/event-preview"
import { useEventStorage } from "@/hooks/use-event-storage"
import { Sparkles, Trash2 } from "lucide-react"

export default function Home() {
  // Usar el hook para persistencia automática en localStorage
  const { eventData, setEventData, clearDraft, isHydrated } = useEventStorage()

  const [previewText, setPreviewText] = useState("")

  const formatDateWithDay = (dateString: string) => {
    if (!dateString) return ""

    const date = new Date(dateString + "T12:00:00-03:00") // Argentina timezone UTC-3
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    const dayName = days[date.getDay()]

    // Format: "Lunes, 15/03/2024"
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear() 

    return `${dayName}, ${day}/${month}/${year}`
  }

  useEffect(() => {
    // Generate preview text from event data
    const generatePreview = () => {
      if (!eventData.title) return ""

      let text = `${eventData.title}\n\n`

      if (eventData.description) {
        text += `${eventData.description}\n\n`
      }

      if (eventData.date) {
        text += `📅 Fecha: ${formatDateWithDay(eventData.date)}\n`
      }

      if (eventData.location) {
        text += `📍 Lugar: ${eventData.location}\n`
      }

      if (eventData.modality) {
        text += `🌟 Modalidad: ${eventData.modality}\n`
      }

      if (eventData.eventType) {
        text += `✨ Tipo: ${eventData.eventType}\n`
      }

      if (eventData.frequency) {
        text += `🔄 Frecuencia: ${eventData.frequency}\n`
      }

      if (eventData.itinerary.length > 0) {
        text += `\n📋 Itinerario:\n\n`
        eventData.itinerary.forEach((item) => {
          text += `${item.time} - ${item.activity}\n`
          if (item.description) {
            text += `   ${item.description}\n`
          }
          text += `\n`
        })
      }

      if (eventData.extras) {
        text += `\n💬 Extras / Comentarios:\n${eventData.extras}\n`
      }

      return text
    }

    setPreviewText(generatePreview())
  }, [eventData])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">Constelacion Viva</h1>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Creador de Eventos Holísticos
            </h2>
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Crea y diseña tus talleres, charlas, retiros y cursos con armonía y claridad
          </p>
          {/* Botón para limpiar el draft guardado */}
          {isHydrated && (
            <div className="mt-6">
              <button
                onClick={clearDraft}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar borrador
              </button>
            </div>
          )}
        </header>

        {/* Solo renderizar el contenido cuando está hidratado para evitar SSR mismatch */}
        {isHydrated ? (
          <div className="grid lg:grid-cols-2 gap-8">
            <EventForm eventData={eventData} setEventData={setEventData} />
            <EventPreview
              previewText={previewText}
              setPreviewText={setPreviewText}
              eventData={eventData}
            />
          </div>
        ) : (
          // Skeleton/placeholder mientras se restauran datos
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-muted animate-pulse rounded-lg h-96" />
            <div className="bg-muted animate-pulse rounded-lg h-96" />
          </div>
        )}
      </div>
    </div>
  )
}
