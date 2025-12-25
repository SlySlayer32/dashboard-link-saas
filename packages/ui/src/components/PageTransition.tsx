import React, { useEffect, useState } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

export interface PageTransitionProps {
  children: React.ReactNode
  isLoading?: boolean
  delay?: number
  fallback?: React.ReactNode
  minDisplayTime?: number
}

/**
 * PageTransition component for smooth page loading states
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  isLoading = false,
  delay = 200,
  fallback,
  minDisplayTime = 300,
}) => {
  const [showLoading, setShowLoading] = useState(false)
  const [shouldRenderContent, setShouldRenderContent] = useState(!isLoading)
  const [startTime, setStartTime] = useState<number | null>(null)

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setStartTime(Date.now())
        setShowLoading(true)
      }, delay)
      return () => clearTimeout(timer)
    } else {
      if (showLoading) {
        const elapsed = startTime ? Date.now() - startTime : 0
        const remainingTime = Math.max(0, minDisplayTime - elapsed)

        if (remainingTime > 0) {
          const timer = setTimeout(() => {
            setShowLoading(false)
            setShouldRenderContent(true)
          }, remainingTime)
          return () => clearTimeout(timer)
        } else {
          setTimeout(() => {
            setShowLoading(false)
            setShouldRenderContent(true)
          }, 0)
        }
      } else {
        setTimeout(() => {
          setShouldRenderContent(true)
        }, 0)
      }
    }
  }, [isLoading, delay, minDisplayTime, showLoading, startTime])

  if (showLoading) {
    return <>{fallback || <PageLoadingFallback />}</>
  }

  if (shouldRenderContent) {
    return <>{children}</>
  }

  return null
}

/**
 * Default page loading fallback component
 */
const PageLoadingFallback: React.FC = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-[200px] space-y-4'>
      <LoadingSpinner size='lg' />
      <p className='text-sm text-gray-600'>Loading...</p>
    </div>
  )
}
