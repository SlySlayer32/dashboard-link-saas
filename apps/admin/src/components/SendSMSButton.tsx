import type { Worker } from '@dashboard-link/shared'
import React, { useState } from 'react'
import { useSendDashboardLink } from '../hooks/useSMS'
import { SMSPreview } from './SMSPreview'
import { Button } from './ui/Button'

interface SendSMSButtonProps {
  worker: Worker
  onSuccess?: () => void
  onError?: (error: string) => void
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SendSMSButton({
  worker,
  onSuccess,
  onError,
  variant = 'default',
  size = 'sm',
  className = '',
}: SendSMSButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const sendDashboardLink = useSendDashboardLink()

  const handleSendSMS = async (data: {
    expiresIn: '1h' | '6h' | '12h' | '24h'
    customMessage?: string
  }) => {
    try {
      await sendDashboardLink.mutateAsync({
        workerId: worker.id,
        expiresIn: data.expiresIn,
        customMessage: data.customMessage,
      })

      setIsModalOpen(false)
      onSuccess?.()
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to send SMS')
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleButtonClick}
        disabled={!worker.active}
        className={className}
        title={!worker.active ? 'Worker is inactive' : 'Send dashboard link via SMS'}
      >
        <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
          />
        </svg>
        Send SMS
      </Button>

      <SMSPreview
        worker={worker}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSend={handleSendSMS}
        isSending={sendDashboardLink.isPending}
      />
    </>
  )
}
