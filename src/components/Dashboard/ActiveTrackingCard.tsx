// Active Tracking Card - shows current tracking status when tracking is active
// Splitted from Dashboard.tsx

import { useTranslation } from 'react-i18next'
import { CATEGORY_COLORS } from '../../config/themes'
import type { Activity } from '../../services/dataService'

interface ActiveTrackingCardProps {
  currentTracking: Activity | null
  onNavigateToTimeline: () => void
  fmtTime: (iso: string) => string
}

export default function ActiveTrackingCard({
  currentTracking,
  onNavigateToTimeline,
  fmtTime,
}: ActiveTrackingCardProps) {
  const { t } = useTranslation()

  if (!currentTracking) return null

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-5 py-3"
      style={{
        background: currentTracking
          ? `linear-gradient(135deg, ${CATEGORY_COLORS[currentTracking.category] || 'var(--color-accent)'}12, ${CATEGORY_COLORS[currentTracking.category] || 'var(--color-accent)'}06)`
          : 'var(--color-bg-surface-2)',
        border: `1px solid ${currentTracking ? `${CATEGORY_COLORS[currentTracking.category] || 'var(--color-accent)'}30` : 'var(--color-border-subtle)'}`,
      }}
    >
      <span className="relative flex h-3 w-3">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ background: currentTracking ? CATEGORY_COLORS[currentTracking.category] || 'var(--color-accent)' : 'var(--color-accent)' }}
        />
        <span
          className="relative inline-flex rounded-full h-3 w-3"
          style={{ background: currentTracking ? CATEGORY_COLORS[currentTracking.category] || 'var(--color-accent)' : 'var(--color-accent)' }}
        />
      </span>
      {currentTracking ? (
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {t('dashboard.tracking')}: {currentTracking.name}
          </span>
          <span className="text-[12px] ml-2" style={{ color: 'var(--color-text-muted)' }}>
            {fmtTime(currentTracking.startTime)} {t('dashboard.started')} · {currentTracking.category}
          </span>
        </div>
      ) : (
        <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          {t('dashboard.trackingWaiting')}
        </span>
      )}
      <button
        onClick={onNavigateToTimeline}
        className="text-[11px] px-2.5 py-1 rounded-full"
        style={{
          background: 'var(--color-accent-soft)',
          color: 'var(--color-accent)',
        }}
      >
        {t('nav.timeline')}
      </button>
    </div>
  )
}
