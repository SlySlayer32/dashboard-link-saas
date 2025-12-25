import React from 'react'
import { Skeleton } from './Skeleton'

export interface SkeletonTableProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
  cellHeight?: 'sm' | 'md' | 'lg'
}

const cellHeightClasses = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
}

/**
 * SkeletonTable component for placeholder table rows
 */
export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = '',
  cellHeight = 'md',
}) => {
  return (
    <div className={`w-full ${className}`} aria-hidden='true'>
      {showHeader && (
        <div className='mb-2 border-b border-gray-200 pb-2'>
          <div className='grid gap-4' style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }, (_, index) => (
              <Skeleton key={`header-${index}`} className='h-6 w-full' />
            ))}
          </div>
        </div>
      )}

      <div className='space-y-2'>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className='grid gap-4'
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }, (_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className={`${cellHeightClasses[cellHeight]} w-full`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
