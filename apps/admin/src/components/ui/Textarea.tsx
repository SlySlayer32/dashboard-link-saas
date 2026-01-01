import React from 'react'


interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const Textarea: React.FC<TextareaProps> = ({
  className = '',
  error,
  ...props
}) => {
  return (
    <div>
      <textarea
        className={`
          block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3
          focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className='mt-1 text-sm text-red-600'>{error}</p>
      )}
    </div>
  )
}
