/**
 * Hook personalizado para persistencia de eventos en localStorage
 * Maneja SSR, debounce, y parsing seguro
 */

import { useState, useEffect, useRef, useCallback, Dispatch, SetStateAction } from "react"
import { EventData, DEFAULT_EVENT_DATA } from "@/lib/types/event"

// Clave centralizada para el almacenamiento
const STORAGE_KEY = "omegon:event-draft"

// Tiempo de debounce en ms (espera antes de guardar en localStorage)
const DEBOUNCE_DELAY = 500

/**
 * Hook para persistencia automática de datos en localStorage
 * @param debounceMs - Milisegundos de espera antes de guardar
 * @returns [eventData, setEventData, clearDraft]
 */
export function useEventStorage(debounceMs = DEBOUNCE_DELAY) {
  // Estado principal del evento
  const [eventData, setEventData] = useState<EventData>(DEFAULT_EVENT_DATA)
  const [isHydrated, setIsHydrated] = useState(false)

  // Refs para manejar debounce y prevenir memory leaks
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isComponentMountedRef = useRef(true)

  // Restaurar datos del localStorage al montar
  useEffect(() => {
    const restoreFromStorage = () => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as EventData
          // Validación básica: verificar que tenga las propiedades esperadas
          if (parsed.title || Object.keys(parsed).length > 0) {
            setEventData(parsed)
          }
        }
      } catch (error) {
        console.warn("Error al restaurar el draft del evento:", error)
        // Si hay error al parsear, mantener el estado por defecto
      }

      // Marcar como hidratado para evitar comportamiento de SSR
      if (isComponentMountedRef.current) {
        setIsHydrated(true)
      }
    }

    restoreFromStorage()

    return () => {
      isComponentMountedRef.current = false
    }
  }, [])

  // Guardar en localStorage con debounce
  useEffect(() => {
    // No guardar si aún no está hidratado (evita SSR mismatch)
    if (!isHydrated) return

    // Limpiar timer previo
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Configurar nuevo timer
    debounceTimerRef.current = setTimeout(() => {
      if (isComponentMountedRef.current) {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(eventData))
        } catch (error) {
          console.error("Error al guardar el draft del evento:", error)
        }
      }
    }, debounceMs)

    // Limpiar timer al desmontar
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [eventData, isHydrated, debounceMs])

  // Función para limpiar el draft
  const clearDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
      setEventData(DEFAULT_EVENT_DATA)
    } catch (error) {
      console.error("Error al limpiar el draft:", error)
    }
  }, [])

  return {
    eventData,
    setEventData,
    clearDraft,
    isHydrated,
  }
}

/**
 * Función auxiliar para exportar el draft como JSON (útil para backups)
 */
export function exportEventDraft(eventData: EventData): string {
  return JSON.stringify(eventData, null, 2)
}

/**
 * Función auxiliar para importar un draft desde JSON
 */
export function importEventDraft(jsonString: string): EventData | null {
  try {
    const parsed = JSON.parse(jsonString) as EventData
    // Validación básica de estructura
    if (typeof parsed === "object" && parsed !== null) {
      return parsed
    }
  } catch (error) {
    console.error("Error al importar el draft:", error)
  }
  return null
}
