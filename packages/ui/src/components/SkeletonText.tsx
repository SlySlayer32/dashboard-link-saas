import React from 'react'
import { Skeleton } from './Skeleton'

export interface SkeletonTextProps {
  lines?: number
  className?: string
  lineHeight?: 'sm' | 'md' | 'lg'
  maxWidth?: string
}

const lineHeightClasses = {
  sm: 'h-4',
  md: 'h-5',
  lg: 'h-6',
}

/**
 * SkeletonText component for placeholder text lines
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className = '',
  lineHeight = 'md',
  maxWidth = '100%',
}) => {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden='true'>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={`${lineHeightClasses[lineHeight]} ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
          style={{ maxWidth: index === lines - 1 ? '75%' : maxWidth }}
        />
      ))}
    </div>
  )
}
