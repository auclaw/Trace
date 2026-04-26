import { useTranslation } from 'react-i18next'
import {
  Clock,
  TrendingUp,
  Award,
  Target,
  Shuffle,
  BarChart3,
} from 'lucide-react'
import { Card, Button, EmptyState } from '../../components/ui'
import {
  BarChart, Bar as RechartsBar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { CATEGORY_COLORS } from '../../config/themes'
import type { DailyStat } from '../../services/dataService'

/* ─── Types ─── */
interface StatisticsOverviewProps {
  period: 'week' | 'month'
  data: {
    daily: DailyStat[]
    categories: Record<string, number>
  }
  totalMinutes: number
  avgDaily: number
  activeDays: DailyStat[]
  mostProductiveDay: DailyStat | null
  topCategory: { name: string; minutes: number } | null
  contextSwitchStats: {
    avg: number
    trend: 'up' | 'down' | 'flat'
  }
  accentColor: string
  onExportJSON: () => void
  onExportCSV: () => void
}

/* ─── Helpers ─── */
function shortDay(dateStr: string): string {
  const d = new Date(dateStr)
  return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function fmtHours(mins: number): string {
  return (mins / 60).toFixed(1)
}

/* ─── Styles ─── */
const tooltipStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--color-bg-surface-1) 0%, #fef8f0 100%)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  boxShadow: '0 8px 24px rgba(44, 24, 16, 0.12), 0 0 1px rgba(44, 24, 16, 0.08)',
}

const warmCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--color-bg-surface-1) 0%, #fef8f0 100%)',
  borderRadius: 'var(--radius-lg)',
}

/* ─── Tooltip Components ─── */
function BarTooltipContent({ active, payload, label }: any) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null
  return (
    <div style={tooltipStyle}>
      <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-0.5">{label}</p>
      <p className="text-sm font-bold" style={{ color: payload[0].payload.fill || payload[0].fill }}>{payload[0].value} {t('common.hours')}</p>
    </div>
  )
}

function PieTooltipContent({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltipStyle}>
      <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-0.5">{payload[0].name}</p>
      <p className="text-sm font-bold" style={{ color: payload[0].payload?.fill }}>{fmtDuration(payload[0].value)}</p>
    </div>
  )
}

/* ─── Main Component ─── */
export default function StatisticsOverview({
  period,
  data,
  totalMinutes,
  avgDaily,
  mostProductiveDay,
  topCategory,
  contextSwitchStats,
  accentColor,
  onExportJSON,
  onExportCSV,
}: StatisticsOverviewProps) {
  const { t } = useTranslation()
  const periodLabel = period === 'week' ? t('common.thisWeek') : t('common.thisMonth')
  const hasData = totalMinutes > 0

  const barData = data.daily.map((d) => ({
    date: d.date,
    label: period === 'week' ? shortDay(d.date) : d.date.slice(8),
    hours: Number((d.totalMinutes / 60).toFixed(2)),
  }))

  const pieData = Object.entries(data.categories)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  const categoryTable = Object.entries(data.categories)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, mins]) => ({
      cat,
      mins,
      pct: (mins / (totalMinutes || 1)) * 100,
      color: CATEGORY_COLORS[cat] || CATEGORY_COLORS['其他'],
    }))

  if (!hasData) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-end">
          <div
            className="flex items-center gap-1 p-1"
            style={{
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-bg-surface-2)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            {(['week', 'month'] as const).map((p) => (
              <span
                key={p}
                className="px-5 py-1.5 text-sm font-medium"
                style={{
                  color: period === p ? accentColor : 'var(--color-text-muted)',
                }}
              >
                {p === 'week' ? t('common.thisWeek') : t('common.thisMonth')}
              </span>
            ))}
          </div>
        </div>
        <EmptyState icon={<BarChart3 size={32} />} title={t('common.noData')} description={t('statistics.noDataForPeriod', { period: periodLabel })} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Period selector */}
      <div className="flex justify-end">
        <div
          className="flex items-center gap-1 p-1"
          style={{
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-bg-surface-2)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          {(['week', 'month'] as const).map((p) => (
            <button
              key={p}
              className="cursor-pointer px-5 py-1.5 text-sm font-medium rounded-full transition-colors"
              style={{
                background: period === p ? 'var(--color-accent-soft)' : 'transparent',
                color: period === p ? accentColor : 'var(--color-text-muted)',
              }}
            >
              {p === 'week' ? t('common.thisWeek') : t('common.thisMonth')}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-5">
        <Card padding="sm" className="text-center" style={warmCardStyle}>
          <div className="py-5 px-3">
            <div className="mb-2" style={{ color: 'var(--color-accent)' }}><Clock size={20} className="mx-auto" /></div>
            <p className="metric-label mb-2">{t('statistics.totalHours')}</p>
            <p className="metric-value tabular-nums">
              {fmtHours(totalMinutes)}<span style={{ fontSize: '0.875rem', fontWeight: 400, opacity: 0.6 }}>h</span>
            </p>
          </div>
        </Card>
        <Card padding="sm" className="text-center" style={warmCardStyle}>
          <div className="py-5 px-3">
            <div className="mb-2" style={{ color: 'var(--color-accent)' }}><TrendingUp size={20} className="mx-auto" /></div>
            <p className="metric-label mb-2">{t('statistics.avgDaily')}</p>
            <p className="metric-value tabular-nums">
              {fmtHours(avgDaily)}<span style={{ fontSize: '0.875rem', fontWeight: 400, opacity: 0.6 }}>h</span>
            </p>
          </div>
        </Card>
        <Card padding="sm" className="text-center" style={warmCardStyle}>
          <div className="py-5 px-3">
            <div className="mb-2" style={{ color: 'var(--color-accent)' }}><Award size={20} className="mx-auto" /></div>
            <p className="metric-label mb-2">{t('statistics.mostProductiveDay')}</p>
            {mostProductiveDay ? (
              <div>
                <p className="text-base font-bold text-[var(--color-text-primary)]">{t('statistics.dayOfWeek', { day: shortDay(mostProductiveDay.date) })}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{fmtDuration(mostProductiveDay.totalMinutes)}</p>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">-</p>
            )}
          </div>
        </Card>
        <Card padding="sm" className="text-center" style={warmCardStyle}>
          <div className="py-5 px-3">
            <div className="mb-2" style={{ color: 'var(--color-accent)' }}><Target size={20} className="mx-auto" /></div>
            <p className="metric-label mb-2">{t('statistics.topCategory')}</p>
            {topCategory ? (
              <div className="inline-flex">
                <span className="bg-[var(--color-accent-soft)] text-[var(--color-accent)] px-2 py-0.5 rounded-full text-xs font-medium">
                  {topCategory.name}
                </span>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">-</p>
            )}
          </div>
        </Card>
        <Card padding="sm" className="text-center" style={warmCardStyle}>
          <div className="py-5 px-3">
            <div className="mb-2" style={{ color: 'var(--color-accent)' }}><Shuffle size={20} className="mx-auto" /></div>
            <p className="metric-label mb-2">{t('statistics.contextSwitch')}</p>
            <div>
              <p className="metric-value tabular-nums" style={{
                color: contextSwitchStats.avg <= 5 ? 'var(--color-success, #22c55e)' : contextSwitchStats.avg <= 10 ? 'var(--color-warning, #f59e0b)' : 'var(--color-error, #ef4444)',
              }}>
                {contextSwitchStats.avg.toFixed(1)}<span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.6 }}>/{t('common.day')}</span>
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span style={{
                  fontSize: '0.75rem',
                  color: contextSwitchStats.trend === 'down' ? 'var(--color-success, #22c55e)' : contextSwitchStats.trend === 'up' ? 'var(--color-error, #ef4444)' : 'var(--color-text-muted)',
                }}>
                  {contextSwitchStats.trend === 'down' ? `↓ ${t('statistics.decreasing')}` : contextSwitchStats.trend === 'up' ? `↑ ${t('statistics.increasing')}` : `→ ${t('statistics.flat')}`}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card padding="sm" className="lg:col-span-3" style={warmCardStyle}>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] px-4 pt-4 pb-5" style={{ letterSpacing: '-0.01em' }}>{t('statistics.dailyDuration')}</h2>
          <div className="h-64 px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" strokeOpacity={0.35} vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} width={32} tickFormatter={(v) => `${v}h`} />
                <Tooltip content={<BarTooltipContent />} cursor={{ fill: 'var(--color-accent-soft)', opacity: 0.4, radius: 4 }} />
                <RechartsBar dataKey="hours" radius={[8, 8, 0, 0]} fill={accentColor} maxBarSize={40} animationDuration={800} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="sm" className="lg:col-span-2" style={warmCardStyle}>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] px-4 pt-4 pb-5" style={{ letterSpacing: '-0.01em' }}>{t('statistics.categoryBreakdown')}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none" animationDuration={800} animationEasing="ease-out">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS['其他']} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltipContent />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 8 }} formatter={(value: string) => (
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: 2 }}>{value}</span>
                )} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Category Table */}
      <Card padding="sm" style={warmCardStyle}>
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] px-4 pt-4 pb-3" style={{ letterSpacing: '-0.01em' }}>{t('statistics.categoryDetails')}</h2>
        <div className="px-2 pb-2">
          {categoryTable.map(({ cat, mins, pct, color }, idx) => (
            <div
              key={cat}
              className="flex items-center gap-3 px-3 py-3"
              style={{
                borderRadius: 'var(--radius-md)',
                background: idx % 2 === 0 ? 'var(--color-bg-surface-2)' : 'transparent',
                transition: 'background var(--duration-fast) var(--ease-default)',
              }}
            >
              <span className="w-3 h-3 shrink-0" style={{ background: color, borderRadius: 'var(--radius-sm)' }} />
              <span className="text-sm font-medium text-[var(--color-text-primary)] w-16">{cat}</span>
              <div className="flex-1">
                <div
                  className="h-2.5 transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    borderRadius: 'var(--radius-full)',
                    background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`,
                    boxShadow: `0 2px 6px ${color}30`,
                  }}
                />
              </div>
              <span className="text-xs tabular-nums font-medium text-[var(--color-text-secondary)] w-14 text-right">{fmtDuration(mins)}</span>
              <span className="text-xs tabular-nums text-[var(--color-text-muted)] w-12 text-right">{pct.toFixed(1)}%</span>
            </div>
          ))}
          <div className="flex items-center gap-3 px-3 py-3 mt-1" style={{ borderRadius: 'var(--radius-md)', borderTop: '1px solid var(--color-border-subtle)' }}>
            <span className="w-3 h-3" />
            <span className="text-sm font-bold text-[var(--color-text-primary)] w-16">{t('statistics.total')}</span>
            <div className="flex-1" />
            <span className="text-xs font-bold tabular-nums text-[var(--color-text-primary)] w-14 text-right">{fmtDuration(totalMinutes)}</span>
            <span className="text-xs tabular-nums text-[var(--color-text-muted)] w-12 text-right">100%</span>
          </div>
        </div>
      </Card>

      {/* Export Buttons */}
      <Card padding="sm" style={warmCardStyle}>
        <div className="flex flex-wrap items-center gap-3 px-4 py-4">
          <span className="text-sm font-semibold text-[var(--color-text-primary)] mr-auto">{t('statistics.export')}</span>
          <Button variant="secondary" size="sm" onClick={onExportJSON}>{t('statistics.exportJSON')}</Button>
          <Button variant="secondary" size="sm" onClick={onExportCSV}>{t('statistics.exportCSV')}</Button>
        </div>
      </Card>
    </div>
  )
}
