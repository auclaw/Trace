// Today Stats Cards - four stat cards in a row
// Splitted from Dashboard.tsx

import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import ProgressRing from './ProgressRing'
import { CARD_GRADIENT_BG, TRANSITION_ALL } from './constants'

interface TodayStatsCardsProps {
  focusQualityScore: number
  focusScoreColor: string
  focusScoreGradient: string
  dailyGoalMinutes: number
  goalPct: number
  totalHours: number
  totalMins: number
  accentColor: string
  dailyStats: {
    activityCount: number
    totalMinutes: number
  }
  streak: number
}

export default function TodayStatsCards({
  focusQualityScore,
  focusScoreColor,
  focusScoreGradient,
  dailyGoalMinutes,
  goalPct,
  totalHours,
  totalMins,
  accentColor,
  dailyStats,
  streak,
}: TodayStatsCardsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  function fmtDuration(mins: number): string {
    const h = Math.floor(mins / 60)
    const m = Math.round(mins % 60)
    if (h > 0 && m > 0) return `${h}h ${m}m`
    if (h > 0) return `${h}h`
    return `${m}m`
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Focus Quality Score */}
      <div
        className="flex items-center gap-4 rounded-2xl cursor-pointer"
        onClick={() => navigate('/focus')}
        style={{
          background: CARD_GRADIENT_BG,
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-card)',
          padding: '20px 24px',
          transition: TRANSITION_ALL,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-card)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <div
          className="flex items-center justify-center w-[88px] h-[88px] rounded-2xl relative"
          style={{ background: `${focusScoreColor}12` }}
        >
          <span
            className="tabular-nums font-extrabold"
            style={{
              fontSize: '2rem',
              lineHeight: 1,
              backgroundImage: focusScoreGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: `drop-shadow(0 2px 8px ${focusScoreColor}40)`,
            }}
          >
            {focusQualityScore}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.focusQuality')}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <div
              className="h-1.5 w-12 rounded-full overflow-hidden"
              style={{ background: 'var(--color-border-subtle)', opacity: 0.3 }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${focusQualityScore}%`,
                  background: focusScoreGradient,
                  transition: 'width 700ms ease-out',
                }}
              />
            </div>
            <span className="text-[10px]" style={{ color: focusScoreColor }}>
              {focusQualityScore > 70 ? t('dashboard.focusQualityExcellent') : focusQualityScore >= 40 ? t('dashboard.focusQualityAverage') : t('dashboard.focusQualityNeedsImprovement')}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Goal */}
      <div
        className="flex items-center gap-4 rounded-2xl cursor-pointer"
        onClick={() => navigate('/focus')}
        style={{
          background: CARD_GRADIENT_BG,
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-card)',
          padding: '20px 24px',
          transition: TRANSITION_ALL,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-card)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <ProgressRing value={goalPct} color={accentColor} onClick={() => navigate('/focus')}>
          <span className="metric-value" style={{ fontSize: '1.25rem' }}>
            {totalHours}:{String(totalMins).padStart(2, '0')}
          </span>
        </ProgressRing>
        <div className="min-w-0">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('focus.title')}</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
            {Math.round(goalPct)}% {t('dashboard.goal')}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.target')}: {fmtDuration(dailyGoalMinutes)}
          </p>
        </div>
      </div>

      {/* Activity count */}
      <div
        className="flex items-center gap-4 rounded-2xl"
        style={{
          background: CARD_GRADIENT_BG,
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-card)',
          padding: '20px 24px',
          transition: TRANSITION_ALL,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-card)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <div
          className="flex items-center justify-center w-[88px] h-[88px] rounded-2xl"
          style={{ background: 'var(--color-accent-soft)' }}
        >
          <span className="metric-value">{dailyStats.activityCount}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.activityCount')}</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
            {t('dashboard.activitiesTracked')}
          </p>
        </div>
      </div>

      {/* Current Streak */}
      <div
        className="flex items-center gap-4 rounded-2xl"
        style={{
          background: CARD_GRADIENT_BG,
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-card)',
          padding: '20px 24px',
          transition: TRANSITION_ALL,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-card)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <div
          className="flex items-center justify-center w-[88px] h-[88px] rounded-2xl"
          style={{ background: 'var(--color-gold-soft)' }}
        >
          <span className="metric-value" style={{ fontSize: streak > 99 ? '1.5rem' : '2rem' }}>
            {streak}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.streak')}</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
            {t('dashboard.daysActive')}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            {streak >= 7 ? t('dashboard.streakGreat') : streak >= 3 ? t('dashboard.streakGood') : t('dashboard.streakStart')}
          </p>
        </div>
      </div>
    </div>
  )
}
