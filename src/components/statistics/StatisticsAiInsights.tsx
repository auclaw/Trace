import { useTranslation } from 'react-i18next'
import {
  Clock,
  TrendingUp,
  Star,
  Moon,
  Lightbulb,
  BarChart3,
  Calendar,
  Flame,
  Bot,
} from 'lucide-react'
import { EmptyState } from '../../components/ui'
import { CATEGORY_COLORS } from '../../config/themes'

/* ─── Types ─── */
interface AiAnalysisData {
  totalMins: number
  avgDaily: number
  bestDay: { date: string; totalMinutes: number } | null
  worstDay: { date: string; totalMinutes: number } | null
  catEntries: [string, number][]
  insights: string[]
  hourlyMinutes: number[]
  daily: { totalMinutes: number; date: string }[]
}

interface StatisticsAiInsightsProps {
  aiAnalysis: AiAnalysisData | null
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

/* ─── Sub-component ─── */
function CategoryBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div
      className="h-3.5 flex-1 overflow-hidden"
      style={{ borderRadius: 'var(--radius-full)', background: 'var(--color-bg-surface-3)' }}
    >
      <div
        className="h-full transition-[width] duration-700"
        style={{
          width: `${pct}%`,
          borderRadius: 'var(--radius-full)',
          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
        }}
      />
    </div>
  )
}

/* ─── Styles ─── */
const aiCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--color-bg-surface-1) 0%, #fef8f0 100%)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
}

/* ─── Main Component ─── */
export default function StatisticsAiInsights({
  aiAnalysis,
}: StatisticsAiInsightsProps) {
  const { t } = useTranslation()

  if (!aiAnalysis) {
    return (
      <div className="space-y-7 animate-fade-in">
        <EmptyState icon={<Bot size={32} />} title={t('common.noData')} description={t('statistics.aiNoData')} />
      </div>
    )
  }

  const aiMaxHourly = Math.max(...aiAnalysis.hourlyMinutes, 1)
  const aiMaxDaily = Math.max(...aiAnalysis.daily.map((d) => d.totalMinutes), 1)

  return (
    <div className="space-y-7 animate-fade-in">
      {/* AI Header badge */}
      <div className="flex items-center gap-3">
        <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 4px rgba(249,115,22,0.3))', lineHeight: 1 }}>&#10024;</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2, margin: 0 }}>{t('statistics.aiTitle')}</h2>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'var(--color-accent-gradient)', color: '#fff', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.02em', boxShadow: '0 2px 8px rgba(249,115,22,0.25)' }}>{t('statistics.aiGenerated')}</span>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '-12px 0 0 0' }}>{t('statistics.aiDescription')}</p>

      {/* Weekly Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总时长', value: fmtHoursLabel(aiAnalysis.totalMins), icon: <Clock size={24} /> },
          { label: '日均', value: fmtHoursLabel(aiAnalysis.avgDaily), icon: <TrendingUp size={24} /> },
          { label: '最高效日', value: aiAnalysis.bestDay ? dayLabel(aiAnalysis.bestDay.date) : '—', icon: <Star size={24} /> },
          { label: '最低效日', value: aiAnalysis.worstDay ? dayLabel(aiAnalysis.worstDay.date) : '—', icon: <Moon size={24} /> },
        ].map((card) => (
          <div
            key={card.label}
            style={{ ...aiCardStyle, padding: '20px 16px', transition: 'box-shadow var(--duration-normal) var(--ease-default), transform var(--duration-normal) var(--ease-default)', cursor: 'default' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ marginBottom: '8px', lineHeight: 1, color: 'var(--color-accent)' }}>{card.icon}</div>
            <p className="metric-label" style={{ marginBottom: '6px' }}>{card.label}</p>
            <p className="metric-value" style={{ margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div style={{ ...aiCardStyle, padding: '24px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lightbulb size={18} style={{ color: 'var(--color-accent)' }} /> {t('statistics.aiInsightsTitle')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {aiAnalysis.insights.map((text, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-surface-2)', border: '1px solid var(--color-border-subtle)', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '22px', height: '22px', borderRadius: 'var(--radius-full)', background: 'var(--color-accent-gradient)', color: '#fff', fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>
                {i + 1}
              </span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Category Distribution */}
      <div style={{ ...aiCardStyle, padding: '24px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} style={{ color: 'var(--color-accent)' }} /> {t('statistics.categoryDistribution')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {aiAnalysis.catEntries.map(([cat, mins]) => (
            <div key={cat} className="flex items-center gap-3">
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500, width: '56px', flexShrink: 0, textAlign: 'right' }}>{cat}</span>
              <CategoryBar value={mins} max={aiAnalysis.catEntries[0][1]} color={CATEGORY_COLORS[cat] || '#94a3b8'} />
              <span style={{ fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)', width: '72px', flexShrink: 0, fontWeight: 500 }}>{fmtHoursLabel(mins)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Trend */}
      <div style={{ ...aiCardStyle, padding: '24px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} style={{ color: 'var(--color-accent)' }} /> {t('statistics.dailyTrend')}
        </h3>
        <div className="flex items-end gap-3" style={{ height: '140px' }}>
          {aiAnalysis.daily.map((d) => {
            const pct = aiMaxDaily > 0 ? (d.totalMinutes / aiMaxDaily) * 100 : 0
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span style={{ fontSize: '0.625rem', fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  {d.totalMinutes > 0 ? `${Math.round(d.totalMinutes / 60)}h` : ''}
                </span>
                <div className="w-full flex items-end" style={{ height: '96px' }}>
                  <div
                    className="w-full transition-[height] duration-700"
                    style={{
                      height: `${Math.max(pct, 2)}%`,
                      borderRadius: 'var(--radius-sm) var(--radius-sm) 4px 4px',
                      background: pct > 0 ? 'var(--color-accent-gradient)' : 'var(--color-bg-surface-3)',
                      opacity: pct > 0 ? 0.85 : 0.25,
                      boxShadow: pct > 30 ? '0 2px 8px rgba(249,115,22,0.2)' : 'none',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  {dayLabel(d.date).slice(1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Hourly Focus Heatmap */}
      <div style={{ ...aiCardStyle, padding: '24px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={18} style={{ color: 'var(--color-accent)' }} /> {t('statistics.hourlyDistribution')}
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>{t('statistics.hourlyDistributionDesc')}</p>
        <div className="grid grid-cols-12 gap-1.5">
          {aiAnalysis.hourlyMinutes.slice(6, 23).map((mins, i) => {
            const hour = i + 6
            const intensity = aiMaxHourly > 0 ? mins / aiMaxHourly : 0
            return (
              <div key={hour} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-full aspect-square transition-colors"
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-accent)',
                    opacity: Math.max(0.06, intensity * 0.9),
                    boxShadow: intensity > 0.5 ? '0 1px 4px rgba(249,115,22,0.2)' : 'none',
                  }}
                  title={`${hour}:00 — ${Math.round(mins)} ${t('common.minutes')}`}
                />
                {hour % 3 === 0 && (
                  <span style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{hour}</span>
                )}
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '12px 0 0 0' }}>{t('statistics.hourlyDistributionHint')}</p>
      </div>
    </div>
  )
}
