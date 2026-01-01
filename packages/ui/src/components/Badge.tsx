import { cva } from 'class-variance-authority'
import React from 'react'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800',
        info: 'bg-cyan-100 text-cyan-800',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Badge component - status indicators for Zapier-style admin interface
 * 
 * Usage:
 * <Badge>Default</Badge>
 * <Badge variant="success">Connected</Badge>
 * <Badge variant="error">Error</Badge>
 * <Badge variant="warning">Paused</Badge>
 * <Badge variant="primary">Active</Badge>
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  return (
    <span
      className={`${badgeVariants({ variant, size })} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
