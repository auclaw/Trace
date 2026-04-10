import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import dataService from '../services/dataService'
import type { DailyStat } from '../services/dataService'
import StatisticsOverview from '../components/statistics/StatisticsOverview'
import StatisticsDeepWork from '../components/statistics/StatisticsDeepWork'
import StatisticsAiInsights from '../components/statistics/StatisticsAiInsights'

/* ─── Types ─── */
type Period = 'week' | 'month'
type TabKey = 'overview' | 'deepwork' | 'ai'

const DEEP_CATEGORIES = new Set(['开发', '学习'])

/* ─── Helpers ─── */
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

function fmtHoursLabel(mins: number): string {
  const h = mins / 60
  return h >= 1 ? `${h.toFixed(1)} 小时` : `${Math.round(mins)} 分钟`
}

/* ─── Tab definitions ─── */
const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'overview', icon: '📊' },
  { key: 'deepwork', label: 'deepWork', icon: '🧠' },
  { key: 'ai', label: 'aiInsights', icon: '✨' },
]

/* ══════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════ */

export default function Statistics() {
  const { t } = useTranslation()
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
  const periodLabel = period === 'week' ? t('common.thisWeek') : t('common.thisMonth') || '本月'

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

  // ══════════════════════════════════════════════════
  // DEEP WORK DATA
  // ══════════════════════════════════════════════════

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
      recommendations.push(t('statistics.deepWorkRecLow'))
    } else if (deepScore >= 60) {
      recommendations.push(t('statistics.deepWorkRecHigh'))
    } else {
      recommendations.push(t('statistics.deepWorkRecMedium'))
    }
    const peakHour = hourlyDeep.indexOf(Math.max(...hourlyDeep))
    if (Math.max(...hourlyDeep) > 0) {
      recommendations.push(t('statistics.deepWorkPeakHour', { hour: peakHour }))
    }
    if (totalShort > 10) {
      recommendations.push(t('statistics.deepWorkShortTasks', { count: totalShort }))
    }

    return { days, totalDeep, totalAll, deepScore, hourlyDeep, totalShort, recommendations }
  }, [activities])

  // ══════════════════════════════════════════════════
  // AI INSIGHTS DATA
  // ══════════════════════════════════════════════════

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
    if (topCat) insights.push(t('statistics.aiTopCategory', { category: topCat[0], time: fmtHoursLabel(topCat[1]) }))
    insights.push(t('statistics.aiAvgDaily', { current: fmtHoursLabel(aiAvgDaily), target: fmtHoursLabel(Math.max(aiAvgDaily * 1.1, 480)) }))
    if (bestDay) insights.push(t('statistics.aiBestDay', { day: dayLabel(bestDay.date), time: fmtHoursLabel(bestDay.totalMinutes) }))
    if (leastCat) insights.push(t('statistics.aiLeastCategory', { category: leastCat[0] }))

    return { totalMins, avgDaily: aiAvgDaily, bestDay, worstDay, categories, catEntries, insights, hourlyMinutes, daily }
  }, [activities])

  // ── Export ──
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
    addToast('success', t('statistics.exportSuccess'))
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
    addToast('success', t('statistics.exportSuccess'))
  }

  function dayLabel(dateStr: string): string {
    return `周${(['日', '一', '二', '三', '四', '五', '六'][new Date(dateStr).getDay()])}`
  }

  // ══════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">{t('statistics.title')}</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('statistics.description')}</p>
        </div>
        {/* Period selector */}
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
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
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
            {tab.icon} {t(`statistics.tabs.${tab.key}`)}
          </button>
        ))}
      </div>

      {/* Content by tab */}
      {activeTab === 'overview' && (
        <StatisticsOverview
          period={period}
          data={data}
          totalMinutes={totalMinutes}
          avgDaily={avgDaily}
          activeDays={activeDays}
          mostProductiveDay={mostProductiveDay}
          topCategory={topCategory}
          contextSwitchStats={contextSwitchStats}
          accentColor={accentColor}
          onExportJSON={exportJSON}
          onExportCSV={exportCSV}
        />
      )}

      {activeTab === 'deepwork' && (
        <StatisticsDeepWork
          deepAnalysis={deepAnalysis}
          accentColor={accentColor}
        />
      )}

      {activeTab === 'ai' && (
        <StatisticsAiInsights
          aiAnalysis={aiAnalysis}
          accentColor={accentColor}
        />
      )}
    </div>
  )
}
