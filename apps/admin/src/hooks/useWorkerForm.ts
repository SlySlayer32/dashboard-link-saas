import type { Worker } from '@dashboard-link/shared'
import { logger } from '@dashboard-link/shared'
import type { WorkerFormData } from '../components/workers/WorkerForm'
import { useWorkerMutations } from './useWorkers'

// Hook to handle worker form submission
export function useWorkerForm(worker?: Worker, onClose?: () => void) {
  const { createWorker, updateWorker } = useWorkerMutations()

  const handleSubmit = async (data: WorkerFormData) => {
    try {
      if (worker) {
        // Update existing worker
        await updateWorker.mutateAsync({ id: worker.id, data })
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
      logger.error(
        'Worker form submission error',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  return {
    handleSubmit,
    isLoading: createWorker.isPending || updateWorker.isPending,
  }
}
