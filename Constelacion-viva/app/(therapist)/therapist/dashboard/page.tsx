"use client"

import React, { useEffect } from "react"

import { useState, useCallback } from "react"
import Image from "next/image"
import {
  Menu,
  X,
  Home,
  CreditCard,
  User,
  ImageIcon,
  BookOpen,
  LogOut,
  ChevronDown,
  Upload,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  Clock,
  XCircle,
  Plus,
  DollarSign,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"
import Link from "next/link"
import { useMembershipStore } from "@/lib/stores/membership.store"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/atoms/logo"
import { Sidebar } from "@/components/molecules/Sidebar"

// Types
type MembershipStatus = "active" | "pending" | "inactive"

interface TherapistProfile {
  fullName: string
  location: string
  therapies: string[]
  bio: string
  payoutInfo: string
}

interface Photo {
  id: number
  url: string | null
  uploading?: boolean
  progress?: number
  error?: string
}

interface Course {
  id: number
  title: string
  description: string
  price: number
  status: "draft" | "published"
  thumbnail: string | null
}

// Mock data
const mockMembershipStatus: MembershipStatus = "pending"
const mockGraceDaysRemaining = 5
const mockNextRenewal = "15 de Febrero, 2026"


const availableTherapies = [
  "Reiki",
  "Constelaciones Familiares",
  "Meditación",
  "Yoga",
  "Masajes",
  "Aromaterapia",
  "Flores de Bach",
  "Reflexología",
  "Terapia de Sonido",
  "Sanación con Cristales",
]

const initialProfile: TherapistProfile = {
  fullName: "María González",
  location: "Buenos Aires, Argentina",
  therapies: ["Reiki", "Meditación", "Constelaciones Familiares"],
  bio: "Terapeuta holística con más de 10 años de experiencia en sanación energética y acompañamiento emocional. Mi enfoque integra diversas técnicas para ayudarte a encontrar tu equilibrio interior.",
  payoutInfo: "maria.gonzalez.cbu",
}

const initialPhotos: Photo[] = [
  { id: 1, url: "/Tito.png" },
  { id: 2, url: "/meditation-workshop.png" },
  { id: 3, url: null },
  { id: 4, url: null },
  { id: 5, url: null },
]

const initialCourses: Course[] = [
  {
    id: 1,
    title: "Introducción al Reiki Nivel I",
    description: "Aprende los fundamentos del Reiki y cómo canalizar energía sanadora.",
    price: 4500,
    status: "published",
    thumbnail: "/reiki-therapy-session.jpg",
  },
  {
    id: 2,
    title: "Meditación para el Día a Día",
    description: "Técnicas prácticas de meditación para incorporar en tu rutina diaria.",
    price: 2800,
    status: "draft",
    thumbnail: "/meditation-workshop-moon.jpg",
  },
]



// Status Badge Component
function StatusBadge({ status }: { status: MembershipStatus }) {
  const config = {
    active: { label: "Activa", className: "bg-green-500/20 text-green-400 border-green-500/50" },
    pending: { label: "Pendiente", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" },
    inactive: { label: "Inactiva", className: "bg-red-500/20 text-red-400 border-red-500/50" },
  }
  const { label, className } = config[status]
  return <Badge variant="outline" className={className}>{label}</Badge>
}




// Membership Section
function MembershipSection({
  status,
  checkout,
  loading,
}: {
  status: MembershipStatus
  checkout: () => Promise<string | null>
  loading: boolean
}) {
  

  const handlePayment = async () => {
    if (loading) return
  
    try {
      const url = await checkout()
      if (!url) {
        throw new Error("No se pudo iniciar el pago")
      }
  
      window.location.href = url
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Error al iniciar el pago")
    }
  }
  
  

 /*  const handlePayment = async () => {
    if (loading) return

    setLoading(true)
    toast.loading("Redirigiendo a Mercado Pago...")

    try {
      const res = await apiFetch<{ checkout_url: string }>(
        "/therapist/membership/checkout",
        {
          method: "POST",
          body: JSON.stringify({ plan_months: 3 })// después lo hacés dinámico
        }
      )

      if (!res.checkout_url) {
        throw new Error("No se recibió URL de pago")
      }

      window.location.href = res.checkout_url
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "No se pudo iniciar el pago")
      setLoading(false)
    }
  } */


  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">Membresía</h2>
        <p className="text-muted-foreground">Gestiona tu suscripción a Constelación Viva</p>
      </div>

      {/* Status Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Estado de tu membresía</CardTitle>
            <StatusBadge status={status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/20 p-3">
              {status === "active" && <Check className="h-6 w-6 text-green-400" />}
              {status === "pending" && <Clock className="h-6 w-6 text-yellow-400" />}
              {status === "inactive" && <XCircle className="h-6 w-6 text-red-400" />}
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">$7 USD / mes</p>
              <p className="text-sm text-muted-foreground">Planes disponibles: 3, 6 o 12 meses</p>
            </div>
          </div>

          {status === "pending" && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Período de gracia de 7 días</span>
              </div>
              <p className="mt-1 text-sm text-yellow-400/80">
                Tu gracia termina en <strong>{mockGraceDaysRemaining} días</strong>
              </p>
            </div>
          )}

          {status === "active" && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                Próxima renovación: <span className="text-foreground font-medium">{mockNextRenewal}</span>
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-3">
          {status === "active" ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" disabled className="border-border text-muted-foreground bg-transparent">
                    Gestionar plan
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>ToDo (Objetivo 2)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <>
             <Button
                onClick={handlePayment}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {loading ? "Redirigiendo..." : "Pagar membresía"}
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/planes">
                    <Button variant="outline" className="border-border bg-primary text-muted-foreground">
                      Ver planes
                    </Button>
                    </Link>
                  </TooltipTrigger>
             
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </CardFooter>
      </Card>

      {/* Info Alert */}
      <Alert className="border-primary/50 bg-primary/10">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertTitle className="text-foreground">Importante</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Solo los terapeutas con membresía <strong className="text-foreground">Activa</strong> aparecen en el directorio público de{" "}
          <span className="text-primary">/nuestrosterapeutas</span>.
        </AlertDescription>
      </Alert>
    </div>
  )
}

// Profile Section
function ProfileSection() {
  
  const [profile, setProfile] = useState<TherapistProfile>(initialProfile)
  const [customTherapy, setCustomTherapy] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const maxBioLength = 500

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast("Perfil guardado")
  }

  const handleCancel = () => {
    setProfile(initialProfile)
  }

  const toggleTherapy = (therapy: string) => {
    setProfile((prev) => ({
      ...prev,
      therapies: prev.therapies.includes(therapy)
        ? prev.therapies.filter((t) => t !== therapy)
        : [...prev.therapies, therapy],
    }))
  }

  const addCustomTherapy = () => {
    if (customTherapy.trim() && !profile.therapies.includes(customTherapy.trim())) {
      setProfile((prev) => ({
        ...prev,
        therapies: [...prev.therapies, customTherapy.trim()],
      }))
      setCustomTherapy("")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">Perfil</h2>
        <p className="text-muted-foreground">Edita tu información pública</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Información del perfil</CardTitle>
            <CardDescription>Esta información será visible en el directorio público</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground">Nombre completo</Label>
              <Input
                id="fullName"
                value={profile.fullName}
                onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                className="border-border bg-input text-foreground"
                placeholder="Tu nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-foreground">Ubicación</Label>
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => setProfile((prev) => ({ ...prev, location: e.target.value }))}
                className="border-border bg-input text-foreground"
                placeholder="Ciudad, Provincia"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Terapias</Label>
              <div className="flex flex-wrap gap-2">
                {availableTherapies.map((therapy) => (
                  <Badge
                    key={therapy}
                    variant={profile.therapies.includes(therapy) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      profile.therapies.includes(therapy)
                        ? "bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                    onClick={() => toggleTherapy(therapy)}
                  >
                    {therapy}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={customTherapy}
                  onChange={(e) => setCustomTherapy(e.target.value)}
                  placeholder="Agregar terapia personalizada"
                  className="border-border bg-input text-foreground"
                  onKeyDown={(e) => e.key === "Enter" && addCustomTherapy()}
                />
                <Button onClick={addCustomTherapy} variant="outline" size="icon" className="border-border bg-transparent">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio" className="text-foreground">Biografía</Label>
                <span className={`text-xs ${profile.bio.length > maxBioLength ? "text-destructive" : "text-muted-foreground"}`}>
                  {profile.bio.length}/{maxBioLength}
                </span>
              </div>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                className="min-h-[120px] border-border bg-input text-foreground resize-none"
                placeholder="Cuéntanos sobre ti y tu experiencia..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payoutInfo" className="text-foreground">Información de pago (CBU o Alias)</Label>
              <Input
                id="payoutInfo"
                value={profile.payoutInfo}
                onChange={(e) => setProfile((prev) => ({ ...prev, payoutInfo: e.target.value }))}
                className="border-border bg-input text-foreground"
                placeholder="Tu CBU o Alias para recibir pagos"
              />
              <p className="text-xs text-muted-foreground">
                Esta información es privada y solo se usará para transferirte pagos de tus cursos.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button onClick={handleCancel} variant="outline" className="border-border bg-transparent text-foreground">
              Cancelar
            </Button>
          </CardFooter>
        </Card>

        {/* Preview */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Vista previa del perfil público</CardTitle>
            <CardDescription>Así se verá tu perfil en el directorio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border bg-secondary p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarImage src="/woman-therapist-portrait.png" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile.fullName.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-serif text-xl font-semibold text-foreground">{profile.fullName || "Tu nombre"}</h3>
                  <p className="text-sm text-muted-foreground">{profile.location || "Tu ubicación"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.therapies.length > 0 ? (
                  profile.therapies.map((therapy) => (
                    <Badge key={therapy} variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                      {therapy}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground italic">Selecciona tus terapias</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile.bio || "Tu biografía aparecerá aquí..."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Photos Section
function PhotosSection() {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [dragOver, setDragOver] = useState(false)

  const handleUpload = useCallback((slotId: number) => {
    // Simulate upload
    setPhotos((prev) =>
      prev.map((p) => (p.id === slotId ? { ...p, uploading: true, progress: 0 } : p))
    )

    const interval = setInterval(() => {
      setPhotos((prev) =>
        prev.map((p) => {
          if (p.id === slotId && p.uploading) {
            const newProgress = (p.progress || 0) + 20
            if (newProgress >= 100) {
              clearInterval(interval)
              toast("Foto subida")
              return { ...p, uploading: false, progress: undefined, url: "/holistic-therapy-nature-meditation.jpg" }
            }
            return { ...p, progress: newProgress }
          }
          return p
        })
      )
    }, 300)
  }, [toast])

  const handleRemove = (slotId: number) => {
    setPhotos((prev) => prev.map((p) => (p.id === slotId ? { ...p, url: null } : p)))
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const emptySlot = photos.find((p) => !p.url && !p.uploading)
      if (emptySlot) {
        handleUpload(emptySlot.id)
      }
    },
    [photos, handleUpload]
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">Fotos</h2>
        <p className="text-muted-foreground">Sube hasta 5 fotos para tu perfil</p>
      </div>

      {/* Guidelines */}
      <Alert className="border-border bg-card">
        <ImageIcon className="h-4 w-4 text-primary" />
        <AlertTitle className="text-foreground">Guías para tus fotos</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Formatos aceptados: JPG, PNG, WebP</li>
            <li>Tamaño máximo: 5MB por imagen</li>
            <li>Relación de aspecto recomendada: 4:3 o 1:1</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/10" : "border-border"
        }`}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-foreground font-medium">Arrastra y suelta tus fotos aquí</p>
        <p className="text-sm text-muted-foreground">o haz clic en los slots de abajo para subir</p>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="border-border bg-card overflow-hidden">
            <div className="relative aspect-square">
              {photo.url ? (
                <>
                  <Image src={photo.url || "/placeholder.svg"} alt={`Foto ${photo.id}`} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleUpload(photo.id)}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reemplazar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleRemove(photo.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </>
              ) : photo.uploading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary">
                  <Upload className="h-8 w-8 text-primary animate-pulse" />
                  <Progress value={photo.progress} className="w-3/4 mt-2" />
                  <span className="text-xs text-muted-foreground mt-1">{photo.progress}%</span>
                </div>
              ) : (
                <button
                  onClick={() => handleUpload(photo.id)}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-2">Subir foto</span>
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Courses Section
function CoursesSection() {
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [newCourseOpen, setNewCourseOpen] = useState(false)
  const [newCourse, setNewCourse] = useState({ title: "", description: "", price: "" })

  const handleCreateCourse = () => {
    if (!newCourse.title.trim()) return

    const course: Course = {
      id: courses.length + 1,
      title: newCourse.title,
      description: newCourse.description,
      price: Number.parseFloat(newCourse.price) || 0,
      status: "draft",
      thumbnail: null,
    }
    setCourses((prev) => [...prev, course])
    setNewCourse({ title: "", description: "", price: "" })
    setNewCourseOpen(false)
    toast("Curso creado")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Cursos</h2>
          <p className="text-muted-foreground">Crea y gestiona tus cursos</p>
        </div>
        <Dialog open={newCourseOpen} onOpenChange={setNewCourseOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo curso
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card">
            <DialogHeader>
              <DialogTitle className="text-foreground">Crear nuevo curso</DialogTitle>
              <DialogDescription>Completa la información básica de tu curso</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="courseTitle" className="text-foreground">Título del curso</Label>
                <Input
                  id="courseTitle"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Introducción al Reiki"
                  className="border-border bg-input text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseDesc" className="text-foreground">Descripción</Label>
                <Textarea
                  id="courseDesc"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe tu curso..."
                  className="border-border bg-input text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coursePrice" className="text-foreground">Precio (ARS)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="coursePrice"
                    type="number"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="0"
                    className="pl-9 border-border bg-input text-foreground"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewCourseOpen(false)} className="border-border bg-transparent text-foreground">
                Cancelar
              </Button>
              <Button onClick={handleCreateCourse} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Crear curso
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No tienes cursos aún</h3>
            <p className="text-sm text-muted-foreground">Crea tu primer curso para comenzar a enseñar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Card key={course.id} className="border-border bg-card overflow-hidden">
              <div className="relative h-40">
                {course.thumbnail ? (
                  <Image src={course.thumbnail || "/placeholder.svg"} alt={course.title} fill className="object-cover" />
                ) : (
                  <div className="h-full bg-secondary flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <Badge
                  variant={course.status === "published" ? "default" : "secondary"}
                  className="absolute top-3 right-3"
                >
                  {course.status === "published" ? "Publicado" : "Borrador"}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground">{course.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{course.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-lg font-bold text-primary">${course.price.toLocaleString()}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" disabled className="border-border bg-transparent text-muted-foreground">
                          Editar
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>ToDo (Objetivo 2)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Main Dashboard Component
export default function TherapistDashboardPage() {
  const [activeTab, setActiveTab] = useState("membership")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const {
    membership,
    loading,
    fetchMembership,
    checkout,
  } = useMembershipStore()

  useEffect(() => {
    fetchMembership()
  }, [fetchMembership])


  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} className="fixed left-0 top-0 hidden h-screen w-64 lg:flex" />

        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 border-border bg-card">
                <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setSidebarOpen(false) }} />
              </SheetContent>
            </Sheet>
            <Image
              src="/images/logo-20amarillo.png"
              alt="Constelación Viva"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="font-serif font-semibold text-foreground">Constelación Viva</span>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-foreground">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/woman-therapist-portrait.png" />
                  <AvatarFallback className="bg-primary text-primary-foreground">MG</AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-border bg-card">
              <DropdownMenuItem disabled className="text-muted-foreground">
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem disabled className="text-muted-foreground">
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Desktop Header */}
        <header className="sticky top-0 z-40 hidden h-16 items-center justify-end border-b border-border bg-card px-6 lg:ml-64 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-foreground">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/woman-therapist-portrait.png" />
                  <AvatarFallback className="bg-primary text-primary-foreground">MG</AvatarFallback>
                </Avatar>
                <span className="text-sm">María González</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-border bg-card">
              <DropdownMenuItem disabled className="text-muted-foreground">
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem disabled className="text-muted-foreground">
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main Content */}
        <main className="p-6 lg:ml-64">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-card lg:hidden">
              <TabsTrigger value="membership" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <CreditCard className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Membresía</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <User className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="photos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ImageIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Fotos</span>
              </TabsTrigger>
              <TabsTrigger value="courses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BookOpen className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cursos</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="membership">
              {membership && (
                <MembershipSection
                  status={membership.status}
                  checkout={checkout}
                  loading={loading}
                />
              )}
            </TabsContent>

            <TabsContent value="profile">
              <ProfileSection />
            </TabsContent>
            <TabsContent value="photos">
              <PhotosSection />
            </TabsContent>
            <TabsContent value="courses">
              <CoursesSection />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  )
}

