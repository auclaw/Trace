import { Target, TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  plannedMinutes: number
  actualMinutes: number
  goalMinutes: number
}

export default function PlanVsActualCard({ plannedMinutes, actualMinutes, goalMinutes }: Props) {
  const progress = goalMinutes > 0 ? Math.min(100, (actualMinutes / goalMinutes) * 100) : 0
  const variance = actualMinutes - plannedMinutes
  const isOnTrack = variance >= 0

  return (
    <div
      className="p-6 rounded-2xl transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px]"
      style={{
        background: 'var(--color-bg-surface-1)',
        border: '2px solid var(--color-border-strong)',
        boxShadow: '4px 4px 0px var(--color-border-strong)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Target size={18} style={{ color: 'var(--color-green)' }} />
        <h3
          className="text-base font-semibold"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}
        >
          Plan vs Actual
        </h3>
      </div>

      {/* Goal Progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Today's Goal
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-3 rounded-full" style={{ background: 'var(--color-bg-surface-3)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--color-blue) 0%, var(--color-green) 100%)',
            }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="p-4 rounded-xl text-center"
          style={{ background: 'var(--color-bg-surface-2)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Planned
          </p>
          <p
            className="text-lg font-bold"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'Quicksand, sans-serif' }}
          >
            {Math.floor(plannedMinutes / 60)}h {plannedMinutes % 60}m
          </p>
        </div>
        <div
          className="p-4 rounded-xl text-center"
          style={{ background: 'rgba(168,230,207,0.12)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Actual
          </p>
          <p
            className="text-lg font-bold"
            style={{ color: '#2D5A4A', fontFamily: 'Quicksand, sans-serif' }}
          >
            {Math.floor(actualMinutes / 60)}h {actualMinutes % 60}m
          </p>
        </div>
      </div>

      {/* Variance Indicator */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {isOnTrack ? (
          <TrendingUp size={16} style={{ color: 'var(--color-green)' }} />
        ) : (
          <TrendingDown size={16} style={{ color: 'var(--color-coral)' }} />
        )}
        <span
          className="text-sm font-semibold"
          style={{ color: isOnTrack ? 'var(--color-green)' : 'var(--color-coral)' }}
        >
          {isOnTrack ? '+' : ''}{Math.floor(variance / 60)}h {variance % 60}m {isOnTrack ? 'ahead' : 'behind'}
        </span>
      </div>
    </div>
  )
}
