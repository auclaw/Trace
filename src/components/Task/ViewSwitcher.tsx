import { useState } from 'react'
import { List, LayoutGrid, Table, Calendar, ChevronDown } from 'lucide-react'

export type ViewMode = 'list' | 'board' | 'table' | 'calendar'

interface ViewSwitcherProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

const VIEW_OPTIONS: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
  { key: 'list', label: '列表', icon: <List size={16} /> },
  { key: 'board', label: '看板', icon: <LayoutGrid size={16} /> },
  { key: 'table', label: '表格', icon: <Table size={16} /> },
  { key: 'calendar', label: '日历', icon: <Calendar size={16} /> },
]

export default function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentOption = VIEW_OPTIONS.find((v) => v.key === currentView) || VIEW_OPTIONS[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
        style={{
          background: 'var(--color-bg-surface-1)',
          border: '2px solid var(--color-border-light)',
          color: 'var(--color-text-primary)',
        }}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      >
        <span style={{ color: 'var(--color-blue)' }}>{currentOption.icon}</span>
        <span className="text-sm font-semibold">{currentOption.label}</span>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--color-text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 py-1 rounded-xl z-50 min-w-[140px]"
          style={{
            background: 'var(--color-bg-surface-1)',
            border: '2px solid var(--color-border-light)',
            boxShadow: '4px 4px 0px var(--color-border-strong)',
          }}
        >
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => {
                onViewChange(option.key)
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left transition-all"
              style={{
                background: currentView === option.key ? 'var(--color-blue)15' : 'transparent',
                color: currentView === option.key ? 'var(--color-blue)' : 'var(--color-text-primary)',
              }}
            >
              <span className="opacity-60">{option.icon}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
