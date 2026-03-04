"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Upload, Pencil, Trash2, Eye, ImageIcon, Video, Users, BookOpen, GraduationCap, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { GalleryCategory, GalleryItem, GalleryType, useGallery } from "@/hooks/useGallery"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAdminTherapists } from "@/hooks/useAdminTherapist"
import { backendLogout, logout } from "@/lib/auth"

type UiTherapistRow = {
  id: number
  name: string
  email: string
  role: string
  membershipStatus: "Activa" | "Pendiente" | "Inactiva"
  paymentStatus: "Pagado" | "Pendiente" | "Vencido" | "N/A"
}

// Mock data for courses
const courses = [
  { id: 1, name: "Introducción al Reiki", author: "María González", lessons: 12, students: 45, status: "Publicado" },
  { id: 2, name: "Meditación para Principiantes", author: "Carlos Rodríguez", lessons: 8, students: 78, status: "Publicado" },
  { id: 3, name: "Constelaciones Familiares", author: "Ana Martínez", lessons: 15, students: 0, status: "Borrador" },
  { id: 4, name: "Yoga Terapéutico", author: "Laura Fernández", lessons: 20, students: 32, status: "Publicado" },
  { id: 5, name: "Sanación con Cristales", author: "Roberto Sánchez", lessons: 6, students: 0, status: "Borrador" },
]

function getMembershipBadgeVariant(status: string) {
  switch (status) {
    case "Activa":
      return "default"
    case "Pendiente":
      return "secondary"
    case "Inactiva":
      return "destructive"
    default:
      return "outline"
  }
}

function getPaymentBadgeVariant(status: string) {
  switch (status) {
    case "Pagado":
      return "default"
    case "Pendiente":
      return "secondary"
    case "Vencido":
      return "destructive"
    default:
      return "outline"
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "Publicado":
      return "default"
    case "Borrador":
      return "secondary"
    default:
      return "outline"
  }
}

export default function AdminDashboardPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadType, setUploadType] = useState<GalleryType | undefined>(undefined)
  const [uploadCategory, setUploadCategory] = useState<GalleryCategory | undefined>(undefined)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [membershipFilter, setMembershipFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")

  const { data: adminTherapists, loading: therapistsLoading, error: therapistsError } = useAdminTherapists()

  useEffect(() => {
    if (therapistsError) {
      toast.error(therapistsError)
    }
  }, [therapistsError])

  //state
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  //edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<GalleryItem | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editCategory, setEditCategory] = useState<GalleryCategory | undefined>(undefined)
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const therapistRows: UiTherapistRow[] = useMemo(() => {
    const mapMembership = (s: string): UiTherapistRow["membershipStatus"] => {
      if (s === "active") return "Activa"
      if (s === "pending") return "Pendiente"
      return "Inactiva"
    }
    const mapPayment = (s: string): UiTherapistRow["paymentStatus"] => {
      if (s === "paid") return "Pagado"
      if (s === "pending") return "Pendiente"
      if (s === "overdue") return "Vencido"
      return "N/A"
    }
    return (adminTherapists || []).map((t) => ({
      id: t.id,
      name: t.full_name,
      email: t.email,
      role: "Terapeuta",
      membershipStatus: mapMembership(t.membership_status),
      paymentStatus: mapPayment(t.payment_status),
    }))
  }, [adminTherapists])

  const filteredTherapists = useMemo(() => {
    return therapistRows.filter((therapist) => {
      const membershipMatch = membershipFilter === "all" || therapist.membershipStatus === membershipFilter
      const paymentMatch = paymentFilter === "all" || therapist.paymentStatus === paymentFilter
      return membershipMatch && paymentMatch
    })
  }, [therapistRows, membershipFilter, paymentFilter])

  //mock data
  const totalCourses = courses.length
  const publishedCourses = courses.filter((c) => c.status === "Publicado").length
  const totalStudents = courses.reduce((acc, c) => acc + c.students, 0)
  const router = useRouter()

  //hooks
  //gallery
  const {
    data: gallery,
    loading: galleryLoading,
    error: galleryError,
    createItem,
    deleteItem,
    updateItem,
  } = useGallery()

  const resetUploadForm = () => {
    setUploadFile(null)
    setUploadTitle("")
    setUploadType(undefined)
    setUploadCategory(undefined)
    setUploadError(null)
    setFileInputKey((k) => k + 1)
  }

  const handleUploadOpenChange = (open: boolean) => {
    // Evitar cerrar el modal a mitad de una subida (reduce estados inconsistentes)
    if (!open && uploading) return
    setUploadDialogOpen(open)
    if (!open) resetUploadForm()
    if (open) setUploadError(null)
  }

  const submitUpload = async () => {
    if (uploading) return
    setUploadError(null)

    const title = uploadTitle.trim()
    if (!uploadFile) {
      const msg = "Seleccioná un archivo para subir."
      setUploadError(msg)
      toast.error(msg)
      return
    }
    if (!title) {
      const msg = "Ingresá un título."
      setUploadError(msg)
      toast.error(msg)
      return
    }
    if (!uploadType) {
      const msg = "Seleccioná el tipo (imagen o video)."
      setUploadError(msg)
      toast.error(msg)
      return
    }
    if (!uploadCategory) {
      const msg = "Seleccioná una categoría."
      setUploadError(msg)
      toast.error(msg)
      return
    }

    setUploading(true)
    try {
      await createItem({
        title,
        type: uploadType,
        category: uploadCategory,
        file: uploadFile,
      })
      toast.success("Contenido subido correctamente")
      setUploadDialogOpen(false)
      resetUploadForm()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo subir el contenido."
      setUploadError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const openDelete = (item: GalleryItem) => {
    setSelectedItem(item)
    setConfirmDeleteId(item.id)
    setDeleteError(null)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!confirmDeleteId) return
    if (deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteItem(confirmDeleteId)
      toast.success("Contenido eliminado")
      setDeleteDialogOpen(false)
      setConfirmDeleteId(null)
      setSelectedItem(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo eliminar el contenido."
      setDeleteError(msg)
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  const openEdit = (item: GalleryItem) => {
    setEditItem(item)
    setEditTitle(item.title)
    setEditCategory(item.category)
    setEditError(null)
    setEditDialogOpen(true)
  }

  const handleEditOpenChange = (open: boolean) => {
    if (!open && editing) return
    setEditDialogOpen(open)
    if (!open) {
      setEditItem(null)
      setEditTitle("")
      setEditCategory(undefined)
      setEditError(null)
    }
  }

  const submitEdit = async () => {
    if (!editItem) return
    if (editing) return

    setEditError(null)
    const title = editTitle.trim()

    if (!title) {
      const msg = "Ingresá un título."
      setEditError(msg)
      toast.error(msg)
      return
    }
    if (!editCategory) {
      const msg = "Seleccioná una categoría."
      setEditError(msg)
      toast.error(msg)
      return
    }

    const hasChanges = title !== editItem.title || editCategory !== editItem.category
    if (!hasChanges) {
      toast.message("No hay cambios para guardar")
      return
    }

    setEditing(true)
    try {
      await updateItem(editItem.id, { title, category: editCategory })
      toast.success("Contenido actualizado")
      setEditDialogOpen(false)
      setEditItem(null)
      setEditTitle("")
      setEditCategory(undefined)
      setEditError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo actualizar el contenido."
      setEditError(msg)
      toast.error(msg)
    } finally {
      setEditing(false)
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-primary md:text-4xl">Panel de Administración</h1>
          <p className="mt-2 text-muted-foreground">Gestión general de la plataforma</p>
        
        </header>
        <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/")}
          className="h-8 w-8 text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver</span>
        </Button>
        <div className="flex items-center gap-2">
          <button
          onClick={() => {
            backendLogout().catch(() => null)
            logout()
            router.push("/")
          }}
          className="w-20 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium transition"
        >
          logout
        </button>
          </div>
        </div>


        {/* Main Content with Tabs */}
        <Tabs defaultValue="galeria" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card">
            <TabsTrigger value="galeria" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Galería
            </TabsTrigger>
            <TabsTrigger value="memberships" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Membresías
            </TabsTrigger>
            <TabsTrigger value="cursos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Cursos
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Galería */}
          <TabsContent value="galeria" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Contenido de la Galería</CardTitle>
                  <CardDescription>Gestiona las imágenes y videos públicos</CardDescription>
                </div>
                <Dialog open={uploadDialogOpen} onOpenChange={handleUploadOpenChange}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Upload className="mr-2 h-4 w-4" />
                      Subir contenido
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-border bg-card sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Subir nuevo contenido</DialogTitle>
                      <DialogDescription>Añade una nueva imagen o video a la galería pública.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="file" className="text-foreground">
                          Archivo
                        </Label>
                        <Input
                          key={fileInputKey}
                          id="file"
                          type="file"
                          accept="image/*,video/*"
                          className="border-border bg-input text-foreground"
                          disabled={uploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setUploadFile(file)
                            if (file && !uploadType) {
                              setUploadType(file.type.startsWith("video/") ? "video" : "image")
                            }
                          }}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="title" className="text-foreground">
                          Título
                        </Label>
                        <Input
                          id="title"
                          placeholder="Nombre del contenido"
                          className="border-border bg-input text-foreground placeholder:text-muted-foreground"
                          value={uploadTitle}
                          disabled={uploading}
                          onChange={(e) => setUploadTitle(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="type" className="text-foreground">
                          Tipo
                        </Label>
                        <Select value={uploadType} onValueChange={(v) => setUploadType(v as GalleryType)} disabled={uploading}>
                          <SelectTrigger className="border-border bg-input text-foreground">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent className="border-border bg-card">
                            <SelectItem value="image">Imagen</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="category" className="text-foreground">
                          Categoría
                        </Label>
                        <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as GalleryCategory)} disabled={uploading}>
                          <SelectTrigger className="border-border bg-input text-foreground">
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent className="border-border bg-card">
                            <SelectItem value="eventos">Eventos</SelectItem>
                            <SelectItem value="terapeutas">Terapeutas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={submitUpload}
                        disabled={uploading}
                      >
                        {uploading ? "Subiendo..." : "Subir"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {galleryError ? <p className="mb-4 text-sm text-destructive">{galleryError.message}</p> : null}
                {galleryLoading && !gallery ? <p className="mb-4 text-sm text-muted-foreground">Cargando galería...</p> : null}
                {gallery && gallery.length === 0 ? <p className="mb-4 text-sm text-muted-foreground">Todavía no hay contenido.</p> : null}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gallery?.map((item) => (
                    <Card key={item.id} className="overflow-hidden border-border bg-secondary">
                      <div className="relative aspect-video">
                        {item.type === "video" ? (
                          <video
                            className="h-full w-full object-cover"
                            src={item.src}
                            controls
                            preload="metadata"
                          />
                        ) : (
                          <Image src={item.src || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                        )}
                        <div className="absolute right-2 top-2">
                          <Badge variant="outline" className="border-primary/50 bg-background/80 text-foreground">
                            {item.type === "image" ? <ImageIcon className="mr-1 h-3 w-3" /> : <Video className="mr-1 h-3 w-3" />}
                            {item.type === "image" ? "Imagen" : "Video"}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-foreground">{item.title}</h3>
                            <Badge variant="secondary" className="mt-1">
                              {item.category}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => openEdit(item)}
                              disabled={uploading || deleting || editing}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => openDelete(item)}
                              disabled={uploading || deleting || editing}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Dialog
                  open={deleteDialogOpen}
                  onOpenChange={(open) => {
                    if (!open && deleting) return
                    setDeleteDialogOpen(open)
                    if (!open) {
                      setConfirmDeleteId(null)
                      setSelectedItem(null)
                      setDeleteError(null)
                    }
                  }}
                >
                  <DialogContent className="border-border bg-card sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Eliminar contenido</DialogTitle>
                      <DialogDescription>
                        {selectedItem ? (
                          <>
                            ¿Seguro que querés eliminar <span className="font-medium text-foreground">“{selectedItem.title}”</span>? Esto también lo elimina de S3.
                          </>
                        ) : (
                          "¿Seguro que querés eliminar este contenido?"
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
                    <DialogFooter>
                      <Button type="button" variant="outline" disabled={deleting} onClick={() => setDeleteDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="button" disabled={deleting} onClick={confirmDelete}>
                        {deleting ? "Eliminando..." : "Eliminar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={editDialogOpen} onOpenChange={handleEditOpenChange}>
                  <DialogContent className="border-border bg-card sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Editar contenido</DialogTitle>
                      <DialogDescription>Podés editar el título y la categoría. El archivo no se puede cambiar.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-title" className="text-foreground">
                          Título
                        </Label>
                        <Input
                          id="edit-title"
                          className="border-border bg-input text-foreground placeholder:text-muted-foreground"
                          value={editTitle}
                          disabled={editing}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-category" className="text-foreground">
                          Categoría
                        </Label>
                        <Select
                          value={editCategory}
                          onValueChange={(v) => setEditCategory(v as GalleryCategory)}
                          disabled={editing}
                        >
                          <SelectTrigger id="edit-category" className="border-border bg-input text-foreground">
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent className="border-border bg-card">
                            <SelectItem value="eventos">Eventos</SelectItem>
                            <SelectItem value="terapeutas">Terapeutas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {editError ? <p className="text-sm text-destructive">{editError}</p> : null}
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" disabled={editing} onClick={() => setEditDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="button" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={editing} onClick={submitEdit}>
                        {editing ? "Guardando..." : "Guardar cambios"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Memberships */}
          <TabsContent value="memberships" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Terapeutas y Membresías</CardTitle>
                <CardDescription>Visualiza el estado de los terapeutas y sus pagos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="membershipFilter" className="text-sm text-muted-foreground">
                      Estado membresía:
                    </Label>
                    <Select value={membershipFilter} onValueChange={setMembershipFilter}>
                      <SelectTrigger id="membershipFilter" className="w-[150px] border-border bg-input text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Activa">Activa</SelectItem>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="Inactiva">Inactiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="paymentFilter" className="text-sm text-muted-foreground">
                      Estado pago:
                    </Label>
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                      <SelectTrigger id="paymentFilter" className="w-[150px] border-border bg-input text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Pagado">Pagado</SelectItem>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="Vencido">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Table */}
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-secondary">
                        <TableHead className="text-muted-foreground">Nombre</TableHead>
                        <TableHead className="text-muted-foreground">Email</TableHead>
                        <TableHead className="text-muted-foreground">Rol</TableHead>
                        <TableHead className="text-muted-foreground">Membresía</TableHead>
                        <TableHead className="text-muted-foreground">Pago</TableHead>
                        <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {therapistsLoading && (
                        <TableRow className="border-border">
                          <TableCell colSpan={6} className="text-muted-foreground">
                            Cargando terapeutas…
                          </TableCell>
                        </TableRow>
                      )}

                      {!therapistsLoading && filteredTherapists.length === 0 && (
                        <TableRow className="border-border">
                          <TableCell colSpan={6} className="text-muted-foreground">
                            No hay terapeutas para los filtros actuales.
                          </TableCell>
                        </TableRow>
                      )}

                      {!therapistsLoading &&
                        filteredTherapists.map((therapist) => (
                          <TableRow key={therapist.id} className="border-border hover:bg-secondary">
                            <TableCell className="font-medium text-foreground">{therapist.name}</TableCell>
                            <TableCell className="text-muted-foreground">{therapist.email}</TableCell>
                            <TableCell className="text-foreground">{therapist.role}</TableCell>
                            <TableCell>
                              <Badge variant={getMembershipBadgeVariant(therapist.membershipStatus)}>
                                {therapist.membershipStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getPaymentBadgeVariant(therapist.paymentStatus)}>
                                {therapist.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex">
                                    <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
                                      <Eye className="mr-1 h-4 w-4" />
                                      Ver perfil
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Acción pendiente (Objetivo 2: routing + endpoint perfil terapeuta)</TooltipContent>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Cursos */}
          <TabsContent value="cursos" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border bg-card">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="rounded-full bg-primary/20 p-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cursos</p>
                    <p className="text-2xl font-bold text-foreground">{totalCourses}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="rounded-full bg-primary/20 p-3">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cursos Publicados</p>
                    <p className="text-2xl font-bold text-foreground">{publishedCourses}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="rounded-full bg-primary/20 p-3">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Estudiantes</p>
                    <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Courses Table */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Gestión de Cursos</CardTitle>
                <CardDescription>Control global de cursos en la plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-secondary">
                        <TableHead className="text-muted-foreground">Curso</TableHead>
                        <TableHead className="text-muted-foreground">Autor</TableHead>
                        <TableHead className="text-muted-foreground">Lecciones</TableHead>
                        <TableHead className="text-muted-foreground">Estudiantes</TableHead>
                        <TableHead className="text-muted-foreground">Estado</TableHead>
                        <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id} className="border-border hover:bg-secondary">
                          <TableCell className="font-medium text-foreground">{course.name}</TableCell>
                          <TableCell className="text-muted-foreground">{course.author}</TableCell>
                          <TableCell className="text-foreground">{course.lessons}</TableCell>
                          <TableCell className="text-foreground">{course.students}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(course.status)}>{course.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex">
                                    <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
                                      <Eye className="mr-1 h-4 w-4" />
                                      Ver
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Acción pendiente (Objetivo 2: detalle de curso + routing)</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex">
                                    <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
                                      <Pencil className="mr-1 h-4 w-4" />
                                      Gestionar
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Acción pendiente (Objetivo 2: gestión de curso + permisos)</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </TooltipProvider>
  )
}
