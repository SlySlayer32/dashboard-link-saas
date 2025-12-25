import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { useEffect } from 'react'
import { Toast as ToastType } from './types'

interface ToastProps {
  toast: ToastType
  onDismiss: (id: string) => void
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const variantStyles = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
}

export const Toast = ({ toast, onDismiss }: ToastProps) => {
  const Icon = iconMap[toast.type]
  const variantStyle = variantStyles[toast.type]

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onDismiss(toast.id)
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      className={`mb-2 flex items-start rounded-lg border p-4 shadow-lg ${variantStyle}`}
      role='alert'
    >
      <Icon className='mr-3 h-5 w-5 flex-shrink-0' />
      <div className='flex-1'>
        <h3 className='font-medium'>{toast.title}</h3>
        {toast.message && <p className='mt-1 text-sm'>{toast.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className='ml-4 text-gray-500 hover:text-gray-700'
        aria-label='Dismiss'
      >
        <X className='h-5 w-5' />
      </button>
    </div>
  )
}
