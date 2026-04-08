import { useState, useEffect, useMemo, useCallback } from 'react'
import { Modal, Button, Badge, EmptyState, Input } from '../components/ui'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import { CATEGORY_COLORS } from '../config/themes'
import dataService from '../services/dataService'
import type { ActivityCategory, TimeBlock } from '../services/dataService'

// ── Helpers ──

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function dateStr(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  if (h > 0 && m > 0) return `${h}小时${m}分`
  if (h > 0) return `${h}小时`
  return `${m}分钟`
}

function extractTime(isoStr: string): string {
  // "2026-04-08T09:00:00" -> "09:00"
  const t = isoStr.split('T')[1]
  return t ? t.slice(0, 5) : ''
}

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']
const CATEGORIES = Object.keys(CATEGORY_COLORS) as ActivityCategory[]

// ── Heatmap intensity ──

function getHeatmapStyle(minutes: number): React.CSSProperties {
  if (minutes <= 0) return { backgroundColor: 'var(--color-bg-surface-2)' }
  // Map minutes to opacity: 1-60 -> 0.2, 60-180 -> 0.4, 180-360 -> 0.65, 360+ -> 0.9
  let opacity = 0.15
  if (minutes > 0 && minutes < 60) opacity = 0.2
  else if (minutes < 180) opacity = 0.4
  else if (minutes < 360) opacity = 0.65
  else opacity = 0.9
  return {
    backgroundColor: `color-mix(in srgb, var(--color-accent) ${Math.round(opacity * 100)}%, var(--color-bg-surface-2))`,
  }
}

// ── Keyframe styles injected once ──

const calendarKeyframes = `
@keyframes calendarCellFadeIn {
  from { opacity: 0; transform: translateY(6px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes calendarSlideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`

let keyframesInjected = false
function ensureKeyframes() {
  if (keyframesInjected) return
  keyframesInjected = true
  const style = document.createElement('style')
  style.textContent = calendarKeyframes
  document.head.appendChild(style)
}

// ── Main Component ──

export default function Calendar() {
  const { accentColor: _ } = useTheme()
  void _

  useEffect(() => { ensureKeyframes() }, [])

  const activities = useAppStore((s) => s.activities)
  const loadActivities = useAppStore((s) => s.loadActivities)
  const addActivity = useAppStore((s) => s.addActivity)

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1) // 1-indexed
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [heatmap, setHeatmap] = useState<Record<string, number>>({})
  const [dayTimeBlocks, setDayTimeBlocks] = useState<TimeBlock[]>([])

  // Add activity modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState<ActivityCategory>('工作')
  const [formStartTime, setFormStartTime] = useState('09:00')
  const [formEndTime, setFormEndTime] = useState('10:00')

  // Load heatmap when month changes
  useEffect(() => {
    const data = dataService.getMonthlyHeatmap(year, month)
    setHeatmap(data)
  }, [year, month])

  // Load activities + time blocks when selected date changes
  useEffect(() => {
    loadActivities(selectedDate)
    setDayTimeBlocks(dataService.getTimeBlocks(selectedDate))
  }, [selectedDate, loadActivities])

  // Calendar grid data
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const daysInMonth = new Date(year, month, 0).getDate()
    // JS getDay: 0=Sun, we want Mon=0
    let startWeekday = firstDay.getDay() - 1
    if (startWeekday < 0) startWeekday = 6

    const cells: (number | null)[] = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }, [year, month])

  const todayDate = todayStr()

  // Navigation
  const prevMonth = useCallback(() => {
    if (month === 1) {
      setMonth(12)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }, [month])

  const nextMonth = useCallback(() => {
    if (month === 12) {
      setMonth(1)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }, [month])

  const goToday = useCallback(() => {
    const t = new Date()
    setYear(t.getFullYear())
    setMonth(t.getMonth() + 1)
    setSelectedDate(todayStr())
  }, [])

  // Computed duration for add modal
  const computedDuration = useMemo(() => {
    const [sh, sm] = formStartTime.split(':').map(Number)
    const [eh, em] = formEndTime.split(':').map(Number)
    const startMins = (sh || 0) * 60 + (sm || 0)
    const endMins = (eh || 0) * 60 + (em || 0)
    return Math.max(0, endMins - startMins)
  }, [formStartTime, formEndTime])

  // Save activity
  const handleSaveActivity = () => {
    const name = formName.trim()
    if (!name || computedDuration <= 0) return

    const startTime = `${selectedDate}T${formStartTime}:00`
    const endTime = `${selectedDate}T${formEndTime}:00`

    addActivity({
      name,
      category: formCategory,
      startTime,
      endTime,
      duration: computedDuration,
      isManual: true,
    })

    // Refresh heatmap
    setHeatmap(dataService.getMonthlyHeatmap(year, month))
    setShowAddModal(false)
  }

  const openAddModal = () => {
    setFormName('')
    setFormCategory('工作')
    const now = new Date()
    const h = pad2(now.getHours())
    const m = pad2(Math.floor(now.getMinutes() / 15) * 15)
    setFormStartTime(`${h}:${m}`)
    const endH = pad2(Math.min(23, now.getHours() + 1))
    setFormEndTime(`${endH}:${m}`)
    setShowAddModal(true)
  }

  // Selected day stats
  const dayTotalMinutes = activities.reduce((s, a) => s + a.duration, 0)

  // Sort activities by start time
  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [activities]
  )

  // Parse selected date for display
  const selectedDateObj = new Date(selectedDate + 'T00:00:00')
  const selectedDateLabel = selectedDateObj.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-2)] transition-all duration-200 cursor-pointer"
            style={{ boxShadow: 'inset 0 0 0 1px var(--color-border-subtle)' }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10 4l-4 4 4 4" />
            </svg>
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)] tabular-nums min-w-[9rem] text-center select-none">
            {year}年{month}月
          </h1>
          <button
            onClick={nextMonth}
            className="w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-2)] transition-all duration-200 cursor-pointer"
            style={{ boxShadow: 'inset 0 0 0 1px var(--color-border-subtle)' }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
        </div>
        <Button variant="secondary" size="sm" onClick={goToday}>
          今天
        </Button>
      </div>
      {/* Calendar Grid */}
      <div
        className="mb-8 rounded-[var(--radius-xl)] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--color-bg-surface-1), var(--color-bg-surface-2))',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--color-border-subtle)',
          padding: '1.25rem',
        }}
      >
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-[10px] font-semibold uppercase tracking-widest py-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />
            }

            const ds = dateStr(year, month, day)
            const mins = heatmap[ds] || 0
            const isToday = ds === todayDate
            const isSelected = ds === selectedDate
            const hasDot = mins > 0

            const cellStyle: React.CSSProperties = {
              ...getHeatmapStyle(mins),
              animation: `calendarCellFadeIn 0.3s ease both`,
              animationDelay: `${idx * 18}ms`,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }

            if (isToday && !isSelected) {
              cellStyle.background = 'linear-gradient(135deg, var(--color-accent-soft), transparent)'
              cellStyle.boxShadow = 'inset 0 0 0 2px var(--color-accent)'
            }

            if (isSelected) {
              cellStyle.boxShadow = `0 0 0 2.5px var(--color-accent), 0 4px 12px rgba(44, 24, 16, 0.12)`
              cellStyle.background = 'var(--color-accent-soft)'
            }

            return (
              <button
                key={ds}
                type="button"
                onClick={() => setSelectedDate(ds)}
                title={mins > 0 ? formatMinutes(mins) : '无活动'}
                className="aspect-square rounded-[var(--radius-md)] flex flex-col items-center justify-center relative text-sm cursor-pointer hover:scale-[1.08] hover:z-10"
                style={cellStyle}
              >
                <span
                  style={{
                    fontWeight: isSelected || isToday ? 700 : 500,
                    color: isSelected
                      ? 'var(--color-accent)'
                      : isToday
                        ? 'var(--color-accent)'
                        : mins > 0
                          ? 'var(--color-text-primary)'
                          : 'var(--color-text-muted)',
                    fontSize: isToday ? '0.9375rem' : undefined,
                  }}
                >
                  {day}
                </span>
                {hasDot && !isSelected && (
                  <span
                    className="absolute bottom-1.5 w-1 h-1 rounded-full"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  />
                )}
                {isToday && (
                  <span
                    className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-accent)', boxShadow: '0 0 4px var(--color-accent)' }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div
          className="flex items-center justify-end gap-2 mt-4 pt-3"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>少</span>
          <div className="flex gap-0.5">
            {[0, 30, 120, 300, 480].map((m) => (
              <div
                key={m}
                className="w-3 h-3 rounded-sm"
                style={{ ...getHeatmapStyle(m), transition: 'transform 0.15s ease' }}
              />
            ))}
          </div>
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>多</span>
        </div>
      </div>
      {/* Selected Day Detail Panel */}
      <div
        className="rounded-[var(--radius-xl)] overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, var(--color-bg-surface-1), var(--color-bg-surface-2))',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--color-border-subtle)',
          padding: '1.5rem',
          animation: 'calendarSlideUp 0.35s ease both',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              className="text-base font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {selectedDateLabel}
            </h2>
            <span
              className="text-xs mt-0.5 inline-block"
              style={{ color: 'var(--color-text-muted)' }}
            >
              共 {formatMinutes(dayTotalMinutes)}
            </span>
          </div>
          <Button size="sm" onClick={openAddModal}>
            添加活动
          </Button>
        </div>

        {/* Activity Timeline */}
        {sortedActivities.length === 0 && dayTimeBlocks.length === 0 ? (
          <EmptyState
            icon="📅"
            title="当日无活动"
            description="点击上方按钮添加活动记录"
            action={<Button size="sm" onClick={openAddModal}>添加活动</Button>}
          />
        ) : (
          <div className="space-y-6">
            {/* Activities */}
            {sortedActivities.length > 0 && (
              <div>
                <h3
                  className="text-[10px] font-bold uppercase tracking-[0.1em] mb-3"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  活动记录
                </h3>
                <div className="space-y-1">
                  {sortedActivities.map((act, i) => {
                    const color = CATEGORY_COLORS[act.category] || CATEGORY_COLORS['其他']
                    return (
                      <div
                        key={act.id}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-[var(--radius-md)] transition-all duration-200 cursor-default"
                        style={{
                          animation: `calendarSlideUp 0.3s ease both`,
                          animationDelay: `${i * 50}ms`,
                          borderLeft: `3px solid ${color}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-surface-2)'
                          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
                          e.currentTarget.style.transform = 'translateX(2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.boxShadow = 'none'
                          e.currentTarget.style.transform = 'translateX(0)'
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-medium truncate"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {act.name}
                            </span>
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold leading-none flex-shrink-0"
                              style={{
                                backgroundColor: `${color}20`,
                                color,
                                border: `1px solid ${color}30`,
                              }}
                            >
                              {act.category}
                            </span>
                          </div>
                          <span
                            className="text-xs tabular-nums mt-0.5 inline-block"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {extractTime(act.startTime)} - {extractTime(act.endTime)} ({formatMinutes(act.duration)})
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Time Blocks */}
            {dayTimeBlocks.length > 0 && (
              <div>
                <h3
                  className="text-[10px] font-bold uppercase tracking-[0.1em] mb-3"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  时间块计划
                </h3>
                <div className="space-y-1">
                  {dayTimeBlocks.map((block, i) => {
                    const color = CATEGORY_COLORS[block.category] || CATEGORY_COLORS['其他']
                    return (
                      <div
                        key={block.id}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-[var(--radius-md)] transition-all duration-200"
                        style={{
                          opacity: block.completed ? 0.6 : 1,
                          borderLeft: `3px solid ${color}`,
                          animation: `calendarSlideUp 0.3s ease both`,
                          animationDelay: `${i * 50}ms`,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={[
                                'text-sm font-medium truncate',
                                block.completed ? 'line-through' : '',
                              ].join(' ')}
                              style={{
                                color: block.completed
                                  ? 'var(--color-text-muted)'
                                  : 'var(--color-text-primary)',
                              }}
                            >
                              {block.title}
                            </span>
                            {block.completed && (
                              <Badge variant="success" size="sm">已完成</Badge>
                            )}
                          </div>
                          <span
                            className="text-xs tabular-nums mt-0.5 inline-block"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {extractTime(block.startTime)} - {extractTime(block.endTime)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Add Activity Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="添加活动"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleSaveActivity}
              disabled={!formName.trim() || computedDuration <= 0}
            >
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Name */}
          <Input
            label="活动名称"
            value={formName}
            onChange={setFormName}
            placeholder="例如：前端开发"
          />

          {/* Category */}
          <div>
            <label
              className="block text-[10px] font-semibold uppercase tracking-wider mb-2.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              分类
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const color = CATEGORY_COLORS[cat]
                const isActive = formCategory === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormCategory(cat)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer"
                    style={{
                      backgroundColor: `${color}${isActive ? '30' : '12'}`,
                      color,
                      boxShadow: isActive
                        ? `0 0 0 1.5px ${color}, 0 2px 8px rgba(44, 24, 16, 0.08)`
                        : '0 0 0 1px transparent',
                      transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      opacity: isActive ? 1 : 0.75,
                    }}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                开始时间
              </label>
              <input
                type="time"
                value={formStartTime}
                onChange={(e) => setFormStartTime(e.target.value)}
                className="w-full px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-surface-2)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 1px 3px rgba(44, 24, 16, 0.04)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-soft)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(44, 24, 16, 0.04)'
                }}
              />
            </div>
            <div>
              <label
                className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                结束时间
              </label>
              <input
                type="time"
                value={formEndTime}
                onChange={(e) => setFormEndTime(e.target.value)}
                className="w-full px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-surface-2)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 1px 3px rgba(44, 24, 16, 0.04)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-soft)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(44, 24, 16, 0.04)'
                }}
              />
            </div>
          </div>

          {/* Duration display */}
          <div
            className="text-sm flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)]"
            style={{
              backgroundColor: 'var(--color-bg-surface-2)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            时长：
            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {computedDuration > 0 ? formatMinutes(computedDuration) : '---'}
            </span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
