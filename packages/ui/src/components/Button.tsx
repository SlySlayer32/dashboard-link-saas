import { cva } from 'class-variance-authority'
import React from 'react'
import { LoadingSpinner } from './LoadingSpinner'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
        ghost: 'hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-200',
        link: 'text-blue-600 hover:text-blue-800 underline-offset-4 hover:underline p-0 h-auto dark:text-blue-400 dark:hover:text-blue-300',
        default: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
        destructive: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
        success: 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8 text-lg',
        xl: 'h-12 px-10 text-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'default' | 'destructive' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  loadingText?: string
  fullWidth?: boolean
}

/**
 * Shared Button component with loading state support and dark mode
 * Zapier-style: minimal, professional, workflow-first
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  loading = false,
  loadingText,
  disabled,
  fullWidth = false,
  ...props
}) => {
  const isDisabled = disabled || loading
  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      className={`${buttonVariants({ variant, size })} ${className} ${widthClass}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && <LoadingSpinner size='sm' className='mr-2' label='' />}
      {loading && loadingText ? loadingText : children}
    </button>
  )
}
