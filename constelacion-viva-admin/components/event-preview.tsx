"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Download } from "lucide-react"
import { jsPDF } from "jspdf"

interface EventPreviewProps {
  previewText: string
  setPreviewText: (text: string) => void
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
}

export function EventPreview({ previewText, setPreviewText, eventData }: EventPreviewProps) {
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

  const exportToPDF = () => {
    if (!eventData.title) {
      alert("Por favor completa al menos el título del evento")
      return
    }

    const doc = new jsPDF()
    
    // Configuración de márgenes y dimensiones
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const marginLeft = 20
    const marginRight = 20
    const marginBottom = 20
    const maxWidth = pageWidth - marginLeft - marginRight
    const maxY = pageHeight - marginBottom
    
    // Configuración de interlineados
    const lineHeight = {
      title: 8,
      normal: 6,
      small: 5,
      spacing: 10
    }

    // Función auxiliar para verificar y agregar nueva página
    const checkAddPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > maxY) {
        doc.addPage()
        return 20 // Reset Y position
      }
      return yPosition
    }

    // Set font
    doc.setFont("helvetica")

    // Título principal
    doc.setFontSize(20)
    doc.setTextColor(237, 116, 23) // #ed7417
    doc.setFont("helvetica", "bold")
    const titleLines = doc.splitTextToSize(eventData.title, maxWidth)
    doc.text(titleLines, marginLeft, 25)
    
    let yPosition = 25 + (titleLines.length * lineHeight.title) + lineHeight.spacing

    // Descripción
    if (eventData.description) {
      yPosition = checkAddPage(20)
      doc.setFontSize(11)
      doc.setTextColor(60, 60, 60)
      doc.setFont("helvetica", "normal")
      const descLines = doc.splitTextToSize(eventData.description, maxWidth)
      
      // Verificar si la descripción cabe en la página actual
      const descHeight = descLines.length * lineHeight.normal
      yPosition = checkAddPage(descHeight + 10)
      
      doc.text(descLines, marginLeft, yPosition)
      yPosition += descHeight + lineHeight.spacing
    }

    // Sección de detalles
    yPosition = checkAddPage(50)
    doc.setFontSize(12)
    doc.setTextColor(60, 60, 60)
    doc.setFont("helvetica", "normal")

    if (eventData.date) {
      yPosition = checkAddPage(8)
      doc.setFont("helvetica", "bold")
      doc.text("Fecha: ", marginLeft, yPosition)
      doc.setFont("helvetica", "normal")
      doc.text(formatDateWithDay(eventData.date), marginLeft + 20, yPosition)
      yPosition += 7
    }

    if (eventData.location) {
      yPosition = checkAddPage(8)
      const locationLines = doc.splitTextToSize(eventData.location, maxWidth - 20)
      doc.setFont("helvetica", "bold")
      doc.text("Lugar: ", marginLeft, yPosition)
      doc.setFont("helvetica", "normal")
      doc.text(locationLines, marginLeft + 20, yPosition)
      yPosition += (locationLines.length * 7)
    }

    if (eventData.modality) {
      yPosition = checkAddPage(8)
      doc.setFont("helvetica", "bold")
      doc.text("Modalidad: ", marginLeft, yPosition)
      doc.setFont("helvetica", "normal")
      doc.text(eventData.modality, marginLeft + 30, yPosition)
      yPosition += 7
    }

    if (eventData.eventType) {
      yPosition = checkAddPage(8)
      doc.setFont("helvetica", "bold")
      doc.text("Tipo: ", marginLeft, yPosition)
      doc.setFont("helvetica", "normal")
      doc.text(eventData.eventType, marginLeft + 20, yPosition)
      yPosition += 7
    }

    if (eventData.frequency) {
      yPosition = checkAddPage(8)
      doc.setFont("helvetica", "bold")
      doc.text("Frecuencia: ", marginLeft, yPosition)
      doc.setFont("helvetica", "normal")
      doc.text(eventData.frequency, marginLeft + 30, yPosition)
      yPosition += lineHeight.spacing + 5
    } else {
      yPosition += 5
    }

    // Itinerario
    if (eventData.itinerary.length > 0) {
      yPosition = checkAddPage(25)
      
      doc.setFontSize(14)
      doc.setTextColor(237, 116, 23)
      doc.setFont("helvetica", "bold")
      doc.text("Itinerario", marginLeft, yPosition)
      yPosition += lineHeight.spacing

      doc.setFontSize(11)
      doc.setTextColor(60, 60, 60)

      eventData.itinerary.forEach((item, index) => {
        // Estimar espacio necesario para este item
        const estimatedSpace = 15 + (item.description ? 20 : 0)
        yPosition = checkAddPage(estimatedSpace)

        // Título del módulo con hora
        doc.setFont("helvetica", "bold")
        const itemTitle = `${item.time} - ${item.activity}`
        const titleLines = doc.splitTextToSize(itemTitle, maxWidth - 10)
        doc.text(titleLines, marginLeft + 5, yPosition)
        yPosition += titleLines.length * lineHeight.normal + 3

        // Descripción del módulo si existe
        if (item.description) {
          doc.setFont("helvetica", "normal")
          const descLines = doc.splitTextToSize(item.description, maxWidth - 10)
          
          // Verificar si la descripción cabe
          const descHeight = descLines.length * lineHeight.small
          if (yPosition + descHeight > maxY) {
            doc.addPage()
            yPosition = 20
          }
          
          doc.text(descLines, marginLeft + 5, yPosition)
          yPosition += descHeight + 5
        }
        
        // Espacio entre items
        yPosition += 3
      })
    }

    // Extras / Comentarios
    if (eventData.extras) {
      yPosition = checkAddPage(25)
      
      doc.setFontSize(14)
      doc.setTextColor(237, 116, 23)
      doc.setFont("helvetica", "bold")
      doc.text("Extras / Comentarios", marginLeft, yPosition)
      yPosition += lineHeight.spacing

      doc.setFontSize(11)
      doc.setTextColor(60, 60, 60)
      doc.setFont("helvetica", "normal")
      const extrasLines = doc.splitTextToSize(eventData.extras, maxWidth)
      
      // Verificar si los extras caben
      const extrasHeight = extrasLines.length * lineHeight.normal
      if (yPosition + extrasHeight > maxY) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.text(extrasLines, marginLeft, yPosition)
    }

    // Guardar PDF
    const fileName = eventData.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    doc.save(`${fileName}.pdf`)
  }

  return (
    <Card className="p-6 bg-card shadow-lg border-2 border-border sticky top-8">
      <h2 className="text-2xl font-semibold mb-4 text-foreground">Vista Previa</h2>

      <Textarea
        value={previewText}
        onChange={(e) => setPreviewText(e.target.value)}
        className="min-h-[500px] font-mono text-sm bg-input border-border text-foreground mb-4"
        placeholder="El resumen de tu evento aparecerá aquí..."
      />

      <Button
        onClick={exportToPDF}
        className="w-full bg-primary hover:bg-accent text-primary-foreground font-medium"
        disabled={!eventData.title}
      >
        <Download className="w-4 h-4 mr-2" />
        Exportar a PDF
      </Button>

      {!eventData.title && (
        <p className="text-sm text-muted-foreground text-center mt-2">Completa el título para exportar</p>
      )}
    </Card>
  )
}
