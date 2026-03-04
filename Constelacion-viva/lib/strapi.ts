import "server-only"

// Strapi Integration - Ready for connection

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || ""

// Types
export interface Therapist {
  id: number
  attributes: {
    nombre: string
    especialidad: string
    descripcion: string
    foto: {
      data: {
        attributes: {
          url: string
        }
      }
    }
    ubicacion: "Buenos Aires" | "Córdoba"
    createdAt: string
    updatedAt: string
  }
}

export interface Event {
  id: number
  attributes: {
    titulo: string
    descripcion: string
    fecha: string
    ubicacion: string
    imagen: {
      data: {
        attributes: {
          url: string
        }
      }
    }
    tipo: "taller" | "ceremonia" | "retiro"
    createdAt: string
    updatedAt: string
  }
}

export interface GalleryItem {
  id: number
  attributes: {
    titulo: string
    tipo: "image" | "video"
    categoria: "eventos" | "terapeutas"
    media: {
      data: {
        attributes: {
          url: string
          mime: string
        }
      }
    }
    createdAt: string
    updatedAt: string
  }
}

// Fetch helper
async function fetchStrapi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${STRAPI_URL}/api${endpoint}`
  const headers = {
    "Content-Type": "application/json",
    ...(STRAPI_TOKEN && { Authorization: `Bearer ${STRAPI_TOKEN}` }),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`Strapi fetch error: ${response.statusText}`)
  }

  return response.json()
}

// API Functions
export async function getTherapists(): Promise<Therapist[]> {
  try {
    const data = await fetchStrapi<{ data: Therapist[] }>("/therapists?populate=*")
    return data.data
  } catch (error) {
    console.error("[v0] Error fetching therapists:", error)
    return []
  }
}

export async function getEvents(): Promise<Event[]> {
  try {
    const data = await fetchStrapi<{ data: Event[] }>("/events?populate=*")
    return data.data
  } catch (error) {
    console.error("[v0] Error fetching events:", error)
    return []
  }
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  try {
    const data = await fetchStrapi<{ data: GalleryItem[] }>("/gallery-items?populate=*")
    return data.data
  } catch (error) {
    console.error("[v0] Error fetching gallery items:", error)
    return []
  }
}

// Mock data for development
export const mockTherapists: Therapist[] = [
  {
    id: 1,
    attributes: {
      nombre: "María González",
      especialidad: "Reiki y Terapia Energética",
      descripcion: "Maestra de Reiki con 10 años de experiencia",
      foto: {
        data: {
          attributes: {
            url: "/woman-therapist.jpg",
          },
        },
      },
      ubicacion: "Buenos Aires",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
  },
]

export const mockEvents: Event[] = [
  {
    id: 1,
    attributes: {
      titulo: "Taller de Meditación Lunar",
      descripcion: "Conecta con los ciclos lunares",
      fecha: "2024-12-15",
      ubicacion: "Buenos Aires",
      imagen: {
        data: {
          attributes: {
            url: "/meditation-workshop.png",
          },
        },
      },
      tipo: "taller",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
  },
]
