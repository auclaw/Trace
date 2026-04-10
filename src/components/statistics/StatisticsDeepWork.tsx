import { useTranslation } from 'react-i18next'
import { Brain, Zap, BarChart3 } from 'lucide-react'
import { EmptyState, Progress } from '../../components/ui'

/* ─── Types ─── */
interface DeepAnalysisData {
  days: { date: string; deepMins: number; totalMins: number; shortCount: number }[]
  totalDeep: number
  totalAll: number
  deepScore: number
  hourlyDeep: number[]
  totalShort: number
  recommendations: string[]
}

interface StatisticsDeepWorkProps {
  deepAnalysis: DeepAnalysisData
  accentColor: string
}

/* ─── Helpers ─── */
function dayLabel(dateStr: string): string {
  return `周${(['日', '一', '二', '三', '四', '五', '六'][new Date(dateStr).getDay()])}`
}

function fmtHoursLabel(mins: number): string {
  const h = mins / 60
  return h >= 1 ? `${h.toFixed(1)} 小时` : `${Math.round(mins)} 分钟`
}

/* ─── Styles ─── */
const deepCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--color-bg-surface-1) 0%, var(--color-bg-surface-2) 100%)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 2px 12px rgba(44, 24, 16, 0.06), 0 0 1px rgba(44, 24, 16, 0.10)',
}

/* ─── Main Component ─── */
export default function StatisticsDeepWork({
  deepAnalysis,
}: StatisticsDeepWorkProps) {
  const { t } = useTranslation()

  if (deepAnalysis.totalAll === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <EmptyState icon={<Brain size={32} />} title={t('common.noData')} description={t('statistics.deepWorkNoData')} />
      </div>
    )
  }

  const maxDailyDeep = Math.max(...deepAnalysis.days.map((d) => d.deepMins), 1)
  const maxHourlyDeep = Math.max(...deepAnalysis.hourlyDeep, 1)
  const scoreColor = deepAnalysis.deepScore >= 50 ? 'var(--color-accent)' : '#f59e0b'
  const scorePercent = Math.min(deepAnalysis.deepScore, 100)
  const ringSize = 140
  const ringStroke = 10
  const ringRadius = (ringSize - ringStroke) / 2
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (scorePercent / 100) * ringCircumference

  return (
    <div className="space-y-8 animate-fade-in">
      <p className="text-sm text-[var(--color-text-muted)]">{t('statistics.deepWorkDescription')}</p>

      {/* Hero Score Card */}
      <div
        className="text-center"
        style={{
          ...deepCardStyle,
          background: 'linear-gradient(135deg, var(--color-bg-surface-1) 0%, var(--color-bg-surface-2) 60%, var(--color-accent-soft) 100%)',
          boxShadow: '0 4px 20px rgba(44, 24, 16, 0.08), 0 0 1px rgba(44, 24, 16, 0.12)',
          padding: '2rem',
        }}
      >
        <p className="text-sm font-medium text-[var(--color-text-muted)] mb-4 tracking-wide uppercase" style={{ letterSpacing: '0.08em', fontSize: '0.75rem' }}>
          {t('statistics.deepWorkRatio')}
        </p>
        <div className="relative inline-flex items-center justify-center mb-4">
          <div className="absolute rounded-full" style={{ width: ringSize + 20, height: ringSize + 20, background: `radial-gradient(circle, ${scoreColor}18 0%, transparent 70%)`, filter: 'blur(8px)' }} />
          <svg width={ringSize} height={ringSize} className="relative" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke="var(--color-border-subtle)" strokeWidth={ringStroke} opacity={0.3} />
            <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke={scoreColor} strokeWidth={ringStroke} strokeLinecap="round" strokeDasharray={ringCircumference} strokeDashoffset={ringOffset} style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </svg>
          <span className="metric-value absolute" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
            {deepAnalysis.deepScore.toFixed(0)}<span style={{ fontSize: '1.25rem' }}>%</span>
          </span>
        </div>
        <Progress value={deepAnalysis.deepScore} color={scoreColor} size="md" className="max-w-xs mx-auto mb-3" />
        <p className="text-xs text-[var(--color-text-muted)]" style={{ lineHeight: 1.6 }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{fmtHoursLabel(deepAnalysis.totalDeep)}</span>
          {' '}{t('statistics.deepWork')}{' / '}
          <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{fmtHoursLabel(deepAnalysis.totalAll)}</span>
          {' '}{t('statistics.totalTime')}
        </p>
      </div>

      {/* Daily Deep Work Bars */}
      <div style={{ ...deepCardStyle, padding: '1.25rem' }}>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">{t('statistics.dailyDeepWork')}</h3>
        <div className="flex items-end gap-3" style={{ height: '10rem' }}>
          {deepAnalysis.days.map((d) => {
            const pct = maxDailyDeep > 0 ? (d.deepMins / maxDailyDeep) * 100 : 0
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] tabular-nums font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {d.deepMins > 0 ? `${(d.deepMins / 60).toFixed(1)}h` : ''}
                </span>
                <div className="w-full flex items-end" style={{ height: '110px' }}>
                  <div
                    className="w-full transition-[height] duration-700"
                    style={{
                      height: `${Math.max(pct, 3)}%`,
                      background: pct > 0 ? 'linear-gradient(180deg, var(--color-accent) 0%, var(--color-accent)aa 100%)' : 'var(--color-border-subtle)',
                      borderRadius: '6px 6px 3px 3px',
                      opacity: pct > 0 ? 1 : 0.15,
                      boxShadow: pct > 30 ? '0 2px 8px rgba(44, 24, 16, 0.10)' : 'none',
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {dayLabel(d.date).slice(1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Hourly Heatmap */}
      <div style={{ ...deepCardStyle, padding: '1.25rem' }}>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{t('statistics.hourlyDeepWorkHeatmap')}</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">{t('statistics.hourlyDeepWorkDesc')}</p>
        <div className="grid grid-cols-12 gap-2">
          {deepAnalysis.hourlyDeep.slice(6, 23).map((mins, i) => {
            const hour = i + 6
            const intensity = maxHourlyDeep > 0 ? mins / maxHourlyDeep : 0
            return (
              <div key={hour} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-full aspect-square"
                  style={{
                    borderRadius: '8px',
                    background: intensity > 0.01 ? 'linear-gradient(135deg, var(--color-accent), var(--color-accent)cc)' : 'var(--color-bg-surface-3)',
                    opacity: Math.max(0.08, intensity * 0.9),
                    transition: 'opacity 400ms ease, transform 200ms ease',
                    boxShadow: intensity > 0.5 ? '0 2px 8px rgba(44, 24, 16, 0.12)' : 'none',
                  }}
                  title={`${hour}:00 — ${Math.round(mins)} ${t('common.minutes')}`}
                />
                {hour % 3 === 0 && (
                  <span className="text-[9px] font-medium text-[var(--color-text-muted)]">{hour}:00</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Interruption Analysis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div style={{ ...deepCardStyle, padding: '1.25rem' }}>
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--color-accent-soft)' }}>
              <Zap size={20} style={{ color: 'var(--color-accent)' }} />
            </span>
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-1">{t('statistics.shortActivityCount')} (&lt;10{t('common.minutes')})</p>
              <p className="metric-value" style={{ fontSize: '1.75rem' }}>{deepAnalysis.totalShort}</p>
            </div>
          </div>
        </div>
        <div style={{ ...deepCardStyle, padding: '1.25rem' }}>
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--color-accent-soft)' }}>
              <BarChart3 size={20} style={{ color: 'var(--color-accent)' }} />
            </span>
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-1">{t('statistics.dailyAvgShortActivity')}</p>
              <p className="metric-value" style={{ fontSize: '1.75rem' }}>{(deepAnalysis.totalShort / 7).toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] -mt-4 px-1">{t('statistics.shortActivityNote')}</p>

      {/* Recommendations */}
      <div style={{ ...deepCardStyle, padding: '1.25rem' }}>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">{t('statistics.recommendations')}</h3>
        <div className="space-y-3">
          {deepAnalysis.recommendations.map((rec, i) => (
            <div
              key={i}
              className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]"
              style={{ background: 'var(--color-bg-surface-2)', borderRadius: '12px', padding: '0.875rem 1rem', border: '1px solid var(--color-border-subtle)' }}
            >
              <span className="shrink-0 flex items-center justify-center font-bold text-xs" style={{ width: 24, height: 24, borderRadius: '8px', background: 'var(--color-accent-gradient)', color: '#fff', marginTop: '1px' }}>
                {i + 1}
              </span>
              <span style={{ lineHeight: 1.6 }}>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
