import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Button, Badge, EmptyState, Progress } from '../components/ui'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import { CATEGORY_COLORS } from '../config/themes'
import dataService from '../services/dataService'
import type { DailyStat } from '../services/dataService'
import {
  BarChart, Bar as RechartsBar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

// ── Helpers ──

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

function fmtHoursLabel(mins: number): string {
  const h = mins / 60
  return h >= 1 ? `${h.toFixed(1)} 小时` : `${Math.round(mins)} 分钟`
}

function shortDay(dateStr: string): string {
  const d = new Date(dateStr)
  return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
}

function dayLabel(dateStr: string): string {
  return `周${shortDay(dateStr)}`
}

type Period = 'week' | 'month'
type TabKey = 'overview' | 'deepwork' | 'ai'

const DEEP_CATEGORIES = new Set(['开发', '学习'])

// ── Styles ──

const tooltipStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #ffffff 0%, #fef8f0 100%)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  boxShadow: '0 8px 24px rgba(44, 24, 16, 0.12), 0 0 1px rgba(44, 24, 16, 0.08)',
}

const warmCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #ffffff 0%, #fef8f0 100%)',
  borderRadius: 'var(--radius-lg)',
}

const deepCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--color-bg-surface-1) 0%, var(--color-bg-surface-2) 100%)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 2px 12px rgba(44, 24, 16, 0.06), 0 0 1px rgba(44, 24, 16, 0.10)',
}

const aiCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #ffffff 0%, #fef8f0 100%)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
}

// ── Export helpers ──

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── AI category bar ──
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

// ── Tab definitions ──
const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: '概览', icon: '📊' },
  { key: 'deepwork', label: '深度工作', icon: '🧠' },
  { key: 'ai', label: 'AI 洞察', icon: '✨' },
]

// ══════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════

export default function Statistics() {
  const { accentColor } = useTheme()
  const activities = useAppStore((s) => s.activities)
  const loadActivities = useAppStore((s) => s.loadActivities)
  const addToast = useAppStore((s) => s.addToast)

  const [searchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabKey) || 'overview'
  const [activeTab, setActiveTab] = useState<TabKey>(
    ['overview', 'deepwork', 'ai'].includes(initialTab) ? initialTab : 'overview',
  )
  const [period, setPeriod] = useState<Period>('week')

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  // ══════════════════════════════════════════════════
  // OVERVIEW DATA
  // ══════════════════════════════════════════════════

  // PLACEHOLDER: overviewData
  const weeklyData = useMemo(() => dataService.getWeeklyStats(), [activities])

  const monthlyData = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth() + 1
    const daysInMonth = new Date(y, m, 0).getDate()
    const daily: DailyStat[] = []
    const categories: Record<string, number> = {}
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const stats = dataService.getDailyStats(ds)
      daily.push({ date: ds, ...stats })
      for (const [cat, mins] of Object.entries(stats.categories)) {
        categories[cat] = (categories[cat] || 0) + mins
      }
    }
    return { daily, categories }
  }, [activities])

  const data = period === 'week' ? weeklyData : monthlyData
  const periodLabel = period === 'week' ? '本周' : '本月'

  const totalMinutes = useMemo(() => data.daily.reduce((s, d) => s + d.totalMinutes, 0), [data])
  const activeDays = useMemo(() => data.daily.filter((d) => d.totalMinutes > 0), [data])
  const avgDaily = activeDays.length > 0 ? totalMinutes / activeDays.length : 0

  const mostProductiveDay = useMemo(() => {
    if (activeDays.length === 0) return null
    return activeDays.reduce((a, b) => (a.totalMinutes > b.totalMinutes ? a : b))
  }, [activeDays])

  const topCategory = useMemo(() => {
    const entries = Object.entries(data.categories)
    if (entries.length === 0) return null
    entries.sort((a, b) => b[1] - a[1])
    return { name: entries[0][0], minutes: entries[0][1] }
  }, [data])

  // Context switch stats: count category transitions per day
  const contextSwitchStats = useMemo(() => {
    const dates = data.daily.map((d) => d.date)
    let totalSwitches = 0
    let daysWithData = 0
    const dailySwitches: number[] = []

    for (const date of dates) {
      const dayActivities = dataService.getActivities(date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
      if (dayActivities.length < 2) {
        dailySwitches.push(0)
        continue
      }
      daysWithData++
      let switches = 0
      for (let i = 1; i < dayActivities.length; i++) {
        if (dayActivities[i].category !== dayActivities[i - 1].category) switches++
      }
      totalSwitches += switches
      dailySwitches.push(switches)
    }

    const avg = daysWithData > 0 ? totalSwitches / daysWithData : 0

    // Compute trend: compare first half vs second half
    const mid = Math.floor(dailySwitches.length / 2)
    const firstHalf = dailySwitches.slice(0, mid)
    const secondHalf = dailySwitches.slice(mid)
    const avgFirst = firstHalf.length > 0 ? firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length : 0
    const avgSecond = secondHalf.length > 0 ? secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length : 0
    const trend: 'up' | 'down' | 'flat' = avgSecond > avgFirst + 0.5 ? 'up' : avgSecond < avgFirst - 0.5 ? 'down' : 'flat'

    return { avg, total: totalSwitches, trend, dailySwitches }
  }, [data])

  const barData = useMemo(
    () =>
      data.daily.map((d) => ({
        date: d.date,
        label: period === 'week' ? shortDay(d.date) : d.date.slice(8),
        hours: Number((d.totalMinutes / 60).toFixed(2)),
      })),
    [data, period],
  )

  const pieData = useMemo(() => {
    const entries = Object.entries(data.categories)
    entries.sort((a, b) => b[1] - a[1])
    return entries.map(([name, value]) => ({ name, value }))
  }, [data])

  const categoryTable = useMemo(() => {
    const total = totalMinutes || 1
    return Object.entries(data.categories)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, mins]) => ({
        cat,
        mins,
        pct: (mins / total) * 100,
        color: CATEGORY_COLORS[cat] || CATEGORY_COLORS['其他'],
      }))
  }, [data, totalMinutes])

  // ══════════════════════════════════════════════════
  // DEEP WORK DATA
  // ══════════════════════════════════════════════════

  // PLACEHOLDER: deepWorkData
  const deepAnalysis = useMemo(() => {
    const now = new Date()
    const days: { date: string; deepMins: number; totalMins: number; shortCount: number }[] = []
    const hourlyDeep: number[] = new Array(24).fill(0)

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const ds = toDateStr(d)
      const acts = dataService.getActivities(ds)
      let deepMins = 0, totalMins = 0, shortCount = 0
      for (const a of acts) {
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
      recommendations.push(`你的深度工作高峰期在 ${peakHour}:00 左右，建议把最重要的任务安排在这个时段。`)
    }
    if (totalShort > 10) {
      recommendations.push(`本周有 ${totalShort} 次短于 10 分钟的活动插在深度工作之间，频繁切换会降低效率。`)
    }

    return { days, totalDeep, totalAll, deepScore, hourlyDeep, totalShort, recommendations }
  }, [activities])

  // ══════════════════════════════════════════════════
  // AI INSIGHTS DATA
  // ══════════════════════════════════════════════════

  // PLACEHOLDER: aiData
  const aiAnalysis = useMemo(() => {
    const weekStats = dataService.getWeeklyStats()
    const { daily, categories } = weekStats
    if (daily.every((d) => d.totalMinutes === 0)) return null

    const totalMins = daily.reduce((s, d) => s + d.totalMinutes, 0)
    const aiAvgDaily = totalMins / 7
    const nonZeroDays = daily.filter((d) => d.totalMinutes > 0)
    const bestDay = nonZeroDays.reduce((a, b) => (a.totalMinutes >= b.totalMinutes ? a : b), nonZeroDays[0])
    const worstDay = nonZeroDays.reduce((a, b) => (a.totalMinutes <= b.totalMinutes ? a : b), nonZeroDays[0])
    const catEntries = Object.entries(categories).sort((a, b) => b[1] - a[1])
    const topCat = catEntries[0]
    const leastCat = catEntries.length > 1 ? catEntries[catEntries.length - 1] : null

    const now = new Date()
    const startDate = toDateStr(new Date(now.getTime() - 6 * 86400000))
    const endDate = toDateStr(now)
    const allActivities = dataService.getActivitiesRange(startDate, endDate)
    const hourlyMinutes: number[] = new Array(24).fill(0)
    for (const a of allActivities) {
      const hour = parseInt(a.startTime.slice(11, 13), 10)
      if (!isNaN(hour)) hourlyMinutes[hour] += a.duration
    }

    const insights: string[] = []
    if (topCat) insights.push(`本周你在「${topCat[0]}」上投入最多时间（${fmtHoursLabel(topCat[1])}）`)
    insights.push(`你的平均每日专注时间为 ${fmtHoursLabel(aiAvgDaily)}，建议目标为 ${fmtHoursLabel(Math.max(aiAvgDaily * 1.1, 480))}`)
    if (bestDay) insights.push(`${dayLabel(bestDay.date)}是你最高效的一天（${fmtHoursLabel(bestDay.totalMinutes)}）`)
    if (leastCat) insights.push(`建议：增加「${leastCat[0]}」的时间投入`)

    return { totalMins, avgDaily: aiAvgDaily, bestDay, worstDay, categories, catEntries, insights, hourlyMinutes, daily }
  }, [activities])

  // ── Export ──
  const exportJSON = () => {
    const now = new Date()
    const startDate = period === 'week'
      ? (() => { const d = new Date(now); d.setDate(d.getDate() - 6); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const endDate = todayStr()
    const allActs = dataService.getActivitiesRange(startDate, endDate)
    const payload = { period: periodLabel, startDate, endDate, totalMinutes, categories: data.categories, daily: data.daily, activities: allActs }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `merize-${period}-stats-${endDate}.json`)
    addToast('success', 'JSON 导出成功')
  }

  const exportCSV = () => {
    const now = new Date()
    const startDate = period === 'week'
      ? (() => { const d = new Date(now); d.setDate(d.getDate() - 6); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const endDate = todayStr()
    const allActs = dataService.getActivitiesRange(startDate, endDate)
    const headers = ['id', 'name', 'category', 'startTime', 'endTime', 'duration', 'isManual']
    const rows = allActs.map((a) =>
      [a.id, `"${a.name.replace(/"/g, '""')}"`, a.category, a.startTime, a.endTime, a.duration, a.isManual].join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `merize-${period}-stats-${endDate}.csv`)
    addToast('success', 'CSV 导出成功')
  }

  // ── Tooltips ──
  const BarTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={tooltipStyle}>
        <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-0.5">{label}</p>
        <p className="text-sm font-bold" style={{ color: accentColor }}>{payload[0].value} 小时</p>
      </div>
    )
  }

  const PieTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={tooltipStyle}>
        <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-0.5">{payload[0].name}</p>
        <p className="text-sm font-bold" style={{ color: payload[0].payload?.fill || accentColor }}>{fmtDuration(payload[0].value)}</p>
      </div>
    )
  }

  const hasData = totalMinutes > 0

  // ── Deep work derived values ──
  const maxDailyDeep = Math.max(...deepAnalysis.days.map((d) => d.deepMins), 1)
  const maxHourlyDeep = Math.max(...deepAnalysis.hourlyDeep, 1)
  const scoreColor = deepAnalysis.deepScore >= 50 ? 'var(--color-accent)' : '#f59e0b'
  const scorePercent = Math.min(deepAnalysis.deepScore, 100)
  const ringSize = 140
  const ringStroke = 10
  const ringRadius = (ringSize - ringStroke) / 2
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (scorePercent / 100) * ringCircumference

  // ── AI derived values ──
  const aiMaxHourly = aiAnalysis ? Math.max(...aiAnalysis.hourlyMinutes, 1) : 1
  const aiMaxDaily = aiAnalysis ? Math.max(...aiAnalysis.daily.map((d) => d.totalMinutes), 1) : 1

  // ══════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">统计分析</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">全方位数据洞察</p>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div
        className="flex items-center gap-1 p-1"
        style={{
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-bg-surface-2)',
          border: '1px solid var(--color-border-subtle)',
          width: 'fit-content',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="cursor-pointer"
            style={{
              padding: '6px 20px',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-full)',
              border: 'none',
              transition: 'all var(--duration-normal) var(--ease-default)',
              background: activeTab === tab.key ? 'var(--color-accent-soft)' : 'transparent',
              color: activeTab === tab.key ? accentColor : 'var(--color-text-muted)',
              boxShadow: activeTab === tab.key ? 'var(--shadow-xs)' : 'none',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* PLACEHOLDER: tab content sections */}

      {/* ══════════════════════════════════════════════════ */}
      {/* TAB: OVERVIEW */}
      {/* ══════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
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
              {(['week', 'month'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="cursor-pointer"
                  style={{
                    padding: '6px 20px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    transition: 'all var(--duration-normal) var(--ease-default)',
                    background: period === p ? 'var(--color-accent-soft)' : 'transparent',
                    color: period === p ? accentColor : 'var(--color-text-muted)',
                    boxShadow: period === p ? 'var(--shadow-xs)' : 'none',
                  }}
                >
                  {p === 'week' ? '本周' : '本月'}
                </button>
              ))}
            </div>
          </div>

          {!hasData ? (
            <EmptyState icon="📊" title="暂无数据" description={`${periodLabel}还没有记录到任何活动`} />
          ) : (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-5">
                <Card padding="sm" className="text-center" style={warmCardStyle}>
                  <div className="py-5 px-3">
                    <div className="text-lg mb-2">⏱</div>
                    <p className="metric-label mb-2">总时长</p>
                    <p className="metric-value tabular-nums">
                      {fmtHours(totalMinutes)}<span style={{ fontSize: '0.875rem', fontWeight: 400, opacity: 0.6 }}>h</span>
                    </p>
                  </div>
                </Card>
                <Card padding="sm" className="text-center" style={warmCardStyle}>
                  <div className="py-5 px-3">
                    <div className="text-lg mb-2">📈</div>
                    <p className="metric-label mb-2">日均</p>
                    <p className="metric-value tabular-nums">
                      {fmtHours(avgDaily)}<span style={{ fontSize: '0.875rem', fontWeight: 400, opacity: 0.6 }}>h</span>
                    </p>
                  </div>
                </Card>
                <Card padding="sm" className="text-center" style={warmCardStyle}>
                  <div className="py-5 px-3">
                    <div className="text-lg mb-2">🏆</div>
                    <p className="metric-label mb-2">最高产日</p>
                    {mostProductiveDay ? (
                      <div>
                        <p className="text-base font-bold text-[var(--color-text-primary)]">周{shortDay(mostProductiveDay.date)}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{fmtDuration(mostProductiveDay.totalMinutes)}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--color-text-muted)]">-</p>
                    )}
                  </div>
                </Card>
                <Card padding="sm" className="text-center" style={warmCardStyle}>
                  <div className="py-5 px-3">
                    <div className="text-lg mb-2">🎯</div>
                    <p className="metric-label mb-2">Top 分类</p>
                    {topCategory ? (
                      <Badge variant="accent" size="md">{topCategory.name}</Badge>
                    ) : (
                      <p className="text-sm text-[var(--color-text-muted)]">-</p>
                    )}
                  </div>
                </Card>
                <Card padding="sm" className="text-center" style={warmCardStyle}>
                  <div className="py-5 px-3">
                    <div className="text-lg mb-2">🔀</div>
                    <p className="metric-label mb-2">上下文切换</p>
                    <div>
                      <p className="metric-value tabular-nums" style={{
                        color: contextSwitchStats.avg <= 5 ? 'var(--color-success, #22c55e)' : contextSwitchStats.avg <= 10 ? 'var(--color-warning, #f59e0b)' : 'var(--color-error, #ef4444)',
                      }}>
                        {contextSwitchStats.avg.toFixed(1)}<span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.6 }}>/天</span>
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <span style={{
                          fontSize: '0.75rem',
                          color: contextSwitchStats.trend === 'down' ? 'var(--color-success, #22c55e)' : contextSwitchStats.trend === 'up' ? 'var(--color-error, #ef4444)' : 'var(--color-text-muted)',
                        }}>
                          {contextSwitchStats.trend === 'down' ? '↓ 减少' : contextSwitchStats.trend === 'up' ? '↑ 增加' : '→ 持平'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card padding="sm" className="lg:col-span-3" style={warmCardStyle}>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)] px-4 pt-4 pb-5" style={{ letterSpacing: '-0.01em' }}>每日时长</h2>
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
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)] px-4 pt-4 pb-5" style={{ letterSpacing: '-0.01em' }}>分类占比</h2>
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
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)] px-4 pt-4 pb-3" style={{ letterSpacing: '-0.01em' }}>分类明细</h2>
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
                    <span className="text-sm font-bold text-[var(--color-text-primary)] w-16">合计</span>
                    <div className="flex-1" />
                    <span className="text-xs font-bold tabular-nums text-[var(--color-text-primary)] w-14 text-right">{fmtDuration(totalMinutes)}</span>
                    <span className="text-xs tabular-nums text-[var(--color-text-muted)] w-12 text-right">100%</span>
                  </div>
                </div>
              </Card>

              {/* Export Buttons */}
              <Card padding="sm" style={warmCardStyle}>
                <div className="flex flex-wrap items-center gap-3 px-4 py-4">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)] mr-auto">导出数据</span>
                  <Button variant="secondary" size="sm" onClick={exportJSON}>导出 JSON</Button>
                  <Button variant="secondary" size="sm" onClick={exportCSV}>导出 CSV</Button>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* TAB: DEEP WORK */}
      {/* ══════════════════════════════════════════════════ */}
      {activeTab === 'deepwork' && (
        <div className="space-y-8 animate-fade-in">
          {deepAnalysis.totalAll === 0 ? (
            <EmptyState icon="🧠" title="暂无数据" description="继续使用一段时间后，将根据你的开发和学习活动生成深度工作分析。" />
          ) : (
            <>
              {/* Description */}
              <p className="text-sm text-[var(--color-text-muted)]">分析「开发」和「学习」类活动占比与分布</p>

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
                  深度工作占比
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
                  {' '}深度工作{' / '}
                  <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{fmtHoursLabel(deepAnalysis.totalAll)}</span>
                  {' '}总时间
                </p>
              </div>

              {/* Daily Deep Work Bars */}
              <div style={{ ...deepCardStyle, padding: '1.25rem' }}>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">每日深度工作时间</h3>
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
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">时段深度工作热力图</h3>
                <p className="text-xs text-[var(--color-text-muted)] mb-4">过去 7 天各时段深度工作累计时间</p>
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
                          title={`${hour}:00 — ${Math.round(mins)} 分钟`}
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
                    <span className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--color-accent-soft)', fontSize: '1.2rem' }}>⚡</span>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)] mb-1">短活动次数 (&lt;10分钟)</p>
                      <p className="metric-value" style={{ fontSize: '1.75rem' }}>{deepAnalysis.totalShort}</p>
                    </div>
                  </div>
                </div>
                <div style={{ ...deepCardStyle, padding: '1.25rem' }}>
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--color-accent-soft)', fontSize: '1.2rem' }}>📊</span>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)] mb-1">日均短活动</p>
                      <p className="metric-value" style={{ fontSize: '1.75rem' }}>{(deepAnalysis.totalShort / 7).toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] -mt-4 px-1">短于 10 分钟的活动穿插在深度工作之间会打断心流状态</p>

              {/* Recommendations */}
              <div style={{ ...deepCardStyle, padding: '1.25rem' }}>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">改进建议</h3>
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
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* TAB: AI INSIGHTS */}
      {/* ══════════════════════════════════════════════════ */}
      {activeTab === 'ai' && (
        <div className="space-y-7 animate-fade-in">
          {!aiAnalysis ? (
            <EmptyState icon="🤖" title="暂无数据" description="继续使用一段时间后，AI 将根据你的活动数据生成个性化洞察。" />
          ) : (
            <>
              {/* AI Header badge */}
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 4px rgba(249,115,22,0.3))', lineHeight: 1 }}>&#10024;</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2, margin: 0 }}>AI 智能总结</h2>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'var(--color-accent-gradient)', color: '#fff', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.02em', boxShadow: '0 2px 8px rgba(249,115,22,0.25)' }}>AI 生成</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '-12px 0 0 0' }}>基于本周活动数据自动生成效率洞察</p>

              {/* Weekly Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '总时长', value: fmtHoursLabel(aiAnalysis.totalMins), icon: '⏱️' },
                  { label: '日均', value: fmtHoursLabel(aiAnalysis.avgDaily), icon: '📈' },
                  { label: '最高效日', value: aiAnalysis.bestDay ? dayLabel(aiAnalysis.bestDay.date) : '—', icon: '🌟' },
                  { label: '最低效日', value: aiAnalysis.worstDay ? dayLabel(aiAnalysis.worstDay.date) : '—', icon: '💤' },
                ].map((card) => (
                  <div
                    key={card.label}
                    style={{ ...aiCardStyle, padding: '20px 16px', transition: 'box-shadow var(--duration-normal) var(--ease-default), transform var(--duration-normal) var(--ease-default)', cursor: 'default' }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{ fontSize: '1.25rem', marginBottom: '4px', lineHeight: 1 }}>{card.icon}</div>
                    <p className="metric-label" style={{ marginBottom: '6px' }}>{card.label}</p>
                    <p className="metric-value" style={{ margin: 0 }}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Insights */}
              <div style={{ ...aiCardStyle, padding: '24px' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.125rem' }}>💡</span> 洞察与建议
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
                  <span style={{ fontSize: '1.125rem' }}>📊</span> 分类时间分布
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
                  <span style={{ fontSize: '1.125rem' }}>📅</span> 每日趋势
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
                  <span style={{ fontSize: '1.125rem' }}>🔥</span> 时段专注分布
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>过去 7 天各时段累计专注时间</p>
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
                          title={`${hour}:00 — ${Math.round(mins)} 分钟`}
                        />
                        {hour % 3 === 0 && (
                          <span style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{hour}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '12px 0 0 0' }}>颜色越深代表该时段专注越多（6:00 - 22:00）</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
