import React from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  size = 'md',
  action,
}) => {
  const sizeClasses = {
    sm: 'py-6',
    md: 'py-12',
    lg: 'py-20',
  }

  const iconSize = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]}`}>
      {icon && <span className={`${iconSize[size]} mb-3`}>{icon}</span>}
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
