import { Clock, Activity } from 'lucide-react'

interface Props {
  currentApp: string
  duration: number // minutes
  category: string
}

export default function ActiveTrackingCard({ currentApp, duration, category }: Props) {
  // Generate random activity blocks for the mini timeline
  const activityBlocks = [
    { category: 'work', width: 25 },
    { category: 'break', width: 8 },
    { category: 'learning', width: 18 },
    { category: 'other', width: 5 },
    { category: 'work', width: 30 },
  ]

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      work: 'var(--color-blue)',
      meeting: 'var(--color-purple)',
      break: 'var(--color-green)',
      learning: 'var(--color-lemon)',
      other: 'var(--color-border-strong)',
    }
    return colors[cat] || colors.other
  }

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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} style={{ color: 'var(--color-blue)' }} />
          <h3
            className="text-base font-semibold"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}
          >
            Activity Tracking
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: 'var(--color-green)' }}
          />
          <span
            className="text-xs font-semibold"
            style={{ color: 'var(--color-green)', fontFamily: 'JetBrains Mono, monospace' }}
          >
            RECORDING
          </span>
        </div>
      </div>

      {/* Current App */}
      <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        {currentApp}
      </p>

      {/* Duration & Category */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock size={16} style={{ color: 'var(--color-text-muted)' }} />
          <span
            className="text-xl font-bold"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}
          >
            {Math.floor(duration / 60)}h {duration % 60}m
          </span>
        </div>
        <span
          className="px-3 py-1 rounded-lg text-xs font-semibold"
          style={{
            background: `${getCategoryColor(category)}20`,
            color: getCategoryColor(category),
          }}
        >
          {category}
        </span>
      </div>

      {/* Mini Timeline Preview */}
      <div className="h-10 rounded-xl flex items-center gap-1 px-2" style={{ background: 'var(--color-bg-surface-2)' }}>
        {activityBlocks.map((block, i) => (
          <div
            key={i}
            className="h-6 rounded-md"
            style={{
              width: `${block.width}%`,
              background: getCategoryColor(block.category),
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    </div>
  )
}
