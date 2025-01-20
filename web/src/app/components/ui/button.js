import { forwardRef } from 'react'

export const Button = forwardRef(({ className = '', disabled, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={`
        inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
        ${disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
        }
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}) 