"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface EventFormProps {
  eventData: {
    title: string
    description: string
    location: string
    date: string
    modality: string
    eventType: string
    itinerary: { time: string; activity: string; description: string }[]
    extras: string
    frequency: string
  }
  setEventData: (data: any) => void
}

export function EventForm({ eventData, setEventData }: EventFormProps) {
  const prevEventTypeRef = useRef<string>("")
  const [customFrequency, setCustomFrequency] = useState("")
  const [showCustomFrequency, setShowCustomFrequency] = useState(false)

  const updateField = (field: string, value: string) => {
    setEventData({ ...eventData, [field]: value })
  }

  const updateItinerary = (index: number, field: "time" | "activity" | "description", value: string) => {
    const newItinerary = [...eventData.itinerary]
    newItinerary[index][field] = value
    setEventData({ ...eventData, itinerary: newItinerary })
  }

  const addItineraryItem = () => {
    setEventData({
      ...eventData,
      itinerary: [...eventData.itinerary, { time: "", activity: "", description: "" }],
    })
  }

  const removeItineraryItem = (index: number) => {
    const newItinerary = eventData.itinerary.filter((_, i) => i !== index)
    setEventData({ ...eventData, itinerary: newItinerary })
  }

  const clearForm = () => {
    setEventData({
      title: "",
      description: "",
      location: "",
      date: "",
      modality: "",
      eventType: "",
      itinerary: [],
      extras: "",
      frequency: "",
    })
    setCustomFrequency("")
    setShowCustomFrequency(false)
  }

  const handleFrequencyChange = (value: string) => {
    if (value === "custom") {
      setShowCustomFrequency(true)
      updateField("frequency", customFrequency)
    } else {
      setShowCustomFrequency(false)
      updateField("frequency", value)
    }
  }

  const handleCustomFrequencyChange = (value: string) => {
    setCustomFrequency(value)
    updateField("frequency", value)
  }

  useEffect(() => {
    if (!eventData.eventType || eventData.eventType === prevEventTypeRef.current) return
    if (eventData.itinerary.length > 0) {
      prevEventTypeRef.current = eventData.eventType
      return
    }

    let defaultItinerary: { time: string; activity: string; description: string }[] = []

    switch (eventData.eventType) {
      case "charla":
        defaultItinerary = [
          { time: "10 min", activity: "Inicio y bienvenida", description: "" },
          { time: "10 min", activity: "Presentación del tema", description: "" },
          { time: "40 min", activity: "Charla principal", description: "" },
          { time: "10 min", activity: "Cierre y preguntas", description: "" },
        ]
        break
      case "taller":
        defaultItinerary = [
          { time: "40 min", activity: "Módulo 1", description: "" },
          { time: "40 min", activity: "Módulo 2", description: "" },
          { time: "15 min", activity: "Pausa", description: "" },
          { time: "40 min", activity: "Módulo 3", description: "" },
          { time: "20 min", activity: "Cierre y práctica", description: "" },
        ]
        break
      case "retiro":
        defaultItinerary = [
          { time: "Día 1 - Mañana", activity: "Llegada y bienvenida", description: "" },
          { time: "Día 1 - Tarde", activity: "Primera sesión de meditación", description: "" },
          { time: "Día 2 - Mañana", activity: "Yoga y desayuno consciente", description: "" },
          { time: "Día 2 - Tarde", activity: "Taller de conexión", description: "" },
          { time: "Día 3 - Mañana", activity: "Ceremonia de cierre", description: "" },
        ]
        break
      case "curso":
        defaultItinerary = [
          { time: "Módulo 1", activity: "Introducción y fundamentos", description: "" },
          { time: "Módulo 2", activity: "Desarrollo teórico", description: "" },
          { time: "Módulo 3", activity: "Práctica guiada", description: "" },
          { time: "Módulo 4", activity: "Integración y cierre", description: "" },
        ]
        break
      default:
        break
    }

    if (defaultItinerary.length > 0) {
      setEventData({ ...eventData, itinerary: defaultItinerary })
      prevEventTypeRef.current = eventData.eventType
    }
  }, [eventData, setEventData])

  return (
    <Card className="p-6 bg-card shadow-lg border-2 border-border">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Datos del Evento</h2>

      <div className="space-y-5">
        <div>
          <Label htmlFor="title" className="text-foreground font-medium">
            Título del evento *
          </Label>
          <Input
            id="title"
            value={eventData.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Ej: Taller de Meditación Consciente"
            className="mt-1.5 bg-input border-border text-foreground"
            required
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-foreground font-medium">
            Descripción breve
          </Label>
          <Textarea
            id="description"
            value={eventData.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Describe tu evento holístico..."
            className="mt-1.5 min-h-24 bg-input border-border text-foreground"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="location" className="text-foreground font-medium">
              Lugar
            </Label>
            <Input
              id="location"
              value={eventData.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="Ej: Centro Holístico Luz"
              className="mt-1.5 bg-input border-border text-foreground"
            />
          </div>

          <div>
            <Label htmlFor="date" className="text-foreground font-medium">
              Fecha *
            </Label>
            <Input
              id="date"
              type="date"
              value={eventData.date}
              onChange={(e) => updateField("date", e.target.value)}
              className="mt-1.5 bg-input border-border text-foreground"
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="modality" className="text-foreground font-medium">
              Modalidad *
            </Label>
            <Select value={eventData.modality} onValueChange={(value) => updateField("modality", value)}>
              <SelectTrigger className="mt-1.5 bg-input border-border text-foreground">
                <SelectValue placeholder="Selecciona modalidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aire libre">Aire libre</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="eventType" className="text-foreground font-medium">
              Tipo de evento *
            </Label>
            <Select value={eventData.eventType} onValueChange={(value) => updateField("eventType", value)}>
              <SelectTrigger className="mt-1.5 bg-input border-border text-foreground">
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="taller">Taller</SelectItem>
                <SelectItem value="charla">Charla</SelectItem>
                <SelectItem value="retiro">Retiro</SelectItem>
                <SelectItem value="curso">Curso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="frequency" className="text-foreground font-medium">
            Frecuencia
          </Label>
          <Select value={showCustomFrequency ? "custom" : eventData.frequency} onValueChange={handleFrequencyChange}>
            <SelectTrigger className="mt-1.5 bg-input border-border text-foreground">
              <SelectValue placeholder="Selecciona frecuencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1 vez por semana">1 vez por semana</SelectItem>
              <SelectItem value="2 veces por semana">2 veces por semana</SelectItem>
              <SelectItem value="1 vez por mes">1 vez por mes</SelectItem>
              <SelectItem value="custom">Personalizado...</SelectItem>
            </SelectContent>
          </Select>

          {showCustomFrequency && (
            <Input
              value={customFrequency}
              onChange={(e) => handleCustomFrequencyChange(e.target.value)}
              placeholder="Ej: 3 veces por semana, cada 15 días..."
              className="mt-2 bg-input border-border text-foreground"
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-foreground font-medium">Itinerario</Label>
            <Button
              type="button"
              onClick={addItineraryItem}
              size="sm"
              className="bg-primary hover:bg-accent text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar itinerario
            </Button>
          </div>

          <div className="space-y-4">
            {eventData.itinerary.map((item, index) => (
              <div key={index} className="p-4 bg-background/50 rounded-lg border border-border space-y-3">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor={`time-${index}`} className="text-sm text-muted-foreground">
                      Tiempo/Duración
                    </Label>
                    <Input
                      id={`time-${index}`}
                      value={item.time}
                      onChange={(e) => updateItinerary(index, "time", e.target.value)}
                      placeholder="Ej: 40 min"
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor={`activity-${index}`} className="text-sm text-muted-foreground">
                      Nombre del módulo
                    </Label>
                    <Input
                      id={`activity-${index}`}
                      value={item.activity}
                      onChange={(e) => updateItinerary(index, "activity", e.target.value)}
                      placeholder="Ej: Módulo 1"
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => removeItineraryItem(index)}
                    size="icon"
                    variant="outline"
                    className="border-border hover:bg-destructive hover:text-destructive-foreground mt-6"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`description-${index}`} className="text-sm text-muted-foreground">
                    Descripción del módulo (opcional)
                  </Label>
                  <Textarea
                    id={`description-${index}`}
                    value={item.description}
                    onChange={(e) => updateItinerary(index, "description", e.target.value)}
                    placeholder="Describe qué se verá en este módulo..."
                    className="bg-input border-border text-foreground min-h-20"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between m-3">
            <Button
              type="button"
              onClick={addItineraryItem}
              size="sm"
              className="bg-primary hover:bg-accent text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar itinerario
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="extras" className="text-foreground font-medium">
            Extras / Comentarios
          </Label>
          <Textarea
            id="extras"
            value={eventData.extras}
            onChange={(e) => updateField("extras", e.target.value)}
            placeholder="Agrega información adicional, requisitos, materiales necesarios, etc..."
            className="mt-1.5 min-h-24 bg-input border-border text-foreground"
          />
        </div>

        <Button
          type="button"
          onClick={clearForm}
          variant="outline"
          className="w-full border-border hover:bg-secondary text-foreground bg-transparent"
        >
          Limpiar formulario
        </Button>
      </div>
    </Card>
  )
}
