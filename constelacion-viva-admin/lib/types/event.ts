/**
 * Tipos centralizados para los datos del evento
 */

export interface ItineraryItem {
  time: string
  activity: string
  description: string
}

export interface EventData {
  title: string
  description: string
  location: string
  date: string
  modality: string
  eventType: string
  itinerary: ItineraryItem[]
  extras: string
  frequency: string
}

/**
 * Estado inicial por defecto del evento
 */
export const DEFAULT_EVENT_DATA: EventData = {
  title: "",
  description: "",
  location: "",
  date: "",
  modality: "",
  eventType: "",
  itinerary: [],
  extras: "",
  frequency: "",
}
