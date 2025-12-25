import React, { useState } from 'react'
import { Skeleton } from './Skeleton'

export interface ImagePlaceholderProps {
  src: string
  alt: string
  className?: string
  skeletonClassName?: string
  fallback?: React.ReactNode
  onLoad?: () => void
  onError?: () => void
}

/**
 * ImagePlaceholder component with loading and error states
 */
export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  src,
  alt,
  className = '',
  skeletonClassName = '',
  fallback,
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  if (hasError) {
    return (
      <>
        {fallback || (
          <div
            className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
          >
            Failed to load image
          </div>
        )}
      </>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && <Skeleton className={`absolute inset-0 ${skeletonClassName}`} />}
      <img
        src={src}
        alt={alt}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 w-full h-full object-cover`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}
