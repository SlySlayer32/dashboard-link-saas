import React, { useState } from 'react'

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallback?: string
  placeholder?: string
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallback = '/placeholder.png',
  placeholder = '/placeholder-blur.png',
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder or blur image */}
      {!isLoaded && !hasError && placeholder && (
        <img
          src={placeholder}
          alt=''
          className='absolute inset-0 w-full h-full object-cover filter blur-sm scale-110'
          aria-hidden='true'
        />
      )}

      {/* Main image */}
      <img
        src={hasError ? fallback : src}
        alt={alt}
        loading='lazy'
        decoding='async'
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } w-full h-full object-cover`}
        {...props}
      />
    </div>
  )
}

// Simple image component for avatars and icons
export const LazyImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({
  className = '',
  ...props
}) => {
  return (
    <img
      loading='lazy'
      decoding='async'
      className={`transition-opacity ${className}`}
      onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.classList.add('loaded')
      }}
      {...props}
    />
  )
}
