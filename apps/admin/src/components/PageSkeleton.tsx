import React from 'react'

export const PageSkeleton: React.FC = () => {
  return (
    <div className='animate-pulse'>
      {/* Header skeleton */}
      <div className='mb-8'>
        <div className='h-8 bg-gray-200 rounded w-1/3 mb-2'></div>
        <div className='h-4 bg-gray-200 rounded w-1/2'></div>
      </div>

      {/* Content skeleton */}
      <div className='space-y-4'>
        <div className='h-10 bg-gray-200 rounded w-full'></div>
        <div className='h-10 bg-gray-200 rounded w-full'></div>
        <div className='h-10 bg-gray-200 rounded w-3/4'></div>
      </div>

      {/* Card skeleton */}
      <div className='mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {[...Array(6)].map((_, i) => (
          <div key={i} className='bg-white p-6 rounded-lg shadow-sm'>
            <div className='h-6 bg-gray-200 rounded w-2/3 mb-4'></div>
            <div className='space-y-2'>
              <div className='h-4 bg-gray-200 rounded'></div>
              <div className='h-4 bg-gray-200 rounded w-5/6'></div>
              <div className='h-4 bg-gray-200 rounded w-4/6'></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
