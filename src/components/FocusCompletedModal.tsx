import { useMemo } from 'react'
import { Modal } from './ui'
import { useAppStore } from '../store/useAppStore'

/**
 * Focus session completed celebration popup.
 * Shows stats from the completed session + pet XP gain.
 */

interface FocusCompletedModalProps {
  isOpen: boolean
  onClose: () => void
  sessionMinutes: number
  totalSessions: number
  xpGained: number
  coinsGained: number
}

export default function FocusCompletedModal({
  isOpen,
  onClose,
  sessionMinutes,
  totalSessions,
  xpGained,
  coinsGained,
}: FocusCompletedModalProps) {
  const pet = useAppStore((s) => s.pet)

  const encouragement = useMemo(() => {
    if (totalSessions >= 4) return '太厉害了！你完成了一整组专注！'
    if (totalSessions >= 2) return '保持节奏，你做得很好！'
    return '第一个专注已完成，继续加油！'
  }, [totalSessions])

  const focusGoal = useMemo(() => {
    try {
      return localStorage.getItem('merize-current-focus-goal') || ''
    } catch {
      return ''
    }
  }, [])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center space-y-5 py-2">
        {/* Celebration emoji */}
        <div className="text-5xl animate-bounce">
          🎉
        </div>

        {/* Title */}
        <div>
          <h2
            className="text-lg font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            专注完成！
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {encouragement}
          </p>
        </div>

        {/* Goal achieved */}
        {focusGoal && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'var(--color-accent-soft)',
              color: 'var(--color-accent)',
            }}
          >
            <span className="opacity-70">目标：</span>
            <span className="font-medium">{focusGoal}</span>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon="⏱️" label="专注时长" value={`${sessionMinutes} 分钟`} />
          <StatCard icon="🔄" label="今日会话" value={`第 ${totalSessions} 次`} />
          <StatCard icon="✨" label="获得经验" value={`+${xpGained} XP`} accent />
          <StatCard icon="🪙" label="获得金币" value={`+${coinsGained}`} accent />
        </div>

        {/* Pet status */}
        <div
          className="flex items-center justify-center gap-2 text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <span>🐱</span>
          <span>{pet.name} 等级 {pet.level}</span>
          <span className="opacity-50">·</span>
          <span style={{ color: 'var(--color-accent)' }}>
            {pet.xp}/{pet.level * 100} XP
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 hover:shadow-lg"
            style={{
              background: 'var(--color-accent)',
              boxShadow: '0 2px 8px var(--color-accent-soft)',
            }}
          >
            继续
          </button>
        </div>
      </div>
    </Modal>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      className="rounded-xl px-3 py-3 text-center"
      style={{
        background: accent ? 'var(--color-accent-soft)' : 'var(--color-bg-surface-2)',
      }}
    >
      <div className="text-lg mb-0.5">{icon}</div>
      <div
        className="text-[11px] mb-0.5"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </div>
      <div
        className="text-sm font-bold"
        style={{ color: accent ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
      >
        {value}
      </div>
    </div>
  )
}
