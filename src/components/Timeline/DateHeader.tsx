import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DateHeaderProps {
  date: Date
  viewMode: 'Day' | 'Week' | 'Month'
  onViewModeChange: (mode: 'Day' | 'Week' | 'Month') => void
  onPrevDay: () => void
  onNextDay: () => void
}

export default function DateHeader({
  date,
  viewMode,
  onViewModeChange,
  onPrevDay,
  onNextDay,
}: DateHeaderProps) {
  const formatDate = () => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  }

  return (
    <div
      className="p-5 rounded-2xl flex items-center justify-between"
      style={{
        background: 'var(--color-bg-surface-1)',
        border: '2px solid var(--color-border-strong)',
        boxShadow: '4px 4px 0px var(--color-border-strong)',
      }}
    >
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}>
        {formatDate()}
      </h1>

      <div className="flex items-center gap-1">
        {(['Day', 'Week', 'Month'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: viewMode === mode ? 'var(--color-text-primary)' : 'transparent',
              color: viewMode === mode ? 'var(--color-bg-surface-1)' : 'var(--color-text-secondary)',
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPrevDay}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
        >
          <ChevronLeft size={16} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
        <button
          onClick={onNextDay}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
        >
          <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
      </div>
    </div>
  )
}
