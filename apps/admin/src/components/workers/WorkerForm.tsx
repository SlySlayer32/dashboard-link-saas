import type { Worker } from '@dashboard-link/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useWorkerMutations } from '../../hooks/useWorkers'
import { formatPhoneForDisplay } from '../../utils/phoneUtils'

// Zod schema for worker form validation
const workerFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, {
      message: 'Name cannot be empty',
    }),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^(04\d{2}([\s-]?\d{3}){2}|04\d{8}|\+614\d{8})$/,
      'Invalid Australian mobile number (e.g., 0412 345 678)'
    ),
})

export type WorkerFormData = z.infer<typeof workerFormSchema>

interface WorkerFormProps {
  worker?: Worker
  onSuccess?: () => void
  onCancel?: () => void
}

export function WorkerForm({ worker, onSuccess, onCancel }: WorkerFormProps) {
  const { createWorker, updateWorker } = useWorkerMutations()
  const isEditMode = !!worker

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<WorkerFormData>({
    resolver: zodResolver(workerFormSchema),
    defaultValues: {
      name: worker?.name || '',
      phone: worker?.phone ? formatPhoneForDisplay(worker.phone) : '',
    },
  })

  useEffect(() => {
    reset({
      name: worker?.name || '',
      phone: worker?.phone ? formatPhoneForDisplay(worker.phone) : '',
    })
  }, [worker, reset])

  const onSubmit = async (data: WorkerFormData) => {
    try {
      if (isEditMode) {
        await updateWorker.mutateAsync({
          id: worker.id,
          data: {
            name: data.name,
            phone: data.phone,
            updatedAt: worker.updatedAt, // For last-write-wins conflict detection
          },
        })
      } else {
        await createWorker.mutateAsync({
          name: data.name,
          phone: data.phone,
        })
        reset() // Reset form after successful creation
      }
      onSuccess?.()
    } catch (error) {
      // Error handling is done in the mutation hooks with toast notifications
      console.error('Form submission error:', error)
    }
  }

  return (
    <div className='space-y-4'>
      {/* Name input field */}
      <div>
        <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-1'>
          Name
        </label>
        <input
          id='name'
          type='text'
          {...register('name')}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder='John Smith'
          disabled={isSubmitting}
        />
        {errors.name && <p className='mt-1 text-sm text-red-600'>{errors.name.message}</p>}
      </div>

      {/* Phone input field */}
      <div>
        <label htmlFor='phone' className='block text-sm font-medium text-gray-700 mb-1'>
          Phone Number
        </label>
        <input
          id='phone'
          type='tel'
          {...register('phone')}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder='0412 345 678'
          disabled={isSubmitting}
        />
        {errors.phone && <p className='mt-1 text-sm text-red-600'>{errors.phone.message}</p>}
      </div>

      {/* Form actions */}
      <div className='flex gap-2'>
        <button
          type='button'
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isSubmitting ? 'Saving...' : isEditMode ? 'Update Worker' : 'Add Worker'}
        </button>
        {onCancel && (
          <button
            type='button'
            onClick={onCancel}
            disabled={isSubmitting}
            className='px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
