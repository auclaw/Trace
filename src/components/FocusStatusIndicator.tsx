import { useEffect } from 'react'
import { useFocusModal } from '../App'
import { useAppStore } from '../store/useAppStore'
import type { AppState } from '../store/useAppStore'

/**
 * Global top-right focus status indicator.
 * Shows "专注 MM:SS" when focus timer is active, "休息 MM:SS" during breaks.
 * Clicking opens the Focus Modal.
 */

const STATE_CONFIG: Record<string, { label: string; dotColor: string; pulseColor: string }> = {
  working: {
    label: '专注',
    dotColor: 'var(--color-accent)',
    pulseColor: 'var(--color-accent-soft)',
  },
  break: {
    label: '休息',
    dotColor: 'var(--color-success, #22c55e)',
    pulseColor: 'rgba(34, 197, 94, 0.2)',
  },
  longBreak: {
    label: '长休息',
    dotColor: 'var(--color-success, #22c55e)',
    pulseColor: 'rgba(34, 197, 94, 0.2)',
  },
}

function formatMM_SS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FocusStatusIndicator() {
  const focusState = useAppStore((s: AppState) => s.focusState)
  const focusTimeLeft = useAppStore((s: AppState) => s.focusTimeLeft)
  const focusSettings = useAppStore((s: AppState) => s.focusSettings)
  const { openFocusModal } = useFocusModal()

  // No-op effect just to keep the component reactive to focusTimeLeft changes
  useEffect(() => {}, [focusTimeLeft])

  if (focusState === 'idle') return null

  const config = STATE_CONFIG[focusState]
  if (!config) return null

  // Calculate elapsed time for this session
  const totalSeconds =
    focusState === 'working'
      ? focusSettings.workMinutes * 60
      : focusState === 'break'
        ? focusSettings.breakMinutes * 60
        : focusSettings.longBreakMinutes * 60
  const elapsedSeconds = totalSeconds - focusTimeLeft

  return (
    <button
      onClick={() => openFocusModal()}
      className="fixed top-3 right-3 z-[60] flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200 hover:scale-105 group"
      style={{
        background: 'var(--color-bg-surface-1)',
        border: '1px solid var(--color-border-subtle)',
        boxShadow: '0 2px 12px rgba(44, 24, 16, 0.08), 0 0 0 1px rgba(44, 24, 16, 0.04)',
        backdropFilter: 'blur(12px)',
      }}
      title="点击查看专注详情"
    >
      {/* Pulsing dot */}
      <span className="relative flex h-2.5 w-2.5">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
          style={{ backgroundColor: config.pulseColor }}
        />
        <span
          className="relative inline-flex rounded-full h-2.5 w-2.5"
          style={{ backgroundColor: config.dotColor }}
        />
      </span>

      {/* Label */}
      <span
        className="text-xs font-semibold whitespace-nowrap"
        style={{ color: config.dotColor }}
      >
        {config.label}
      </span>

      {/* Timer */}
      <span
        className="text-xs font-mono font-bold tabular-nums"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {formatMM_SS(elapsedSeconds)}
      </span>

      {/* Remaining time hint on hover */}
      <span
        className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap"
        style={{ color: 'var(--color-text-muted)' }}
      >
        剩余 {formatMM_SS(focusTimeLeft)}
      </span>

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  )
}
