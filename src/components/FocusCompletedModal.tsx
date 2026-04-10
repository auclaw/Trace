import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, RefreshCw, Sparkles, Coins, Cat } from 'lucide-react'
import { Modal } from './ui'
import { useAppStore } from '../store/useAppStore'
import type { AppState } from '../store/useAppStore'

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
  const { t } = useTranslation()
  const pet = useAppStore((s: AppState) => s.pet)

  const encouragement = useMemo(() => {
    if (totalSessions >= 4) return t('popups.encouragement4')
    if (totalSessions >= 2) return t('popups.encouragement2')
    return t('popups.encouragement1')
  }, [totalSessions, t])

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
            {t('popups.focusCompleted')}
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
            <span className="opacity-70">{t('popups.goal')}：</span>
            <span className="font-medium">{focusGoal}</span>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Clock size={20} />} label={t('focus.timer')} value={`${sessionMinutes} ${t('common.minutes')}`} />
          <StatCard icon={<RefreshCw size={20} />} label={t('focus.todaysSessions')} value={`${totalSessions}`} />
          <StatCard icon={<Sparkles size={20} />} label={t('pet.xp')} value={`+${xpGained} ${t('pet.xpUnit')}`} accent />
          <StatCard icon={<Coins size={20} />} label={t('pet.coins')} value={`+${coinsGained}`} accent />
        </div>

        {/* Pet status */}
        <div
          className="flex items-center justify-center gap-2 text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <span style={{ color: 'var(--color-accent)' }}><Cat size={18} /></span>
          <span>{pet.name} {t('pet.level')} {pet.level}</span>
          <span className="opacity-50">·</span>
          <span style={{ color: 'var(--color-accent)' }}>
            {pet.xp}/{pet.level * 100} {t('pet.xpUnit')}
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
            {t('popups.continue')}
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
  icon: React.ReactNode
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
      <div className="mb-1" style={{ color: accent ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>{icon}</div>
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
