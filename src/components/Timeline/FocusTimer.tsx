import { Zap, Play, Clock } from 'lucide-react'
import type { Task } from '../../services/dataService'

interface FocusTimerProps {
  isActive: boolean
  activeTask: Task | null
  elapsedSeconds: number
  onQuickStart?: (title: string) => void
}

export default function FocusTimer({ isActive, activeTask, elapsedSeconds }: FocusTimerProps) {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--color-bg-surface-1)',
        border: '2px solid var(--color-border-strong)',
        boxShadow: '4px 4px 0px var(--color-border-strong)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
          Today's Focus
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-blue)20', color: 'var(--color-blue)' }}>
          MOD
        </span>
      </div>

      <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
        Manage your active tasks and let AI track the rest.
      </p>

      {isActive && activeTask ? (
        <div
          className="p-4 rounded-xl mb-4"
          style={{
            background: 'linear-gradient(135deg, var(--color-blue) 0%, var(--color-blue-hover) 100%)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={14} color="white" />
              <p className="text-xs font-semibold text-white">
                Deep Work Tracking
              </p>
            </div>
          </div>
          <p className="text-sm font-medium text-white/90 mb-2">
            {activeTask.title}
          </p>
          <p className="text-2xl font-bold text-white text-center font-mono">
            {formatTime(elapsedSeconds)}
          </p>
        </div>
      ) : (
        <div
          className="p-4 rounded-xl mb-4 text-center"
          style={{ background: 'var(--color-bg-surface-3)', border: '1px dashed var(--color-border-strong)' }}
        >
          <Clock size={20} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            点击任务开始专注计时
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="What are you working on?"
          className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
          style={{ background: 'var(--color-bg-surface-3)', border: '2px solid var(--color-border-strong)', color: 'var(--color-text-secondary)' }}
        />
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:opacity-90"
          style={{ background: 'var(--color-blue)' }}
        >
          <Play size={14} color="white" />
        </button>
      </div>
    </div>
  )
}
