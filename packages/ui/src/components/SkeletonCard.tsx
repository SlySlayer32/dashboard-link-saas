import React from 'react'
import { Skeleton } from './Skeleton'
import { SkeletonText } from './SkeletonText'

export interface SkeletonCardProps {
  showAvatar?: boolean
  showTitle?: boolean
  showDescription?: boolean
  showFooter?: boolean
  className?: string
  avatarSize?: 'sm' | 'md' | 'lg'
  titleLines?: number
  descriptionLines?: number
}

const avatarSizes = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
}

/**
 * SkeletonCard component for placeholder card layouts
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = true,
  showTitle = true,
  showDescription = true,
  showFooter = true,
  className = '',
  avatarSize = 'md',
  titleLines = 1,
  descriptionLines = 3,
}) => {
  return (
    <div className={`rounded-lg border border-gray-200 p-4 ${className}`} aria-hidden='true'>
      {showAvatar && (
        <div className='flex items-start space-x-4'>
          <Skeleton className={`${avatarSizes[avatarSize]} rounded-full`} />
          <div className='flex-1'>
            {showTitle && <SkeletonText lines={titleLines} className='mb-2' />}
            {showDescription && <SkeletonText lines={descriptionLines} />}
          </div>
        </div>
      )}

      {!showAvatar && (
        <div className='space-y-3'>
          {showTitle && <SkeletonText lines={titleLines} />}
          {showDescription && <SkeletonText lines={descriptionLines} />}
        </div>
      )}

      {showFooter && (
        <div className='mt-4 flex items-center justify-between'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-8 w-16 rounded-md' />
        </div>
      )}
    </div>
  )
}
