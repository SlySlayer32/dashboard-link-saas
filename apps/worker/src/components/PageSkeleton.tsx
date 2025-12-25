import React from 'react'

export const PageSkeleton: React.FC = () => {
  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      {/* Header skeleton */}
      <div className='mb-8'>
        <div className='h-8 bg-gray-200 rounded w-1/2 mb-2 mx-auto'></div>
        <div className='h-4 bg-gray-200 rounded w-1/3 mx-auto'></div>
      </div>

      {/* Card skeletons */}
      <div className='max-w-md mx-auto space-y-4'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='bg-white p-6 rounded-lg shadow-sm'>
            <div className='h-6 bg-gray-200 rounded w-2/3 mb-4'></div>
            <div className='space-y-2'>
              <div className='h-4 bg-gray-200 rounded'></div>
              <div className='h-4 bg-gray-200 rounded w-5/6'></div>
            </div>
          </div>
        ))}
      </div>

      {/* List skeleton */}
      <div className='max-w-md mx-auto mt-8'>
        <div className='h-6 bg-gray-200 rounded w-1/3 mb-4'></div>
        <div className='space-y-3'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='bg-white p-4 rounded shadow-sm'>
              <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
              <div className='h-3 bg-gray-200 rounded w-1/2'></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
