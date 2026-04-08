import { useEffect, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import dataService from '../services/dataService'
import { EmptyState, Progress } from '../components/ui'

/* ── helpers ── */
const DEEP_CATEGORIES = new Set(['开发', '学习'])

function fmtHours(mins: number): string {
  const h = mins / 60
  return h >= 1 ? `${h.toFixed(1)} 小时` : `${Math.round(mins)} 分钟`
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `周${days[d.getDay()]}`
}

/* ── inline styles ── */
const warmCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--color-bg-surface-1) 0%, var(--color-bg-surface-2) 100%)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 2px 12px rgba(44, 24, 16, 0.06), 0 0 1px rgba(44, 24, 16, 0.10)',
}

const heroCardStyle: React.CSSProperties = {
  ...warmCardStyle,
  background: 'linear-gradient(135deg, var(--color-bg-surface-1) 0%, var(--color-bg-surface-2) 60%, var(--color-accent-soft) 100%)',
  boxShadow: '0 4px 20px rgba(44, 24, 16, 0.08), 0 0 1px rgba(44, 24, 16, 0.12)',
}

/* ── stagger delay helper ── */
function staggerStyle(index: number): React.CSSProperties {
  return {
    opacity: 0,
    animation: `fadeIn 450ms cubic-bezier(0.4, 0, 0.2, 1) ${index * 80}ms forwards`,
  }
}

/* ══════════════════════════════════════════════════
   Deep Work Stats Page
   ══════════════════════════════════════════════════ */
export default function DeepWorkStats() {
  useTheme() // hook must be called for theme reactivity
  const loadActivities = useAppStore((s) => s.loadActivities)

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  const analysis = useMemo(() => {
    const now = new Date()
    const days: { date: string; deepMins: number; totalMins: number; shortCount: number }[] = []
    const hourlyDeep: number[] = new Array(24).fill(0)

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const ds = toDateStr(d)
      const activities = dataService.getActivities(ds)

      let deepMins = 0
      let totalMins = 0
      let shortCount = 0

      for (const a of activities) {
        totalMins += a.duration
        if (DEEP_CATEGORIES.has(a.category)) {
          deepMins += a.duration
          const hour = parseInt(a.startTime.slice(11, 13), 10)
          if (!isNaN(hour)) hourlyDeep[hour] += a.duration
        }
        if (a.duration < 10) shortCount++
      }

      days.push({ date: ds, deepMins, totalMins, shortCount })
    }

    const totalDeep = days.reduce((s, d) => s + d.deepMins, 0)
    const totalAll = days.reduce((s, d) => s + d.totalMins, 0)
    const totalShort = days.reduce((s, d) => s + d.shortCount, 0)
    const deepScore = totalAll > 0 ? (totalDeep / totalAll) * 100 : 0

    // Recommendations
    const recommendations: string[] = []
    if (deepScore < 40) {
      recommendations.push('深度工作占比偏低，建议减少碎片化任务，安排完整时间块专注于开发和学习。')
    } else if (deepScore >= 60) {
      recommendations.push('深度工作占比很高，继续保持！适当安排休息防止疲劳。')
    } else {
      recommendations.push('深度工作比例良好，可以尝试增加长时间专注块来进一步提升效率。')
    }

    const peakHour = hourlyDeep.indexOf(Math.max(...hourlyDeep))
    if (Math.max(...hourlyDeep) > 0) {
      recommendations.push(
        `你的深度工作高峰期在 ${peakHour}:00 左右，建议把最重要的任务安排在这个时段。`,
      )
    }

    if (totalShort > 10) {
      recommendations.push(
        `本周有 ${totalShort} 次短于 10 分钟的活动插在深度工作之间，频繁切换会降低效率。`,
      )
    }

    return { days, totalDeep, totalAll, deepScore, hourlyDeep, totalShort, recommendations }
  }, [])

  if (analysis.totalAll === 0) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
          深度工作分析
        </h2>
        <EmptyState
          icon="🧠"
          title="暂无数据"
          description="继续使用一段时间后，将根据你的开发和学习活动生成深度工作分析。"
        />
      </div>
    )
  }

  const maxDailyDeep = Math.max(...analysis.days.map((d) => d.deepMins), 1)
  const maxHourly = Math.max(...analysis.hourlyDeep, 1)
  const scoreColor = analysis.deepScore >= 50 ? 'var(--color-accent)' : '#f59e0b'
  const scorePercent = Math.min(analysis.deepScore, 100)

  /* SVG ring constants */
  const ringSize = 140
  const ringStroke = 10
  const ringRadius = (ringSize - ringStroke) / 2
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (scorePercent / 100) * ringCircumference

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* ─── Page Header ─── */}
      <div style={staggerStyle(0)}>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          深度工作分析
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          分析「开发」和「学习」类活动占比与分布
        </p>
      </div>

      {/* ─── Hero Score Card ─── */}
      <div style={{ ...heroCardStyle, padding: '2rem', ...staggerStyle(1) }} className="text-center">
        <p className="text-sm font-medium text-[var(--color-text-muted)] mb-4 tracking-wide uppercase"
           style={{ letterSpacing: '0.08em', fontSize: '0.75rem' }}>
          深度工作占比
        </p>

        {/* Circular progress ring */}
        <div className="relative inline-flex items-center justify-center mb-4">
          {/* Glow backdrop */}
          <div
            className="absolute rounded-full"
            style={{
              width: ringSize + 20,
              height: ringSize + 20,
              background: `radial-gradient(circle, ${scoreColor}18 0%, transparent 70%)`,
              filter: 'blur(8px)',
            }}
          />
          <svg
            width={ringSize}
            height={ringSize}
            className="relative"
            style={{ transform: 'rotate(-90deg)' }}
          >
            {/* Track */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              stroke="var(--color-border-subtle)"
              strokeWidth={ringStroke}
              opacity={0.3}
            />
            {/* Progress arc */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              stroke={scoreColor}
              strokeWidth={ringStroke}
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </svg>
          {/* Center number */}
          <span
            className="metric-value absolute"
            style={{ fontSize: '2.5rem', lineHeight: 1 }}
          >
            {analysis.deepScore.toFixed(0)}
            <span style={{ fontSize: '1.25rem' }}>%</span>
          </span>
        </div>

        <Progress
          value={analysis.deepScore}
          color={scoreColor}
          size="md"
          className="max-w-xs mx-auto mb-3"
        />
        <p className="text-xs text-[var(--color-text-muted)]" style={{ lineHeight: 1.6 }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            {fmtHours(analysis.totalDeep)}
          </span>
          {' '}深度工作{' / '}
          <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            {fmtHours(analysis.totalAll)}
          </span>
          {' '}总时间
        </p>
      </div>

      {/* ─── Daily Deep Work Bar Chart ─── */}
      <div style={{ ...warmCardStyle, padding: '1.25rem', ...staggerStyle(2) }}>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
          每日深度工作时间
        </h3>
        <div className="flex items-end gap-3" style={{ height: '10rem' }}>
          {analysis.days.map((d) => {
            const pct = maxDailyDeep > 0 ? (d.deepMins / maxDailyDeep) * 100 : 0
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                <span
                  className="text-[10px] tabular-nums font-medium"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {d.deepMins > 0 ? `${(d.deepMins / 60).toFixed(1)}h` : ''}
                </span>
                <div className="w-full flex items-end" style={{ height: '110px' }}>
                  <div
                    className="w-full transition-[height] duration-700"
                    style={{
                      height: `${Math.max(pct, 3)}%`,
                      background:
                        pct > 0
                          ? 'linear-gradient(180deg, var(--color-accent) 0%, var(--color-accent)aa 100%)'
                          : 'var(--color-border-subtle)',
                      borderRadius: '6px 6px 3px 3px',
                      opacity: pct > 0 ? 1 : 0.15,
                      boxShadow: pct > 30 ? '0 2px 8px rgba(44, 24, 16, 0.10)' : 'none',
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {dayLabel(d.date).slice(1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Hourly Heatmap ─── */}
      <div style={{ ...warmCardStyle, padding: '1.25rem', ...staggerStyle(3) }}>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
          时段深度工作热力图
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          过去 7 天各时段深度工作累计时间
        </p>
        <div className="grid grid-cols-12 gap-2">
          {analysis.hourlyDeep.slice(6, 23).map((mins, i) => {
            const hour = i + 6
            const intensity = maxHourly > 0 ? mins / maxHourly : 0
            return (
              <div key={hour} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-full aspect-square"
                  style={{
                    borderRadius: '8px',
                    background:
                      intensity > 0.01
                        ? `linear-gradient(135deg, var(--color-accent), var(--color-accent)cc)`
                        : 'var(--color-bg-surface-3)',
                    opacity: Math.max(0.08, intensity * 0.9),
                    transition: 'opacity 400ms ease, transform 200ms ease',
                    boxShadow:
                      intensity > 0.5
                        ? '0 2px 8px rgba(44, 24, 16, 0.12)'
                        : 'none',
                  }}
                  title={`${hour}:00 — ${Math.round(mins)} 分钟`}
                />
                {hour % 3 === 0 && (
                  <span className="text-[9px] font-medium text-[var(--color-text-muted)]">
                    {hour}:00
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Interruption Analysis ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={staggerStyle(4)}>
        <div style={{ ...warmCardStyle, padding: '1.25rem' }}>
          <div className="flex items-start gap-3">
            <span
              className="flex items-center justify-center shrink-0"
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-accent-soft)',
                fontSize: '1.2rem',
              }}
            >
              ⚡
            </span>
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-1">短活动次数 (&lt;10分钟)</p>
              <p className="metric-value" style={{ fontSize: '1.75rem' }}>
                {analysis.totalShort}
              </p>
            </div>
          </div>
        </div>
        <div style={{ ...warmCardStyle, padding: '1.25rem' }}>
          <div className="flex items-start gap-3">
            <span
              className="flex items-center justify-center shrink-0"
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-accent-soft)',
                fontSize: '1.2rem',
              }}
            >
              📊
            </span>
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-1">日均短活动</p>
              <p className="metric-value" style={{ fontSize: '1.75rem' }}>
                {(analysis.totalShort / 7).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <p
        className="text-xs text-[var(--color-text-muted)] -mt-4 px-1"
        style={staggerStyle(4)}
      >
        短于 10 分钟的活动穿插在深度工作之间会打断心流状态
      </p>

      {/* ─── Recommendations ─── */}
      <div style={{ ...warmCardStyle, padding: '1.25rem', ...staggerStyle(5) }}>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
          改进建议
        </h3>
        <div className="space-y-3">
          {analysis.recommendations.map((rec, i) => (
            <div
              key={i}
              className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]"
              style={{
                background: 'var(--color-bg-surface-2)',
                borderRadius: '12px',
                padding: '0.875rem 1rem',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <span
                className="shrink-0 flex items-center justify-center font-bold text-xs"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '8px',
                  background: 'var(--color-accent-gradient)',
                  color: '#fff',
                  marginTop: '1px',
                }}
              >
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
