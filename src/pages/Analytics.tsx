import { useState, useEffect, useMemo } from 'react'
import { Clock, Calendar, TrendingUp, PieChart, Sparkles, Download, BarChart3 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import EmptyState from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'

const CATEGORY_COLORS: Record<string, string> = {
  work: 'var(--color-blue)',
  meeting: 'var(--color-purple)',
  break: 'var(--color-green)',
  learning: 'var(--color-lemon)',
  other: 'var(--color-text-muted)',
}

// Simple SVG Pie Chart component
function SimplePieChart({ data, colors }: { data: [string, number][]; colors: Record<string, string> }) {
  const total = data.reduce((sum, [, v]) => sum + v, 0)
  if (total === 0) return null

  const radius = 60
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <g transform="translate(80, 80)">
        {data.map(([category, minutes]) => {
          const pct = minutes / total
          const dash = pct * circumference
          const segment = (
            <circle
              key={category}
              r={radius}
              fill="none"
              stroke={colors[category] || 'var(--color-text-muted)'}
              strokeWidth={radius * 0.8}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90)"
            />
          )
          offset += dash
          return segment
        })}
      </g>
    </svg>
  )
}

// 7-day trend bar chart
function TrendBarChart({ daily }: { daily: Record<string, number> }) {
  const sortedDays = Object.entries(daily).sort(([a], [b]) => a.localeCompare(b))
  if (sortedDays.length === 0) return null

  const maxMinutes = Math.max(...sortedDays.map(([, m]) => m), 1)

  return (
    <div className="flex items-end gap-3 h-40">
      {sortedDays.map(([day, minutes]) => {
        const pct = (minutes / maxMinutes) * 100
        const date = new Date(day)
        const label = `${date.getMonth() + 1}/${date.getDate()}`
        return (
          <div key={day} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              {Math.floor(minutes / 60)}h
            </div>
            <div
              className="w-full rounded-t-lg transition-all duration-500"
              style={{
                height: `${Math.max(pct, 4)}%`,
                background: minutes > 0 ? 'var(--color-blue)' : 'var(--color-bg-surface-3)',
                minHeight: minutes > 0 ? '4px' : '4px',
              }}
            />
            <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Analytics() {
  const activities = useAppStore((s) => s.activities)
  const loadActivities = useAppStore((s) => s.loadActivities)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const { toast } = useToast()

  useEffect(() => {
    loadActivities().finally(() => setLoading(false))
  }, [loadActivities])

  // Calculate period statistics
  const periodStats = useMemo(() => {
    const now = new Date()
    const daysBack = period === 'week' ? 7 : 30
    const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
    const cutoffStr = cutoff.toISOString().slice(0, 10)

    const periodActivities = activities.filter((a) => a.startTime.slice(0, 10) >= cutoffStr)
    const totalMinutes = periodActivities.reduce((sum, a) => sum + (a.duration || 0), 0)

    // Category breakdown
    const categories: Record<string, number> = {}
    periodActivities.forEach((a) => {
      categories[a.category] = (categories[a.category] || 0) + (a.duration || 0)
    })

    // Daily breakdown
    const daily: Record<string, number> = {}
    periodActivities.forEach((a) => {
      const day = a.startTime.slice(0, 10)
      daily[day] = (daily[day] || 0) + (a.duration || 0)
    })

    // Fill empty days for 7-day trend
    const filledDaily: Record<string, number> = {}
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dStr = d.toISOString().slice(0, 10)
      filledDaily[dStr] = daily[dStr] || 0
    }

    const activeDays = Object.keys(daily).filter((d) => daily[d] > 0).length
    const avgDaily = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0

    return { totalMinutes, categories, daily: filledDaily, activeDays, avgDaily, periodActivities }
  }, [activities, period])

  // Export functions
  const exportJSON = () => {
    const data = {
      period,
      generatedAt: new Date().toISOString(),
      stats: periodStats,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trace-analytics-${period}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('数据导出成功', 'success')
  }

  const exportCSV = () => {
    const rows = [
      ['Date', 'Category', 'Title', 'Duration (minutes)', 'Start Time'],
      ...periodStats.periodActivities.map((a: any) => [
        a.startTime.slice(0, 10),
        a.category,
        a.title || '',
        String(a.duration || 0),
        a.startTime,
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trace-analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('CSV导出成功', 'success')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-base)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading...</span>
        </div>
      </div>
    )
  }

  const sortedCategories = Object.entries(periodStats.categories).sort((a, b) => b[1] - a[1])

  return (
    <div className="min-h-screen px-8 py-8" style={{ background: 'var(--color-bg-base)' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}>
            Analytics
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Buttons */}
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: 'var(--color-bg-surface-1)', border: '2px solid var(--color-border-strong)', color: 'var(--color-text-secondary)' }}
          >
            <Download size={14} />
            JSON
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: 'var(--color-bg-surface-1)', border: '2px solid var(--color-border-strong)', color: 'var(--color-text-secondary)' }}
          >
            <Download size={14} />
            CSV
          </button>

          {/* Period Selector */}
          <div className="flex gap-2 ml-2">
            {(['week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
                style={{
                  background: period === p ? 'var(--color-blue)' : 'var(--color-bg-surface-1)',
                  color: period === p ? 'white' : 'var(--color-text-secondary)',
                  border: period === p ? '2px solid var(--color-blue-hover)' : '2px solid var(--color-border-strong)',
                  boxShadow: period === p ? '3px 3px 0px rgba(121, 190, 235, 0.4)' : '3px 3px 0px var(--color-border-strong)',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {periodStats.totalMinutes === 0 ? (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--color-bg-surface-1)',
            border: '2px solid var(--color-border-strong)',
            boxShadow: '4px 4px 0px var(--color-border-strong)',
          }}
        >
          <EmptyState
            icon="📊"
            title="暂无活动数据"
            description="开始追踪您的活动后，这里会显示您的时间分配统计和趋势分析。"
          />
        </div>
      ) : (
        <>
      {/* Stats Row - 4 Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Time */}
        <div
          className="p-5 rounded-2xl"
          style={{
            background: 'var(--color-blue)',
            border: '2px solid var(--color-blue-hover)',
            boxShadow: '4px 4px 0px rgba(121, 190, 235, 0.4)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} style={{ color: '#2A4A5E' }} />
            <span className="text-xs font-semibold" style={{ color: '#2A4A5E' }}>
              Total Time
            </span>
          </div>
          <div className="text-2xl font-bold" style={{ color: '#2A4A5E', fontFamily: 'Quicksand, sans-serif' }}>
            {Math.floor(periodStats.totalMinutes / 60)}h {periodStats.totalMinutes % 60}m
          </div>
        </div>

        {/* Active Days */}
        <div
          className="p-5 rounded-2xl"
          style={{
            background: 'var(--color-green)',
            border: '2px solid var(--color-green-hover)',
            boxShadow: '4px 4px 0px rgba(168, 230, 207, 0.4)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} style={{ color: '#2D5A4A' }} />
            <span className="text-xs font-semibold" style={{ color: '#2D5A4A' }}>
              Active Days
            </span>
          </div>
          <div className="text-2xl font-bold" style={{ color: '#2D5A4A', fontFamily: 'Quicksand, sans-serif' }}>
            {periodStats.activeDays} days
          </div>
        </div>

        {/* Average Daily */}
        <div
          className="p-5 rounded-2xl"
          style={{
            background: 'var(--color-purple)',
            border: '2px solid #B8A0E8',
            boxShadow: '4px 4px 0px rgba(212, 196, 251, 0.4)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} style={{ color: '#4A3A6A' }} />
            <span className="text-xs font-semibold" style={{ color: '#4A3A6A' }}>
              Avg Daily
            </span>
          </div>
          <div className="text-2xl font-bold" style={{ color: '#4A3A6A', fontFamily: 'Quicksand, sans-serif' }}>
            {Math.floor(periodStats.avgDaily / 60)}h {periodStats.avgDaily % 60}m
          </div>
        </div>

        {/* Categories */}
        <div
          className="p-5 rounded-2xl"
          style={{
            background: 'var(--color-bg-surface-1)',
            border: '2px solid var(--color-border-strong)',
            boxShadow: '4px 4px 0px var(--color-border-strong)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <PieChart size={16} color="var(--color-text-secondary)" />
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Categories
            </span>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}>
            {Object.keys(periodStats.categories).length}
          </div>
        </div>
      </div>

      {/* Charts Row - Pie + Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Pie Chart */}
        <div
          className="p-6 rounded-2xl"
          style={{
            background: 'var(--color-bg-surface-1)',
            border: '2px solid var(--color-border-strong)',
            boxShadow: '4px 4px 0px var(--color-border-strong)',
          }}
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}>
            <PieChart size={16} className="inline mr-2" style={{ color: '#9876D8' }} />
            Category Distribution
          </h3>
          {sortedCategories.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
              No data available
            </p>
          ) : (
            <div className="flex items-center gap-6">
              <SimplePieChart data={sortedCategories} colors={CATEGORY_COLORS} />
              <div className="space-y-2 flex-1">
                {sortedCategories.map(([category, minutes]) => {
                  const percentage = periodStats.totalMinutes > 0 ? Math.round((minutes / periodStats.totalMinutes) * 100) : 0
                  return (
                    <div key={category} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: CATEGORY_COLORS[category] || 'var(--color-text-muted)' }} />
                      <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{category}</span>
                      <span className="text-xs ml-auto" style={{ color: 'var(--color-text-muted)' }}>{percentage}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 7-Day Trend Bar Chart */}
        <div
          className="p-6 rounded-2xl"
          style={{
            background: 'var(--color-bg-surface-1)',
            border: '2px solid var(--color-border-strong)',
            boxShadow: '4px 4px 0px var(--color-border-strong)',
          }}
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}>
            <BarChart3 size={16} className="inline mr-2" style={{ color: 'var(--color-blue)' }} />
            {period === 'week' ? '7-Day Trend' : '30-Day Trend'}
          </h3>
          <TrendBarChart daily={periodStats.daily} />
        </div>
      </div>

      {/* Category Breakdown Section (bar version) */}
      <div
        className="p-6 rounded-2xl mb-6"
        style={{
          background: 'var(--color-bg-surface-1)',
          border: '2px solid var(--color-border-strong)',
          boxShadow: '4px 4px 0px var(--color-border-strong)',
        }}
      >
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}>
          Category Breakdown
        </h3>
        <div className="space-y-3">
          {sortedCategories.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
              No activity data for this period
            </p>
          ) : (
            sortedCategories.map(([category, minutes]) => {
              const percentage = periodStats.totalMinutes > 0 ? Math.round((minutes / periodStats.totalMinutes) * 100) : 0
              return (
                <div key={category} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: CATEGORY_COLORS[category] || 'var(--color-text-muted)' }}
                  />
                  <span className="text-sm font-medium w-20" style={{ color: 'var(--color-text-primary)' }}>
                    {category}
                  </span>
                  <div className="flex-1 h-3 rounded-full" style={{ background: 'var(--color-bg-surface-3)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        background: CATEGORY_COLORS[category] || 'var(--color-text-muted)',
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-16 text-right" style={{ color: 'var(--color-text-secondary)' }}>
                    {percentage}%
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* AI Insights Section */}
      <div
        className="p-6 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(212, 196, 251, 0.2) 0%, rgba(121, 190, 235, 0.2) 100%)',
          border: '2px solid var(--color-border-strong)',
          boxShadow: '4px 4px 0px var(--color-border-strong)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} style={{ color: '#9876D8' }} />
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}>
            AI Insights
          </h3>
        </div>
        <div className="space-y-3">
          {sortedCategories.length > 0 && (
            <div
              className="p-4 rounded-xl"
              style={{ background: 'var(--color-bg-surface-1)', border: '1px solid var(--color-border-light)' }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                🎯 Most Time Spent
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                You spent most of your time on <span className="font-semibold" style={{ color: CATEGORY_COLORS[sortedCategories[0][0]] || 'var(--color-text-muted)' }}>{sortedCategories[0][0]}</span> this {period}.
              </p>
            </div>
          )}
          {periodStats.activeDays > 0 && (
            <div
              className="p-4 rounded-xl"
              style={{ background: 'var(--color-bg-surface-1)', border: '1px solid var(--color-border-light)' }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                📈 Consistency Score
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                You were active for {periodStats.activeDays} out of {period === 'week' ? 7 : 30} days. Great consistency!
              </p>
            </div>
          )}
          {periodStats.avgDaily > 0 && (
            <div
              className="p-4 rounded-xl"
              style={{ background: 'var(--color-bg-surface-1)', border: '1px solid var(--color-border-light)' }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                ⏱️ Daily Rhythm
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Your average daily focus time is {Math.floor(periodStats.avgDaily / 60)}h {periodStats.avgDaily % 60}m.
              </p>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  )
}
