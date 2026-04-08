import { useEffect, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import dataService from '../services/dataService'
import { EmptyState } from '../components/ui'
import { CATEGORY_COLORS } from '../config/themes'

/* ── helpers ── */
function fmtHours(mins: number): string {
  const h = mins / 60
  return h >= 1 ? `${h.toFixed(1)} 小时` : `${Math.round(mins)} 分钟`
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `周${days[d.getDay()]}`
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/* ── animated bar with gradient fill ── */
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div
      className="h-3.5 flex-1 overflow-hidden"
      style={{
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-bg-surface-3)',
      }}
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

/* ── stagger delay helper ── */
function staggerStyle(index: number): React.CSSProperties {
  return {
    animationDelay: `${index * 80}ms`,
    animationFillMode: 'both',
  }
}

/* ══════════════════════════════════════════════════
   AI Summary Page — Premium Warm Design
   ══════════════════════════════════════════════════ */
export default function AiSummary() {
  useTheme() // hook must be called for theme reactivity
  const loadActivities = useAppStore((s) => s.loadActivities)

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  /* ── Compute insights from data ── */
  const analysis = useMemo(() => {
    const weekStats = dataService.getWeeklyStats()
    const { daily, categories } = weekStats

    if (daily.every((d) => d.totalMinutes === 0)) return null

    const totalMins = daily.reduce((s, d) => s + d.totalMinutes, 0)
    const avgDaily = totalMins / 7

    // Best / worst days
    const nonZeroDays = daily.filter((d) => d.totalMinutes > 0)
    const bestDay = nonZeroDays.reduce((a, b) => (a.totalMinutes >= b.totalMinutes ? a : b), nonZeroDays[0])
    const worstDay = nonZeroDays.reduce((a, b) => (a.totalMinutes <= b.totalMinutes ? a : b), nonZeroDays[0])

    // Top / least category
    const catEntries = Object.entries(categories).sort((a, b) => b[1] - a[1])
    const topCat = catEntries[0]
    const leastCat = catEntries.length > 1 ? catEntries[catEntries.length - 1] : null

    // Hourly productivity pattern (from last 7 days of raw activities)
    const now = new Date()
    const startDate = toDateStr(new Date(now.getTime() - 6 * 86400000))
    const endDate = toDateStr(now)
    const allActivities = dataService.getActivitiesRange(startDate, endDate)
    const hourlyMinutes: number[] = new Array(24).fill(0)
    for (const a of allActivities) {
      const hour = parseInt(a.startTime.slice(11, 13), 10)
      if (!isNaN(hour)) hourlyMinutes[hour] += a.duration
    }

    // Build insights
    const insights: string[] = []
    if (topCat) {
      insights.push(
        `本周你在「${topCat[0]}」上投入最多时间（${fmtHours(topCat[1])}）`,
      )
    }
    insights.push(
      `你的平均每日专注时间为 ${fmtHours(avgDaily)}，建议目标为 ${fmtHours(Math.max(avgDaily * 1.1, 480))}`,
    )
    if (bestDay) {
      insights.push(`${dayLabel(bestDay.date)}是你最高效的一天（${fmtHours(bestDay.totalMinutes)}）`)
    }
    if (leastCat) {
      insights.push(`建议：增加「${leastCat[0]}」的时间投入`)
    }

    return {
      totalMins,
      avgDaily,
      bestDay,
      worstDay,
      categories,
      catEntries,
      insights,
      hourlyMinutes,
      daily,
    }
  }, [])

  if (!analysis) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">&#10024;</span>
            <h2
              className="text-3xl font-extrabold"
              style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}
            >
              AI 智能总结
            </h2>
          </div>
        </div>
        <EmptyState
          icon="&#129302;"
          title="暂无数据"
          description="继续使用一段时间后，AI 将根据你的活动数据生成个性化洞察。"
        />
      </div>
    )
  }

  const maxHourly = Math.max(...analysis.hourlyMinutes, 1)
  const maxDaily = Math.max(...analysis.daily.map((d) => d.totalMinutes), 1)

  const statCards = [
    { label: '总时长', value: fmtHours(analysis.totalMins), icon: '\u23F1\uFE0F' },
    { label: '日均', value: fmtHours(analysis.avgDaily), icon: '\uD83D\uDCC8' },
    { label: '最高效日', value: analysis.bestDay ? dayLabel(analysis.bestDay.date) : '\u2014', icon: '\uD83C\uDF1F' },
    { label: '最低效日', value: analysis.worstDay ? dayLabel(analysis.worstDay.date) : '\u2014', icon: '\uD83D\uDCA4' },
  ]

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ─── Page Header ─── */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <span
            style={{
              fontSize: '2rem',
              filter: 'drop-shadow(0 2px 4px rgba(249,115,22,0.3))',
              lineHeight: 1,
            }}
          >&#10024;</span>
          <h2
            style={{
              fontSize: '1.875rem',
              fontWeight: 800,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            AI 智能总结
          </h2>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-accent-gradient)',
              color: '#fff',
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              boxShadow: '0 2px 8px rgba(249,115,22,0.25)',
            }}
          >
            AI 生成
          </span>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
          基于本周活动数据自动生成效率洞察
        </p>
      </div>

      {/* ─── Weekly Overview Stat Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="animate-fade-in"
            style={{
              ...staggerStyle(i),
              background: 'linear-gradient(135deg, #ffffff 0%, #fef8f0 100%)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-card)',
              padding: '20px 16px',
              transition: 'box-shadow var(--duration-normal) var(--ease-default), transform var(--duration-normal) var(--ease-default)',
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
              e.currentTarget.style.transform = 'translateY(-3px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-card)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ fontSize: '1.25rem', marginBottom: '4px', lineHeight: 1 }}>{card.icon}</div>
            <p className="metric-label" style={{ marginBottom: '6px' }}>{card.label}</p>
            <p className="metric-value" style={{ margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* ─── Insights ─── */}
      <div
        className="animate-fade-in"
        style={{
          ...staggerStyle(4),
          background: 'linear-gradient(135deg, #ffffff 0%, #fef8f0 100%)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          padding: '24px',
        }}
      >
        <h3 style={{
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '1.125rem' }}>{'\uD83D\uDCA1'}</span>
          洞察与建议
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {analysis.insights.map((text, i) => (
            <div
              key={i}
              className="animate-fade-in"
              style={{
                ...staggerStyle(i + 5),
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-surface-2)',
                border: '1px solid var(--color-border-subtle)',
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '22px',
                  height: '22px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-accent-gradient)',
                  color: '#fff',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                {i + 1}
              </span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Category Breakdown ─── */}
      <div
        className="animate-fade-in"
        style={{
          ...staggerStyle(9),
          background: 'linear-gradient(135deg, #ffffff 0%, #fef8f0 100%)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          padding: '24px',
        }}
      >
        <h3 style={{
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '1.125rem' }}>{'\uD83D\uDCCA'}</span>
          分类时间分布
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {analysis.catEntries.map(([cat, mins]) => (
            <div key={cat} className="flex items-center gap-3">
              <span style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                fontWeight: 500,
                width: '56px',
                flexShrink: 0,
                textAlign: 'right',
              }}>
                {cat}
              </span>
              <Bar
                value={mins}
                max={analysis.catEntries[0][1]}
                color={CATEGORY_COLORS[cat] || '#94a3b8'}
              />
              <span style={{
                fontSize: '0.8125rem',
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--color-text-muted)',
                width: '72px',
                flexShrink: 0,
                fontWeight: 500,
              }}>
                {fmtHours(mins)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Daily Trend ─── */}
      <div
        className="animate-fade-in"
        style={{
          ...staggerStyle(10),
          background: 'linear-gradient(135deg, #ffffff 0%, #fef8f0 100%)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          padding: '24px',
        }}
      >
        <h3 style={{
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '1.125rem' }}>{'\uD83D\uDCC5'}</span>
          每日趋势
        </h3>
        <div className="flex items-end gap-3" style={{ height: '140px' }}>
          {analysis.daily.map((d) => {
            const pct = maxDaily > 0 ? (d.totalMinutes / maxDaily) * 100 : 0
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span style={{
                  fontSize: '0.625rem',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--color-text-muted)',
                  fontWeight: 500,
                }}>
                  {d.totalMinutes > 0 ? `${Math.round(d.totalMinutes / 60)}h` : ''}
                </span>
                <div className="w-full flex items-end" style={{ height: '96px' }}>
                  <div
                    className="w-full transition-[height] duration-700"
                    style={{
                      height: `${Math.max(pct, 2)}%`,
                      borderRadius: 'var(--radius-sm) var(--radius-sm) 4px 4px',
                      background: pct > 0
                        ? 'var(--color-accent-gradient)'
                        : 'var(--color-bg-surface-3)',
                      opacity: pct > 0 ? 0.85 : 0.25,
                      boxShadow: pct > 30 ? '0 2px 8px rgba(249,115,22,0.2)' : 'none',
                    }}
                  />
                </div>
                <span style={{
                  fontSize: '0.6875rem',
                  color: 'var(--color-text-muted)',
                  fontWeight: 500,
                }}>
                  {dayLabel(d.date).slice(1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Hourly Focus Pattern ─── */}
      <div
        className="animate-fade-in"
        style={{
          ...staggerStyle(11),
          background: 'linear-gradient(135deg, #ffffff 0%, #fef8f0 100%)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          padding: '24px',
        }}
      >
        <h3 style={{
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 4px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '1.125rem' }}>{'\uD83D\uDD25'}</span>
          时段专注分布
        </h3>
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 16px 0',
        }}>
          过去 7 天各时段累计专注时间
        </p>
        <div className="grid grid-cols-12 gap-1.5">
          {analysis.hourlyMinutes.slice(6, 23).map((mins, i) => {
            const hour = i + 6
            const intensity = maxHourly > 0 ? mins / maxHourly : 0
            return (
              <div key={hour} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-full aspect-square transition-colors"
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: `var(--color-accent)`,
                    opacity: Math.max(0.06, intensity * 0.9),
                    boxShadow: intensity > 0.5 ? '0 1px 4px rgba(249,115,22,0.2)' : 'none',
                  }}
                  title={`${hour}:00 — ${Math.round(mins)} 分钟`}
                />
                {hour % 3 === 0 && (
                  <span style={{
                    fontSize: '0.5625rem',
                    color: 'var(--color-text-muted)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {hour}
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          margin: '12px 0 0 0',
        }}>
          颜色越深代表该时段专注越多（6:00 - 22:00）
        </p>
      </div>
    </div>
  )
}
