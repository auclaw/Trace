import React from 'react'

// ─── Skeleton ───────────────────────────────────────────────
// Reusable skeleton loading component using CSS variable theming.
// Uses the `skeleton-loading` CSS class already defined in index.css.

interface SkeletonProps {
  width?: string | number
  height?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'full' | string
  className?: string
  style?: React.CSSProperties
}

const radiusMap: Record<string, string> = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  full: 'var(--radius-full)',
}

export function Skeleton({
  width,
  height = '1rem',
  rounded = 'sm',
  className = '',
  style,
}: SkeletonProps) {
  const borderRadius = radiusMap[rounded] ?? rounded
  return (
    <div
      className={`skeleton-loading ${className}`}
      style={{
        width: width ?? '100%',
        height,
        borderRadius,
        ...style,
      }}
    />
  )
}

// ─── SkeletonCard ───────────────────────────────────────────
// Pre-made skeleton that mimics a typical card layout.

interface SkeletonCardProps {
  className?: string
  lines?: number
}

export function SkeletonCard({ className = '', lines = 3 }: SkeletonCardProps) {
  return (
    <div
      className={`trace-card p-5 space-y-4 ${className}`}
      style={{ animation: 'none' }}
    >
      {/* Title bar */}
      <Skeleton width="45%" height="1.25rem" rounded="md" />
      {/* Metric / hero number */}
      <Skeleton width="30%" height="2rem" rounded="md" />
      {/* Body lines */}
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            width={i === lines - 1 ? '60%' : '100%'}
            height="0.75rem"
            rounded="full"
          />
        ))}
      </div>
    </div>
  )
}

// ─── SkeletonList ───────────────────────────────────────────
// Pre-made skeleton that mimics a list of items.

interface SkeletonListProps {
  className?: string
  rows?: number
}

export function SkeletonList({ className = '', rows = 5 }: SkeletonListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {/* Icon / avatar placeholder */}
          <Skeleton width="2rem" height="2rem" rounded="full" />
          {/* Text lines */}
          <div className="flex-1 space-y-1.5">
            <Skeleton
              width={`${65 + ((i * 17) % 30)}%`}
              height="0.75rem"
              rounded="full"
            />
            <Skeleton width="40%" height="0.6rem" rounded="full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default Skeleton
