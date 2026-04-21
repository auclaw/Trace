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
        background: '#FFFFFF',
        border: '2px solid #D6D3CD',
        boxShadow: '4px 4px 0px #D6D3CD',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Target size={18} style={{ color: '#A8E6CF' }} />
        <h3
          className="text-base font-semibold"
          style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}
        >
          Plan vs Actual
        </h3>
      </div>

      {/* Goal Progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ color: '#5C5658' }}>
            Today's Goal
          </span>
          <span className="text-sm font-semibold" style={{ color: '#3A3638' }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-3 rounded-full" style={{ background: '#F5F1EA' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #79BEEB 0%, #A8E6CF 100%)',
            }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="p-4 rounded-xl text-center"
          style={{ background: '#FAF7F2' }}
        >
          <p className="text-xs mb-1" style={{ color: '#9E9899' }}>
            Planned
          </p>
          <p
            className="text-lg font-bold"
            style={{ color: '#5C5658', fontFamily: 'Quicksand, sans-serif' }}
          >
            {Math.floor(plannedMinutes / 60)}h {plannedMinutes % 60}m
          </p>
        </div>
        <div
          className="p-4 rounded-xl text-center"
          style={{ background: 'rgba(168,230,207,0.12)' }}
        >
          <p className="text-xs mb-1" style={{ color: '#9E9899' }}>
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
          <TrendingUp size={16} style={{ color: '#A8E6CF' }} />
        ) : (
          <TrendingDown size={16} style={{ color: '#FF8C82' }} />
        )}
        <span
          className="text-sm font-semibold"
          style={{ color: isOnTrack ? '#A8E6CF' : '#FF8C82' }}
        >
          {isOnTrack ? '+' : ''}{Math.floor(variance / 60)}h {variance % 60}m {isOnTrack ? 'ahead' : 'behind'}
        </span>
      </div>
    </div>
  )
}
