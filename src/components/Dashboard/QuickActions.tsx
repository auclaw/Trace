// Quick Actions bar - start focus, add quick task, checkin habits
// Splitted from Dashboard.tsx

import { useTranslation } from 'react-i18next'
import { TRANSITION_ALL } from './constants'

interface QuickActionsProps {
  onStartFocus: () => void
  onToggleQuickTask: () => void
  onFocusCheckinHabits: () => void
  showQuickTask: boolean
  quickTaskTitle: string
  onQuickTaskTitleChange: (value: string) => void
  onAddQuickTask: () => void
}

export default function QuickActions({
  onStartFocus,
  onToggleQuickTask,
  onFocusCheckinHabits,
  showQuickTask,
  quickTaskTitle,
  onQuickTaskTitleChange,
  onAddQuickTask,
}: QuickActionsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onStartFocus}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium cursor-pointer"
        style={{
          background: 'var(--color-accent)',
          color: '#fff',
          boxShadow: '0 2px 8px var(--color-accent-soft)',
          transition: TRANSITION_ALL,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 4px 14px var(--color-accent-soft)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 8px var(--color-accent-soft)'
        }}
      >
        <span style={{ fontSize: '14px' }}>&#9654;</span>
        {t('dashboard.startFocus')}
      </button>

      <button
        onClick={onToggleQuickTask}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium cursor-pointer"
        style={{
          background: 'var(--color-accent-soft)',
          color: 'var(--color-accent)',
          border: '1px solid var(--color-accent)',
          transition: TRANSITION_ALL,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.background = 'var(--color-accent)'
          e.currentTarget.style.color = '#fff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.background = 'var(--color-accent-soft)'
          e.currentTarget.style.color = 'var(--color-accent)'
        }}
      >
        <span style={{ fontSize: '14px' }}>+</span>
        {t('dashboard.addTask')}
      </button>

      <button
        onClick={onFocusCheckinHabits}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium cursor-pointer"
        style={{
          background: 'var(--color-bg-surface-2)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border-subtle)',
          transition: TRANSITION_ALL,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.borderColor = 'var(--color-accent)'
          e.currentTarget.style.color = 'var(--color-accent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
          e.currentTarget.style.color = 'var(--color-text-secondary)'
        }}
      >
        <span style={{ fontSize: '14px' }}>&#10003;</span>
        {t('habits.checkin')}
      </button>

      {/* Inline quick task input */}
      {showQuickTask && (
        <div
          className="flex items-center gap-2 ml-2 px-3 py-1.5 rounded-full"
          style={{
            background: 'var(--color-bg-surface-1)',
            border: '1px solid var(--color-accent)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          <input
            autoFocus
            type="text"
            value={quickTaskTitle}
            onChange={(e) => onQuickTaskTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAddQuickTask()
              if (e.key === 'Escape') onToggleQuickTask()
            }}
            placeholder={t('dashboard.quickTaskPlaceholder')}
            className="bg-transparent outline-none text-[13px] w-48"
            style={{ color: 'var(--color-text-primary)' }}
          />
          <button
            onClick={onAddQuickTask}
            className="text-[11px] px-2.5 py-0.5 rounded-full font-medium cursor-pointer"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            {t('common.add')}
          </button>
        </div>
      )}
    </div>
  )
}
