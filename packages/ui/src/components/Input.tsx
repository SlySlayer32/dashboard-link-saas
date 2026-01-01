import * as LabelPrimitive from '@radix-ui/react-label'
import { cva } from 'class-variance-authority'
import React, { useId } from 'react'

const inputVariants = cva(
  'flex w-full rounded-md border font-medium transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300 bg-white text-gray-900',
        error: 'border-red-500 bg-white text-gray-900',
        success: 'border-green-500 bg-white text-gray-900',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'error' | 'success'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  error?: string
  helperText?: string
  required?: boolean
}

/**
 * Input component - form inputs for Zapier-style admin interface
 * 
 * Usage:
 * <Input placeholder="Enter name" />
 * <Input label="Email" type="email" required />
 * <Input label="API Key" error="Invalid key" helperText="Get this from your settings" />
 */
export const Input: React.FC<InputProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  label,
  error,
  helperText,
  required,
  id,
  ...props
}) => {
  const generatedId = useId()
  const inputId = id || generatedId
  const hasError = !!error
  const finalVariant = hasError ? 'error' : variant

  return (
    <div className="space-y-2">
      {label && (
        <LabelPrimitive.Root
          htmlFor={inputId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </LabelPrimitive.Root>
      )}
      
      <input
        id={inputId}
        className={`${inputVariants({ variant: finalVariant, size })} ${className}`}
        aria-invalid={hasError}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="text-sm text-gray-600">
          {helperText}
        </p>
      )}
    </div>
  )
}
