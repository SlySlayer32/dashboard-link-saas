import type { Worker } from '@dashboard-link/shared'
import { useState } from 'react'
import { formatPhoneForDisplay } from '../utils/phoneUtils'
import { Button } from './ui/Button'

interface SMSPreviewProps {
  worker: Worker
  isOpen: boolean
  onClose: () => void
  onSend: (data: { expiresIn: '1h' | '6h' | '12h' | '24h'; customMessage?: string }) => void
  isSending: boolean
}

const EXPIRY_OPTIONS = [
  { value: '1h', label: '1 hour' },
  { value: '6h', label: '6 hours' },
  { value: '12h', label: '12 hours' },
  { value: '24h', label: '24 hours' },
] as const

export function SMSPreview({ worker, isOpen, onClose, onSend, isSending }: SMSPreviewProps) {
  const [expiresIn, setExpiresIn] = useState<'1h' | '6h' | '12h' | '24h'>('6h')
  const [customMessage, setCustomMessage] = useState('')
  const [useCustomMessage, setUseCustomMessage] = useState(false)

  if (!isOpen) return null

  const defaultMessage = `Hi ${worker.name}! Your daily dashboard is ready: [DASHBOARD_LINK]`
  const previewMessage = useCustomMessage ? customMessage : defaultMessage
  const characterCount = previewMessage.length

  const handleSend = () => {
    onSend({
      expiresIn,
      customMessage: useCustomMessage ? customMessage : undefined,
    })
  }

  return (
    <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
      <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg leading-6 font-medium text-gray-900'>Send Dashboard Link</h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-500 focus:outline-none'
          >
            <svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        <div className='space-y-4'>
          {/* Worker Info */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Recipient</label>
            <div className='text-sm text-gray-900'>
              <div className='font-medium'>{worker.name}</div>
              <div className='text-gray-600'>{formatPhoneForDisplay(worker.phone)}</div>
            </div>
          </div>

          {/* Token Expiry */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Link expires in</label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value as '1h' | '6h' | '12h' | '24h')}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            >
              {EXPIRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Message Type */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Message</label>
            <div className='space-y-2'>
              <label className='flex items-center'>
                <input
                  type='radio'
                  checked={!useCustomMessage}
                  onChange={() => setUseCustomMessage(false)}
                  className='mr-2'
                />
                <span className='text-sm'>Use default message</span>
              </label>
              <label className='flex items-center'>
                <input
                  type='radio'
                  checked={useCustomMessage}
                  onChange={() => setUseCustomMessage(true)}
                  className='mr-2'
                />
                <span className='text-sm'>Custom message</span>
              </label>
            </div>
          </div>

          {/* Message Preview */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Message Preview</label>
            <div className='relative'>
              <textarea
                value={previewMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                disabled={!useCustomMessage}
                placeholder='Enter custom message...'
                className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500'
                rows={3}
              />
              <div className='absolute bottom-2 right-2 text-xs text-gray-500'>
                {characterCount} characters
              </div>
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              [DASHBOARD_LINK] will be replaced with the actual dashboard URL
            </p>
          </div>

          {/* Actions */}
          <div className='flex justify-end space-x-3 pt-4 border-t'>
            <Button variant='outline' onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              loading={isSending}
              disabled={isSending || (useCustomMessage && !customMessage.trim())}
            >
              {isSending ? 'Sending...' : 'Send SMS'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
