import { cva, type VariantProps } from 'class-variance-authority'
import React from 'react'

const skeletonVariants = cva('animate-pulse rounded-md bg-gray-200', {
  variants: {
    variant: {
      default: 'bg-gray-200',
      dark: 'bg-gray-300',
      light: 'bg-gray-100',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface SkeletonProps extends VariantProps<typeof skeletonVariants> {
  className?: string
  children?: React.ReactNode
}

/**
 * Base Skeleton component with shimmer animation
 * Used as a placeholder for content that is loading
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant,
  className = '',
  children,
  ...props
}) => {
  if (children) {
    return (
      <div className='relative overflow-hidden'>
        <div className='invisible'>{children}</div>
        <div
          className={`absolute inset-0 ${skeletonVariants({ variant })} ${className}`}
          {...props}
        />
      </div>
    )
  }

  return <div className={`${skeletonVariants({ variant })} ${className}`} {...props} />
}
