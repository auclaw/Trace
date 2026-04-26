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
        background: '#FFFFFF',
        border: '2px solid #D6D3CD',
        boxShadow: '4px 4px 0px #D6D3CD',
      }}
    >
      <h1 className="text-xl font-bold" style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}>
        {formatDate()}
      </h1>

      <div className="flex items-center gap-1">
        {(['Day', 'Week', 'Month'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: viewMode === mode ? '#3A3638' : 'transparent',
              color: viewMode === mode ? '#FFFFFF' : '#5C5658',
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
          <ChevronLeft size={16} style={{ color: '#5C5658' }} />
        </button>
        <button
          onClick={onNextDay}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
        >
          <ChevronRight size={16} style={{ color: '#5C5658' }} />
        </button>
      </div>
    </div>
  )
}
