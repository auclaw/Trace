import { useEffect, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import dataService from '../services/dataService'
import { Card, Badge, EmptyState, Progress } from '../components/ui'

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

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          深度工作分析
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          分析「开发」和「学习」类活动占比与分布
        </p>
      </div>

      {/* ─── Score Card ─── */}
      <Card padding="lg" className="text-center">
        <p className="text-sm text-[var(--color-text-muted)] mb-2">深度工作占比</p>
        <p
          className="text-5xl font-bold mb-2"
          style={{ color: analysis.deepScore >= 50 ? 'var(--color-accent)' : '#f59e0b' }}
        >
          {analysis.deepScore.toFixed(0)}%
        </p>
        <Progress
          value={analysis.deepScore}
          color={analysis.deepScore >= 50 ? 'var(--color-accent)' : '#f59e0b'}
          size="md"
          className="max-w-xs mx-auto mb-2"
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          {fmtHours(analysis.totalDeep)} 深度工作 / {fmtHours(analysis.totalAll)} 总时间
        </p>
      </Card>

      {/* ─── Daily Deep Work Bar Chart ─── */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          每日深度工作时间
        </h3>
        <div className="flex items-end gap-2 h-36">
          {analysis.days.map((d) => {
            const pct = maxDailyDeep > 0 ? (d.deepMins / maxDailyDeep) * 100 : 0
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] tabular-nums text-[var(--color-text-muted)]">
                  {d.deepMins > 0 ? `${(d.deepMins / 60).toFixed(1)}h` : ''}
                </span>
                <div className="w-full flex items-end" style={{ height: '100px' }}>
                  <div
                    className="w-full rounded-t-md transition-[height] duration-500"
                    style={{
                      height: `${Math.max(pct, 2)}%`,
                      backgroundColor: 'var(--color-accent)',
                      opacity: pct > 0 ? 0.8 : 0.1,
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

      {/* ─── Hourly Heatmap ─── */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          时段深度工作热力图
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          过去 7 天各时段深度工作累计时间
        </p>
        <div className="grid grid-cols-12 gap-1.5">
          {analysis.hourlyDeep.slice(6, 23).map((mins, i) => {
            const hour = i + 6
            const intensity = maxHourly > 0 ? mins / maxHourly : 0
            return (
              <div key={hour} className="flex flex-col items-center gap-1">
                <div
                  className="w-full aspect-square rounded-md"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    opacity: Math.max(0.06, intensity * 0.85),
                  }}
                  title={`${hour}:00 — ${Math.round(mins)} 分钟`}
                />
                {hour % 3 === 0 && (
                  <span className="text-[9px] text-[var(--color-text-muted)]">{hour}</span>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* ─── Interruption Analysis ─── */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          碎片化分析
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-0.5">短活动次数 (&lt;10分钟)</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {analysis.totalShort}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-0.5">日均短活动</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {(analysis.totalShort / 7).toFixed(1)}
            </p>
          </div>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          短于 10 分钟的活动穿插在深度工作之间会打断心流状态
        </p>
      </Card>

      {/* ─── Recommendations ─── */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          改进建议
        </h3>
        <ul className="space-y-2">
          {analysis.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
              <Badge variant="accent" size="sm" className="mt-0.5 shrink-0">
                {i + 1}
              </Badge>
              {rec}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
