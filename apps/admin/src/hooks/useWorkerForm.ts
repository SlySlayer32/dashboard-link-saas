import type { Worker } from '@dashboard-link/shared'
import type { WorkerFormData } from '../components/WorkerForm'
import { useCreateWorker, useUpdateWorker } from './useWorkerMutation'

// Hook to handle worker form submission
export function useWorkerForm(worker?: Worker, onClose?: () => void) {
  const createWorker = useCreateWorker()
  const updateWorker = useUpdateWorker(worker?.id || '')

  const handleSubmit = async (data: WorkerFormData) => {
    try {
      if (worker) {
        // Update existing worker
        await updateWorker.mutateAsync(data)
      } else {
        // Create new worker
        await createWorker.mutateAsync(data)
      }

      // Close form/modal if provided
      if (onClose) {
        onClose()
      }
    } catch (error) {
      // Error is handled by the mutation hooks
      console.error('Worker form submission error:', error)
    }
  }

  return {
    handleSubmit,
    isLoading: createWorker.isPending || updateWorker.isPending,
  }
}
