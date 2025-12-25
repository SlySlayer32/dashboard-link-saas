import { cva, type VariantProps } from 'class-variance-authority'
import React from 'react'
import { LoadingSpinner } from './LoadingSpinner'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
}

/**
 * Shared Button component with loading state support
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  loading = false,
  loadingText,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading

  return (
    <button
      className={`${buttonVariants({ variant, size })} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && <LoadingSpinner size='sm' className='mr-2' label='' />}
      {loading && loadingText ? loadingText : children}
    </button>
  )
}
