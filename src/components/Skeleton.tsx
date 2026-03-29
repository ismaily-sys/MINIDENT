import React from 'react'

interface SkeletonProps {
  count?: number
  height?: string
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({
  count = 1,
  height = 'h-4',
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gray-200 rounded animate-pulse w-full`}
        />
      ))}
    </div>
  )
}
