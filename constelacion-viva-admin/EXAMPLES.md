/\*\*

- EJEMPLOS DE USO - Hook useEventStorage
- Patrones y casos de uso recomendados
  \*/

# /\*

1. # USO BÁSICO - Componente Funcional Sencillo
   \*/

import { useEventStorage } from "@/hooks/use-event-storage"

export function SimpleEventEditor() {
const { eventData, setEventData, isHydrated } = useEventStorage()

if (!isHydrated) return <div>Cargando...</div>

return (
<input
value={eventData.title}
onChange={(e) =>
setEventData({
...eventData,
title: e.target.value,
})
}
placeholder="Título del evento"
/>
)
}

# /\*

2. # DEBOUNCE PERSONALIZADO - Guardar cada 1 segundo
   \*/

export function SlowerAutoSave() {
// Guardar con debounce de 1000ms (1 segundo)
const { eventData, setEventData, isHydrated } = useEventStorage(1000)

if (!isHydrated) return <div>Cargando...</div>

return (
<textarea
value={eventData.description}
onChange={(e) =>
setEventData({
...eventData,
description: e.target.value,
})
}
placeholder="Descripción del evento"
/>
)
}

# /\*

3. # LIMPIAR DRAFT - Botón para Resetear
   \*/

export function EventManager() {
const { eventData, setEventData, clearDraft, isHydrated } = useEventStorage()

if (!isHydrated) return null

const handleResetEvent = () => {
if (confirm("¿Estás seguro de que deseas limpiar el borrador?")) {
clearDraft() // Limpia localStorage y reinicia a DEFAULT_EVENT_DATA
}
}

return (
<div>
<h2>{eventData.title || "Sin título"}</h2>
<button onClick={handleResetEvent}>Limpiar borrador</button>
</div>
)
}

# /\*

4. # MULTI-CAMPO - Actualización Eficiente
   \*/

import { EventData } from "@/lib/types/event"

export function EventFormMultiField() {
const { eventData, setEventData, isHydrated } = useEventStorage()

if (!isHydrated) return null

// Función auxiliar para actualizar múltiples campos a la vez
const updateEventData = (updates: Partial<EventData>) => {
setEventData({
...eventData,
...updates,
})
}

return (
<form>
<input
value={eventData.title}
onChange={(e) => updateEventData({ title: e.target.value })}
placeholder="Título"
/>
<select
value={eventData.modality}
onChange={(e) => updateEventData({ modality: e.target.value })} >
<option value="">Seleccionar modalidad</option>
<option value="Online">Online</option>
<option value="Presencial">Presencial</option>
<option value="Híbrido">Híbrido</option>
</select>
<input
type="date"
value={eventData.date}
onChange={(e) => updateEventData({ date: e.target.value })}
/>
</form>
)
}

# /\*

5. # EXPORT/IMPORT - Guardar y Restaurar Drafts
   \*/

import { exportEventDraft, importEventDraft } from "@/hooks/use-event-storage"

export function EventBackup() {
const { eventData, setEventData, isHydrated } = useEventStorage()

if (!isHydrated) return null

const handleExport = () => {
const json = exportEventDraft(eventData)
// Crear un blob y descargar como archivo
const blob = new Blob([json], { type: "application/json" })
const url = URL.createObjectURL(blob)
const a = document.createElement("a")
a.href = url
a.download = `evento-${eventData.title || "backup"}.json`
a.click()
URL.revokeObjectURL(url)
}

const handleImport = async (file: File) => {
const text = await file.text()
const imported = importEventDraft(text)
if (imported) {
setEventData(imported)
alert("Evento importado exitosamente")
} else {
alert("Error al importar el archivo")
}
}

return (
<div>
<button onClick={handleExport}>Descargar backup</button>
<input
type="file"
accept=".json"
onChange={(e) => {
const file = e.currentTarget.files?.[0]
if (file) handleImport(file)
}}
/>
</div>
)
}

# /\*

6. # ITINERARIO DINÁMICO - Actualizar Arrays
   \*/

export function ItineraryEditor() {
const { eventData, setEventData, isHydrated } = useEventStorage()

if (!isHydrated) return null

const addItineraryItem = () => {
setEventData({
...eventData,
itinerary: [
...eventData.itinerary,
{ time: "", activity: "", description: "" },
],
})
}

const removeItineraryItem = (index: number) => {
setEventData({
...eventData,
itinerary: eventData.itinerary.filter((\_, i) => i !== index),
})
}

const updateItineraryItem = (
index: number,
field: "time" | "activity" | "description",
value: string
) => {
const updated = [...eventData.itinerary]
updated[index][field] = value
setEventData({
...eventData,
itinerary: updated,
})
}

return (
<div>
{eventData.itinerary.map((item, index) => (
<div key={index}>
<input
value={item.time}
onChange={(e) => updateItineraryItem(index, "time", e.target.value)}
placeholder="Hora"
/>
<input
value={item.activity}
onChange={(e) =>
updateItineraryItem(index, "activity", e.target.value)
}
placeholder="Actividad"
/>
<textarea
value={item.description}
onChange={(e) =>
updateItineraryItem(index, "description", e.target.value)
}
placeholder="Descripción"
/>
<button onClick={() => removeItineraryItem(index)}>Eliminar</button>
</div>
))}
<button onClick={addItineraryItem}>Agregar actividad</button>
</div>
)
}

# /\*

7. # VALIDACIÓN BEFORE SAVE - Usar React Hook Form
   \*/

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const eventSchema = z.object({
title: z.string().min(1, "El título es requerido"),
description: z.string().optional(),
date: z.string().min(1, "La fecha es requerida"),
location: z.string().optional(),
})

export function ValidatedEventForm() {
const { eventData, setEventData, isHydrated } = useEventStorage()
const { register, handleSubmit, formState: { errors } } = useForm({
resolver: zodResolver(eventSchema),
defaultValues: eventData,
})

if (!isHydrated) return null

const onSubmit = (data) => {
setEventData(data) // Solo guardar si pasa validación
alert("Evento guardado correctamente")
}

return (
<form onSubmit={handleSubmit(onSubmit)}>
<input
{...register("title")}
placeholder="Título"
/>
{errors.title && <span>{errors.title.message}</span>}

      <input
        {...register("date")}
        type="date"
      />
      {errors.date && <span>{errors.date.message}</span>}

      <button type="submit">Guardar evento</button>
    </form>

)
}

# /\*

8. # SINCRONIZAR ENTRE PESTAÑAS (Bonus)
   \*/

import { useEffect } from "react"

export function SyncBetweenTabs() {
const { eventData, setEventData, isHydrated } = useEventStorage()

useEffect(() => {
if (!isHydrated) return

    // Escuchar cambios en localStorage de otras pestañas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "omegon:event-draft" && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue)
          setEventData(updated)
          console.log("Evento sincronizado desde otra pestaña")
        } catch (error) {
          console.error("Error al sincronizar:", error)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)

}, [isHydrated, setEventData])

return <div>Cambios sincronizados entre pestañas</div>
}

# /\*

# NOTAS IMPORTANTES

✅ DO's:

- Usa { ...eventData, ...updates } para actualizar estado
- Verifica isHydrated antes de renderizar
- Usa el hook en componentes "use client"
- Personaliza el debounce según necesites
- Maneja errores en import/export

❌ DON'Ts:

- No accedas a localStorage sin verificar isHydrated
- No modifiques eventData inline (crea un nuevo objeto)
- No olvides limpiar event listeners (useEffect return)
- No uses el hook en componentes servidor
- No ignores los errores en console.warn/error

🔑 CLAVE DE STORAGE:
"omegon:event-draft" - Centralizada en use-event-storage.ts

⏱️ DEBOUNCE POR DEFECTO: 500ms
Personalizable: useEventStorage(1000) /_ 1 segundo _/
\*/
