import { useState, useEffect, useMemo } from 'react'
import { Card, Button, Badge, EmptyState } from '../components/ui'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import { CATEGORY_COLORS } from '../config/themes'
import dataService from '../services/dataService'
import type { DailyStat } from '../services/dataService'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

// ── Helpers ──

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

function shortDay(dateStr: string): string {
  const d = new Date(dateStr)
  return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
}

type Period = 'week' | 'month'

// ── Tooltip styles ──

const tooltipStyle: React.CSSProperties = {
  background: 'var(--color-bg-surface-1)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: '12px',
  padding: '8px 12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
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

// ── Main Component ──

export default function Statistics() {
  const { accentColor } = useTheme()
  const activities = useAppStore((s) => s.activities)
  const loadActivities = useAppStore((s) => s.loadActivities)
  const addToast = useAppStore((s) => s.addToast)

  const [period, setPeriod] = useState<Period>('week')

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  // ── Weekly data ──
  const weeklyData = useMemo(() => dataService.getWeeklyStats(), [activities])

  // ── Monthly data ──
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

  // ── Derived stats ──

  const totalMinutes = useMemo(
    () => data.daily.reduce((s, d) => s + d.totalMinutes, 0),
    [data],
  )

  const activeDays = useMemo(
    () => data.daily.filter((d) => d.totalMinutes > 0),
    [data],
  )

  const avgDaily = activeDays.length > 0 ? totalMinutes / activeDays.length : 0

  const mostProductiveDay = useMemo(() => {
    if (activeDays.length === 0) return null
    const best = activeDays.reduce((a, b) => (a.totalMinutes > b.totalMinutes ? a : b))
    return best
  }, [activeDays])

  const topCategory = useMemo(() => {
    const entries = Object.entries(data.categories)
    if (entries.length === 0) return null
    entries.sort((a, b) => b[1] - a[1])
    return { name: entries[0][0], minutes: entries[0][1] }
  }, [data])

  // ── Chart data ──

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

  // ── Export ──

  const exportJSON = () => {
    const now = new Date()
    const startDate = period === 'week'
      ? (() => { const d = new Date(now); d.setDate(d.getDate() - 6); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const endDate = todayStr()
    const allActs = dataService.getActivitiesRange(startDate, endDate)
    const payload = {
      period: periodLabel,
      startDate,
      endDate,
      totalMinutes,
      categories: data.categories,
      daily: data.daily,
      activities: allActs,
    }
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

  // ── Custom tooltip ──
  const BarTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={tooltipStyle}>
        <p className="text-xs font-medium text-[var(--color-text-primary)]">{label}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{payload[0].value} 小时</p>
      </div>
    )
  }

  const PieTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={tooltipStyle}>
        <p className="text-xs font-medium text-[var(--color-text-primary)]">{payload[0].name}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{fmtDuration(payload[0].value)}</p>
      </div>
    )
  }

  // ── No data state ──

  const hasData = totalMinutes > 0

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header + period tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">统计分析</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{periodLabel}数据概览</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-bg-surface-2)]">
          {(['week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={[
                'px-4 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer',
                period === p
                  ? 'bg-[var(--color-bg-surface-1)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
              ].join(' ')}
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
          {/* ── Overview Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card padding="sm" className="text-center py-4">
              <p className="text-[11px] text-[var(--color-text-muted)] mb-1">总时长</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">
                {fmtHours(totalMinutes)}<span className="text-xs font-normal text-[var(--color-text-muted)] ml-0.5">h</span>
              </p>
            </Card>
            <Card padding="sm" className="text-center py-4">
              <p className="text-[11px] text-[var(--color-text-muted)] mb-1">日均</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">
                {fmtHours(avgDaily)}<span className="text-xs font-normal text-[var(--color-text-muted)] ml-0.5">h</span>
              </p>
            </Card>
            <Card padding="sm" className="text-center py-4">
              <p className="text-[11px] text-[var(--color-text-muted)] mb-1">最高产日</p>
              {mostProductiveDay ? (
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  周{shortDay(mostProductiveDay.date)}{' '}
                  <span className="text-xs font-normal text-[var(--color-text-muted)]">
                    {fmtDuration(mostProductiveDay.totalMinutes)}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">-</p>
              )}
            </Card>
            <Card padding="sm" className="text-center py-4">
              <p className="text-[11px] text-[var(--color-text-muted)] mb-1">Top 分类</p>
              {topCategory ? (
                <Badge variant="accent" size="md">{topCategory.name}</Badge>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">-</p>
              )}
            </Card>
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Bar chart */}
            <Card padding="sm" className="lg:col-span-3">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] px-2 pt-2 pb-4">
                每日时长
              </h2>
              <div className="h-64 px-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" strokeOpacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                      width={32}
                      tickFormatter={(v) => `${v}h`}
                    />
                    <Tooltip content={<BarTooltipContent />} cursor={{ fill: 'var(--color-accent-soft)', opacity: 0.3 }} />
                    <Bar dataKey="hours" radius={[6, 6, 0, 0]} fill={accentColor} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Pie chart */}
            <Card padding="sm" className="lg:col-span-2">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] px-2 pt-2 pb-4">
                分类占比
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS['其他']} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltipContent />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-[11px] text-[var(--color-text-secondary)]">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ── Category Table ── */}
          <Card padding="sm">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] px-2 pt-2 pb-3">
              分类明细
            </h2>
            <div className="divide-y divide-[var(--color-border-subtle)]/30">
              {categoryTable.map(({ cat, mins, pct, color }) => (
                <div key={cat} className="flex items-center gap-3 px-2 py-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
                  <span className="text-sm font-medium text-[var(--color-text-primary)] w-16">{cat}</span>
                  <div className="flex-1">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 2)}%`, background: color, opacity: 0.7 }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-[var(--color-text-muted)] w-14 text-right">
                    {fmtDuration(mins)}
                  </span>
                  <span className="text-xs tabular-nums text-[var(--color-text-muted)] w-12 text-right">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              ))}
              {/* Total row */}
              <div className="flex items-center gap-3 px-2 py-2.5">
                <span className="w-2.5 h-2.5" />
                <span className="text-sm font-bold text-[var(--color-text-primary)] w-16">合计</span>
                <div className="flex-1" />
                <span className="text-xs font-bold tabular-nums text-[var(--color-text-primary)] w-14 text-right">
                  {fmtDuration(totalMinutes)}
                </span>
                <span className="text-xs tabular-nums text-[var(--color-text-muted)] w-12 text-right">
                  100%
                </span>
              </div>
            </div>
          </Card>

          {/* ── Export Buttons ── */}
          <Card padding="sm" className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="text-sm font-medium text-[var(--color-text-primary)] mr-auto">导出数据</span>
            <Button variant="secondary" size="sm" onClick={exportJSON}>
              导出 JSON
            </Button>
            <Button variant="secondary" size="sm" onClick={exportCSV}>
              导出 CSV
            </Button>
          </Card>
        </>
      )}
    </div>
  )
}
