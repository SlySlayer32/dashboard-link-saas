import React, { createContext, useCallback, useContext, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Toast as ToastComponent } from './Toast'
import { ToastContextType, ToastInput, Toast as ToastType } from './types'

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastType[]>([])

  const addToast = useCallback((toast: ToastInput) => {
    const id = uuidv4()
    setToasts((prev) => [...prev, { ...toast, id }])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className='fixed bottom-4 right-4 z-50 w-80'>
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
