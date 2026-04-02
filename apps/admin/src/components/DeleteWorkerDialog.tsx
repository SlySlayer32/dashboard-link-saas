import type { Worker } from '@dashboard-link/shared'
import { ConfirmDialog } from './ui/ConfirmDialog'

interface DeleteWorkerDialogProps {
  worker: Worker | null
  isOpen: boolean
  isLoading?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteWorkerDialog({
  worker,
  isOpen,
  isLoading = false,
  onClose,
  onConfirm,
}: DeleteWorkerDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen && !!worker}
      onClose={onClose}
      onConfirm={onConfirm}
      title='Delete Worker'
      message={
        worker
          ? `Delete ${worker.name}? Historical data will be preserved.`
          : 'Delete this worker? Historical data will be preserved.'
      }
      confirmText='Delete Worker'
      cancelText='Cancel'
      variant='destructive'
      isLoading={isLoading}
    />
  )
}
