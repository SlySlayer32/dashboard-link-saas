import { zodResolver } from '@hookform/resolvers/zod'
import { Clock, MapPin, X } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { CreateScheduleItemRequest, UpdateScheduleItemRequest } from '../hooks/useScheduleItems'

const scheduleItemSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    location: z.string().optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.startTime) < new Date(data.endTime)
      }
      return true
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  )

type ScheduleItemFormData = z.infer<typeof scheduleItemSchema>

interface ScheduleItemFormProps {
  workerId?: string
  _workerId?: string
  initialData?: {
    title?: string
    startTime?: string
    endTime?: string
    location?: string
    description?: string
  }
  onSubmit: (data: CreateScheduleItemRequest | UpdateScheduleItemRequest) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

function formatDateTimeForInput(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  // Format as YYYY-MM-DDTHH:MM
  return date.toISOString().slice(0, 16)
}

export function ScheduleItemForm({
  _workerId,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ScheduleItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ScheduleItemFormData>({
    resolver: zodResolver(scheduleItemSchema),
    defaultValues: {
      title: initialData?.title || '',
      startTime: formatDateTimeForInput(initialData?.startTime),
      endTime: formatDateTimeForInput(initialData?.endTime),
      location: initialData?.location || '',
      description: initialData?.description || '',
    },
  })

  const startTime = watch('startTime')

  // Update end time minimum when start time changes
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setValue('startTime', value)
    // Set end time minimum to start time + 30 minutes
    const startDate = new Date(value)
    startDate.setMinutes(startDate.getMinutes() + 30)
    const endTime = watch('endTime')
    if (!endTime || new Date(endTime) <= new Date(value)) {
      setValue('endTime', startDate.toISOString().slice(0, 16))
    }
  }

  const onFormSubmit = async (data: ScheduleItemFormData) => {
    await onSubmit(data)
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='p-6 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold text-gray-900'>
              {initialData ? 'Edit Schedule Item' : 'Add Schedule Item'}
            </h2>
            <button
              onClick={onCancel}
              className='text-gray-400 hover:text-gray-500 transition-colors'
            >
              <X className='h-6 w-6' />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className='p-6 space-y-6'>
          <div>
            <label htmlFor='title' className='block text-sm font-medium text-gray-700 mb-2'>
              Title <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              id='title'
              {...register('title')}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='e.g., Team Meeting, Client Call'
            />
            {errors.title && <p className='mt-1 text-sm text-red-600'>{errors.title.message}</p>}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label htmlFor='startTime' className='block text-sm font-medium text-gray-700 mb-2'>
                Start Time <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <Clock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type='datetime-local'
                  id='startTime'
                  {...register('startTime')}
                  onChange={handleStartTimeChange}
                  className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
              {errors.startTime && (
                <p className='mt-1 text-sm text-red-600'>{errors.startTime.message}</p>
              )}
            </div>

            <div>
              <label htmlFor='endTime' className='block text-sm font-medium text-gray-700 mb-2'>
                End Time <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <Clock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type='datetime-local'
                  id='endTime'
                  {...register('endTime')}
                  min={startTime}
                  className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
              {errors.endTime && (
                <p className='mt-1 text-sm text-red-600'>{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor='location' className='block text-sm font-medium text-gray-700 mb-2'>
              <MapPin className='inline h-4 w-4 mr-1' />
              Location
            </label>
            <input
              type='text'
              id='location'
              {...register('location')}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='e.g., Conference Room A, Client Office'
            />
          </div>

          <div>
            <label htmlFor='description' className='block text-sm font-medium text-gray-700 mb-2'>
              Description
            </label>
            <textarea
              id='description'
              rows={4}
              {...register('description')}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='Add any additional details or notes...'
            />
          </div>

          <div className='flex space-x-3 pt-4'>
            <button
              type='button'
              onClick={onCancel}
              className='flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50'
            >
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
