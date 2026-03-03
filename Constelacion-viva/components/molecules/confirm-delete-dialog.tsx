"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/atoms/button"

interface ConfirmDeleteDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title?: string
  description?: string
  loading?: boolean
  confirmText?: string
  loadingText?: string
}

export function ConfirmDeleteDialog({
  open,
  onConfirm,
  onCancel,
  title = "Confirmar eliminación",
  description = "Esta acción no se puede deshacer.",
  loading = false,
  confirmText = "Eliminar",
  loadingText = "Eliminando...",
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        // Evitar cerrar el modal durante la acción destructiva
        if (!val && loading) return
        if (!val) onCancel()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? loadingText : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

