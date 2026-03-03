"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ContactFieldsProps {
  formData: {
    nombre: string
    email: string
    asunto: string
    mensaje: string
  }
  onChange: (field: string, value: string) => void
}

export function ContactFields({ formData, onChange }: ContactFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nombre" className="font-sans text-sm font-medium">
            Nombre completo
          </Label>
          <Input
            id="nombre"
            type="text"
            value={formData.nombre}
            onChange={(e) => onChange("nombre", e.target.value)}
            required
            className="font-sans"
            placeholder="Tu nombre"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="font-sans text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onChange("email", e.target.value)}
            required
            className="font-sans"
            placeholder="tu@email.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="asunto" className="font-sans text-sm font-medium">
          Asunto
        </Label>
        <Input
          id="asunto"
          type="text"
          value={formData.asunto}
          onChange={(e) => onChange("asunto", e.target.value)}
          required
          className="font-sans"
          placeholder="¿En qué podemos ayudarte?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mensaje" className="font-sans text-sm font-medium">
          Mensaje
        </Label>
        <Textarea
          id="mensaje"
          value={formData.mensaje}
          onChange={(e) => onChange("mensaje", e.target.value)}
          required
          rows={6}
          className="font-sans resize-none"
          placeholder="Cuéntanos más sobre tu consulta..."
        />
      </div>
    </div>
  )
}
