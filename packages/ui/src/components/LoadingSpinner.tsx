import { cva, type VariantProps } from 'class-variance-authority'
import React from 'react'

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string
  label?: string
}

/**
 * LoadingSpinner component for indicating loading state
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size,
  className = '',
  label = 'Loading...',
}) => {
  return (
    <div className='flex items-center justify-center' role='status' aria-label={label}>
      <div className={`${spinnerVariants({ size })} ${className}`} />
      <span className='sr-only'>{label}</span>
    </div>
  )
}
