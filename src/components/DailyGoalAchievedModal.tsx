import { Modal } from './ui'
import { useAppStore } from '../store/useAppStore'

/**
 * Popup shown when the user achieves their daily focus goal.
 */

interface DailyGoalAchievedModalProps {
  isOpen: boolean
  onClose: () => void
  totalMinutes: number
  goalMinutes: number
}

export default function DailyGoalAchievedModal({
  isOpen,
  onClose,
  totalMinutes,
  goalMinutes,
}: DailyGoalAchievedModalProps) {
  const pet = useAppStore((s) => s.pet)

  const percentage = Math.round((totalMinutes / goalMinutes) * 100)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center space-y-5 py-2">
        {/* Trophy */}
        <div className="text-5xl">🏆</div>

        {/* Title */}
        <div>
          <h2
            className="text-lg font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            每日目标达成！
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            你今天的努力得到了回报
          </p>
        </div>

        {/* Progress ring */}
        <div className="flex justify-center">
          <div className="relative w-28 h-28">
            <svg width="112" height="112" viewBox="0 0 112 112">
              {/* Background ring */}
              <circle
                cx="56" cy="56" r="48"
                fill="none"
                stroke="var(--color-bg-surface-2)"
                strokeWidth="8"
              />
              {/* Progress ring */}
              <circle
                cx="56" cy="56" r="48"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(percentage / 100, 1) * 301.6} 301.6`}
                transform="rotate(-90 56 56)"
                style={{ filter: 'drop-shadow(0 0 6px var(--color-accent-soft))' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-xl font-bold"
                style={{ color: 'var(--color-accent)' }}
              >
                {percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'var(--color-bg-surface-2)' }}
        >
          <div className="flex justify-between items-center text-sm">
            <span style={{ color: 'var(--color-text-secondary)' }}>今日工作时间</span>
            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {hours > 0 ? `${hours}小时` : ''}{mins > 0 ? `${mins}分钟` : ''}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span style={{ color: 'var(--color-text-secondary)' }}>每日目标</span>
            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {Math.floor(goalMinutes / 60)}小时
            </span>
          </div>
        </div>

        {/* Pet celebration */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'var(--color-accent-soft)' }}
        >
          <span className="text-2xl">🐱</span>
          <div className="text-left">
            <p className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
              {pet.name} 为你骄傲！
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              奖励金币 +10
            </p>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-150 hover:opacity-90"
          style={{
            background: 'var(--color-accent)',
            boxShadow: '0 2px 8px var(--color-accent-soft)',
          }}
        >
          太棒了！
        </button>
      </div>
    </Modal>
  )
}
