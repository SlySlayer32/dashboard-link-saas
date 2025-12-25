import React from 'react'
import { Skeleton } from './Skeleton'

export interface SkeletonListProps {
  items?: number
  showAvatar?: boolean
  className?: string
  avatarSize?: 'sm' | 'md' | 'lg'
  itemHeight?: 'sm' | 'md' | 'lg'
}

const avatarSizes = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
}

const itemHeightClasses = {
  sm: 'h-12',
  md: 'h-16',
  lg: 'h-20',
}

/**
 * SkeletonList component for placeholder list items
 */
export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 5,
  showAvatar = true,
  className = '',
  avatarSize = 'md',
  itemHeight = 'md',
}) => {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden='true'>
      {Array.from({ length: items }, (_, index) => (
        <div key={index} className={`flex items-center space-x-3 ${itemHeightClasses[itemHeight]}`}>
          {showAvatar && (
            <Skeleton className={`${avatarSizes[avatarSize]} rounded-full flex-shrink-0`} />
          )}
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-3 w-1/2' />
          </div>
          <Skeleton className='h-6 w-16 flex-shrink-0' />
        </div>
      ))}
    </div>
  )
}
