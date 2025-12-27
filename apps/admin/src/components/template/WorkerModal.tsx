import { Worker } from '@dashboard-link/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

// Form schema
const workerFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  active: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
})

type WorkerFormData = z.infer<typeof workerFormSchema>

interface WorkerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: WorkerFormData) => Promise<void>
  isLoading?: boolean
  title: string
  initialData?: Partial<Worker>
}

export const WorkerModal: React.FC<WorkerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  title,
  initialData,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<WorkerFormData>({
    resolver: zodResolver(workerFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      active: true,
      metadata: {},
    },
  })

  // Reset form when initial data changes
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        active: initialData.active ?? true,
        metadata: initialData.metadata || {},
      })
    } else {
      reset({
        name: '',
        phone: '',
        email: '',
        active: true,
        metadata: {},
      })
    }
  }, [initialData, reset])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  const handleFormSubmit = async (data: WorkerFormData) => {
    // Clean up empty email
    if (data.email === '') {
      data.email = undefined
    }

    await onSubmit(data)
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
        {/* Background overlay */}
        <div
          className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
          onClick={onClose}
        />

        {/* Center modal */}
        <span className='hidden sm:inline-block sm:align-middle sm:h-screen'>&#8203;</span>

        <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
              <div className='mb-4'>
                <h3 className='text-lg leading-6 font-medium text-gray-900'>{title}</h3>
              </div>

              <div className='space-y-4'>
                {/* Name */}
                <div>
                  <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                    Name <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    id='name'
                    type='text'
                    {...register('name')}
                    error={errors.name?.message}
                    placeholder='Enter worker name'
                    disabled={isLoading}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor='phone' className='block text-sm font-medium text-gray-700'>
                    Phone Number <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    id='phone'
                    type='tel'
                    {...register('phone')}
                    error={errors.phone?.message}
                    placeholder='+61412345678'
                    disabled={isLoading}
                  />
                  <p className='mt-1 text-xs text-gray-500'>
                    Include country code (e.g., +61 for Australia)
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                    Email
                  </label>
                  <Input
                    id='email'
                    type='email'
                    {...register('email')}
                    error={errors.email?.message}
                    placeholder='worker@example.com'
                    disabled={isLoading}
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor='active' className='block text-sm font-medium text-gray-700'>
                    Status
                  </label>
                  <Select id='active' {...register('active')} disabled={isLoading}>
                    <option value='true'>Active</option>
                    <option value='false'>Inactive</option>
                  </Select>
                </div>

                {/* Metadata (Advanced) */}
                <details className='mt-4'>
                  <summary className='cursor-pointer text-sm font-medium text-gray-700'>
                    Advanced Options
                  </summary>
                  <div className='mt-2'>
                    <label htmlFor='metadata' className='block text-sm font-medium text-gray-700'>
                      Metadata (JSON)
                    </label>
                    <textarea
                      id='metadata'
                      rows={3}
                      className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                      placeholder='{"key": "value"}'
                      disabled={isLoading}
                      onChange={(e) => {
                        try {
                          JSON.parse(e.target.value)
                          // Register the value manually since it's not a standard input
                          // Note: In a real implementation, you'd use a controlled component
                        } catch {
                          // Invalid JSON, but don't show error until form submission
                        }
                      }}
                    />
                    <p className='mt-1 text-xs text-gray-500'>
                      Additional key-value pairs for the worker
                    </p>
                  </div>
                </details>
              </div>
            </div>

            <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
              <Button
                type='submit'
                disabled={!isDirty || isLoading}
                isLoading={isLoading}
                className='w-full sm:ml-3 sm:w-auto'
              >
                {initialData ? 'Update' : 'Create'} Worker
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={isLoading}
                className='mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto'
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
