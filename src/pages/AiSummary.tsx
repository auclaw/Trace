import { useEffect, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import dataService from '../services/dataService'
import { Card, Badge, EmptyState } from '../components/ui'
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

/* ── simple bar component ── */
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-3 flex-1 rounded-full overflow-hidden bg-[var(--color-border-subtle)]/25">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

/* ══════════════════════════════════════════════════
   AI Summary Page
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
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
          AI 智能总结
        </h2>
        <EmptyState
          icon="🤖"
          title="暂无数据"
          description="继续使用一段时间后，AI 将根据你的活动数据生成个性化洞察。"
        />
      </div>
    )
  }

  const maxHourly = Math.max(...analysis.hourlyMinutes, 1)
  const maxDaily = Math.max(...analysis.daily.map((d) => d.totalMinutes), 1)

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          AI 智能总结
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          基于本周活动数据自动生成效率洞察
        </p>
      </div>

      {/* ─── Weekly Overview ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-xs text-[var(--color-text-muted)] mb-0.5">总时长</p>
          <p className="text-xl font-bold text-[var(--color-text-primary)]">
            {fmtHours(analysis.totalMins)}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-[var(--color-text-muted)] mb-0.5">日均</p>
          <p className="text-xl font-bold text-[var(--color-text-primary)]">
            {fmtHours(analysis.avgDaily)}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-[var(--color-text-muted)] mb-0.5">最高效日</p>
          <p className="text-xl font-bold text-[var(--color-accent)]">
            {analysis.bestDay ? dayLabel(analysis.bestDay.date) : '—'}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-[var(--color-text-muted)] mb-0.5">最低效日</p>
          <p className="text-xl font-bold text-[var(--color-text-secondary)]">
            {analysis.worstDay ? dayLabel(analysis.worstDay.date) : '—'}
          </p>
        </Card>
      </div>

      {/* ─── Insights ─── */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          洞察与建议
        </h3>
        <ul className="space-y-2">
          {analysis.insights.map((text, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
              <Badge variant="accent" size="sm" className="mt-0.5 shrink-0">
                {i + 1}
              </Badge>
              {text}
            </li>
          ))}
        </ul>
      </Card>

      {/* ─── Category Breakdown ─── */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          分类时间分布
        </h3>
        <div className="space-y-2">
          {analysis.catEntries.map(([cat, mins]) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-xs text-[var(--color-text-secondary)] w-12 shrink-0 text-right">
                {cat}
              </span>
              <Bar
                value={mins}
                max={analysis.catEntries[0][1]}
                color={CATEGORY_COLORS[cat] || '#94a3b8'}
              />
              <span className="text-xs tabular-nums text-[var(--color-text-muted)] w-16 shrink-0">
                {fmtHours(mins)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ─── Daily Trend ─── */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          每日趋势
        </h3>
        <div className="flex items-end gap-2 h-32">
          {analysis.daily.map((d) => {
            const pct = maxDaily > 0 ? (d.totalMinutes / maxDaily) * 100 : 0
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] tabular-nums text-[var(--color-text-muted)]">
                  {d.totalMinutes > 0 ? `${Math.round(d.totalMinutes / 60)}h` : ''}
                </span>
                <div className="w-full flex items-end" style={{ height: '80px' }}>
                  <div
                    className="w-full rounded-t-md transition-[height] duration-500"
                    style={{
                      height: `${Math.max(pct, 2)}%`,
                      backgroundColor: 'var(--color-accent)',
                      opacity: pct > 0 ? 0.8 : 0.15,
                    }}
                  />
                </div>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {dayLabel(d.date).slice(1)}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ─── Hourly Focus Pattern ─── */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          时段专注分布
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          过去 7 天各时段累计专注时间
        </p>
        <div className="grid grid-cols-12 gap-1">
          {analysis.hourlyMinutes.slice(6, 23).map((mins, i) => {
            const hour = i + 6
            const intensity = maxHourly > 0 ? mins / maxHourly : 0
            return (
              <div key={hour} className="flex flex-col items-center gap-1">
                <div
                  className="w-full aspect-square rounded-md transition-colors"
                  style={{
                    backgroundColor: `var(--color-accent)`,
                    opacity: Math.max(0.08, intensity * 0.9),
                  }}
                  title={`${hour}:00 — ${Math.round(mins)} 分钟`}
                />
                {hour % 3 === 0 && (
                  <span className="text-[9px] text-[var(--color-text-muted)]">
                    {hour}
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          颜色越深代表该时段专注越多（6:00 - 22:00）
        </p>
      </Card>
    </div>
  )
}
