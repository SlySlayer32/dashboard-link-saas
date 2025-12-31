import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { Textarea } from './ui/Textarea'

// Form schema
const smsFormSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1600, 'Message too long (max 1600 characters)'),
  expiresIn: z.enum(['1h', '6h', '12h', '24h']),
  customMessage: z.string().optional(),
})

type SMSFormData = z.infer<typeof smsFormSchema>

interface SMSModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SMSFormData) => Promise<void>
  isLoading?: boolean
  workerName: string
  workerPhone: string
}

export const SMSModal: React.FC<SMSModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  workerName,
  workerPhone,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SMSFormData>({
    resolver: zodResolver(smsFormSchema),
    defaultValues: {
      message: `Hi ${workerName}! Your daily dashboard is ready: [LINK]`,
      expiresIn: '6h',
      customMessage: '',
    },
  })

  const message = watch('message')
  const messageLength = message?.length || 0

  const handleFormSubmit = async (data: SMSFormData) => {
    await onSubmit(data)
  }

  const handleCustomMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const customMessage = e.target.value
    if (customMessage.trim()) {
      setValue('message', customMessage)
    }
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
                <h3 className='text-lg leading-6 font-medium text-gray-900'>Send SMS to {workerName}</h3>
                <p className='mt-1 text-sm text-gray-500'>Phone: {workerPhone}</p>
              </div>

              <div className='space-y-4'>
                {/* Custom Message */}
                <div>
                  <label htmlFor='customMessage' className='block text-sm font-medium text-gray-700'>
                    Custom Message
                  </label>
                  <Textarea
                    id='customMessage'
                    rows={4}
                    placeholder='Enter your custom message here...'
                    disabled={isLoading}
                    onChange={handleCustomMessageChange}
                  />
                  <p className='mt-1 text-xs text-gray-500'>
                    Leave empty to use the default dashboard link message
                  </p>
                </div>

                {/* Message Preview */}
                <div>
                  <label htmlFor='message' className='block text-sm font-medium text-gray-700'>
                    Message Preview <span className='text-red-500'>*</span>
                  </label>
                  <Textarea
                    id='message'
                    rows={4}
                    {...register('message')}
                    error={errors.message?.message}
                    placeholder='Enter message...'
                    disabled={isLoading}
                  />
                  <div className='mt-1 flex justify-between items-center'>
                    <p className='text-xs text-gray-500'>
                      {messageLength}/1600 characters
                    </p>
                    <p className={`text-xs ${messageLength > 1600 ? 'text-red-500' : 'text-gray-500'}`}>
                      {messageLength > 160 ? `${Math.ceil(messageLength / 160)} SMS segments` : '1 SMS segment'}
                    </p>
                  </div>
                </div>

                {/* Link Expiry */}
                <div>
                  <label htmlFor='expiresIn' className='block text-sm font-medium text-gray-700'>
                    Link Expires In <span className='text-red-500'>*</span>
                  </label>
                  <Select id='expiresIn' {...register('expiresIn')} disabled={isLoading}>
                    <option value='1h'>1 Hour</option>
                    <option value='6h'>6 Hours</option>
                    <option value='12h'>12 Hours</option>
                    <option value='24h'>24 Hours</option>
                  </Select>
                  <p className='mt-1 text-xs text-gray-500'>
                    The dashboard link will expire after this time
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
              <Button
                type='submit'
                disabled={!isDirty || isLoading || messageLength > 1600}
                loading={isLoading}
                className='w-full sm:ml-3 sm:w-auto'
              >
                Send SMS
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
