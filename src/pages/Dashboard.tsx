import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Modal, Button, Badge, EmptyState } from '../components/ui'
import Input from '../components/ui/Input'
import { useAppStore } from '../store/useAppStore'
import type { Activity, ActivityCategory } from '../services/dataService'
import useTheme from '../hooks/useTheme'
import { CATEGORY_COLORS } from '../config/themes'
import dataService from '../services/dataService'
import DailySummary from '../components/DailySummary'
import { trackingService } from '../services/trackingService'

// ── Helpers ──

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtTime(iso: string): string {
  return iso.slice(11, 16)
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，注意休息'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

const CATEGORIES: ActivityCategory[] = [
  '开发', '工作', '学习', '会议', '休息', '娱乐', '运动', '阅读', '其他',
]

// ── Shared inline style constants ──

const CARD_GRADIENT_BG = 'linear-gradient(135deg, #ffffff 0%, #fef8f0 100%)'
const TRANSITION_ALL = 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'

// ── Circular progress ring with glow ──

function ProgressRing({
  value,
  size = 88,
  stroke = 7,
  color,
  onClick,
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color: string
  onClick?: () => void
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  const offset = c - (clamped / 100) * c
  return (
    <div
      className={`relative inline-flex items-center justify-center ${onClick ? 'cursor-pointer' : ''}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
    >
      {/* Glow behind progress */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-30"
        style={{ background: color }}
      />
      <svg width={size} height={size} className="-rotate-90 relative z-10">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth={stroke}
          opacity={0.15}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        {children}
      </div>
    </div>
  )
}

// ── Edit Activity Modal ──

function EditActivityModal({
  activity,
  onClose,
  onSave,
  onDelete,
}: {
  activity: Activity
  onClose: () => void
  onSave: (id: string, updates: Partial<Activity>) => void
  onDelete: (id: string) => void
}) {
  const [name, setName] = useState(activity.name)
  const [category, setCategory] = useState<ActivityCategory>(activity.category)
  const [startTime, setStartTime] = useState(activity.startTime.slice(0, 16))
  const [endTime, setEndTime] = useState(activity.endTime.slice(0, 16))
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = () => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const duration = Math.round((end.getTime() - start.getTime()) / 60000)
    onSave(activity.id, {
      name,
      category,
      startTime: startTime + ':00',
      endTime: endTime + ':00',
      duration: Math.max(1, duration),
    })
    onClose()
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="编辑活动"
      footer={
        <>
          {confirmDelete ? (
            <>
              <span className="text-sm text-red-500 mr-auto">确认删除？</span>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>取消</Button>
              <Button variant="danger" size="sm" onClick={() => { onDelete(activity.id); onClose() }}>删除</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                删除
              </Button>
              <div className="flex-1" />
              <Button variant="secondary" size="sm" onClick={onClose}>取消</Button>
              <Button size="sm" onClick={handleSave}>保存</Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <Input label="活动名称" value={name} onChange={setName} placeholder="活动名称" />
        <div>
          <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-2">类别</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={[
                  'px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer',
                  cat === category
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium'
                    : 'border-[var(--color-border-subtle)]/50 text-[var(--color-text-secondary)] hover:border-[var(--color-border-subtle)]',
                ].join(' ')}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1">开始时间</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-transparent border-b-2 border-[var(--color-border-subtle)]/50 focus:border-[var(--color-accent)] text-[var(--color-text-primary)] text-sm py-2 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1">结束时间</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-transparent border-b-2 border-[var(--color-border-subtle)]/50 focus:border-[var(--color-accent)] text-[var(--color-text-primary)] text-sm py-2 outline-none"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── Main Dashboard ──

export default function Dashboard() {
  const navigate = useNavigate()
  const { accentColor } = useTheme()

  const activities = useAppStore((s) => s.activities)
  const loadActivities = useAppStore((s) => s.loadActivities)
  const updateActivity = useAppStore((s) => s.updateActivity)
  const deleteActivity = useAppStore((s) => s.deleteActivity)

  const tasks = useAppStore((s) => s.tasks)
  const loadTasks = useAppStore((s) => s.loadTasks)
  const updateTask = useAppStore((s) => s.updateTask)

  const habits = useAppStore((s) => s.habits)
  const loadHabits = useAppStore((s) => s.loadHabits)
  const checkinHabit = useAppStore((s) => s.checkinHabit)

  const dailyGoalMinutes = useAppStore((s) => s.dailyGoalMinutes)

  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({})
  const [checkedHabits, setCheckedHabits] = useState<Record<string, boolean>>({})
  const [showSummary, setShowSummary] = useState(false)
  const [currentTracking, setCurrentTracking] = useState(trackingService.getCurrentActivity())

  // Load data on mount
  useEffect(() => {
    loadActivities()
    loadTasks()
    loadHabits()
  }, [loadActivities, loadTasks, loadHabits])

  // Subscribe to tracking service for live updates
  useEffect(() => {
    const unsub = trackingService.subscribe(() => {
      setCurrentTracking(trackingService.getCurrentActivity())
      loadActivities() // refresh activities when new ones are generated
    })
    return unsub
  }, [loadActivities])

  // Derived stats
  const today = todayStr()
  const dailyStats = useMemo(() => dataService.getDailyStats(today), [today, activities])

  const totalHours = Math.floor(dailyStats.totalMinutes / 60)
  const totalMins = dailyStats.totalMinutes % 60
  const goalPct = Math.min(100, (dailyStats.totalMinutes / dailyGoalMinutes) * 100)

  const topCategory = useMemo(() => {
    const entries = Object.entries(dailyStats.categories)
    if (entries.length === 0) return null
    entries.sort((a, b) => b[1] - a[1])
    return entries[0]
  }, [dailyStats])

  // Streak: consecutive days with > 60 min of activity
  const streak = useMemo(() => {
    let count = 0
    const d = new Date()
    for (let i = 0; i < 365; i++) {
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const stats = dataService.getDailyStats(ds)
      if (stats.totalMinutes >= 60) {
        count++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }
    return count
  }, [activities])

  // Sorted activities for timeline
  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [activities],
  )

  // Pending tasks (top 5)
  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'completed').slice(0, 5),
    [tasks],
  )

  // Category bar data
  const categoryBar = useMemo(() => {
    const entries = Object.entries(dailyStats.categories).sort((a, b) => b[1] - a[1])
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1
    return entries.map(([cat, mins]) => ({ cat, mins, pct: (mins / total) * 100 }))
  }, [dailyStats])

  // Format today's date
  const dateLabel = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const handleTaskToggle = useCallback(
    (id: string, currentStatus: string) => {
      setCheckedTasks((prev) => ({ ...prev, [id]: true }))
      setTimeout(() => {
        updateTask(id, { status: currentStatus === 'completed' ? 'pending' : 'completed' })
        setCheckedTasks((prev) => ({ ...prev, [id]: false }))
      }, 350)
    },
    [updateTask],
  )

  const handleCheckin = useCallback(
    (habitId: string) => {
      setCheckedHabits((prev) => ({ ...prev, [habitId]: true }))
      setTimeout(() => {
        checkinHabit(habitId, today, 1)
        setCheckedHabits((prev) => ({ ...prev, [habitId]: false }))
      }, 400)
    },
    [checkinHabit, today],
  )

  // ── Render ──

  return (
    <div style={{ padding: '32px 40px' }} className="max-w-6xl mx-auto space-y-6">
      {/* Edit Modal */}
      {editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={(id, updates) => {
            updateActivity(id, updates)
            setEditingActivity(null)
          }}
          onDelete={(id) => {
            deleteActivity(id)
            setEditingActivity(null)
          }}
        />
      )}

      {/* Daily Summary Modal */}
      <DailySummary isOpen={showSummary} onClose={() => setShowSummary(false)} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            今日概览
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {dateLabel} &middot; {greeting()}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowSummary(true)}>
          生成今日总结
        </Button>
      </div>

      {/* ── Tracking Banner ── */}
      {trackingService.isTracking() && (
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-3"
          style={{
            background: currentTracking
              ? `linear-gradient(135deg, ${CATEGORY_COLORS[currentTracking.category] || 'var(--color-accent)'}12, ${CATEGORY_COLORS[currentTracking.category] || 'var(--color-accent)'}06)`
              : 'var(--color-bg-surface-2)',
            border: `1px solid ${currentTracking ? `${CATEGORY_COLORS[currentTracking.category] || 'var(--color-accent)'}30` : 'var(--color-border-subtle)'}`,
          }}
        >
          <span className="relative flex h-3 w-3">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: currentTracking ? CATEGORY_COLORS[currentTracking.category] || 'var(--color-accent)' : 'var(--color-accent)' }}
            />
            <span
              className="relative inline-flex rounded-full h-3 w-3"
              style={{ background: currentTracking ? CATEGORY_COLORS[currentTracking.category] || 'var(--color-accent)' : 'var(--color-accent)' }}
            />
          </span>
          {currentTracking ? (
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                正在追踪: {currentTracking.name}
              </span>
              <span className="text-[12px] ml-2" style={{ color: 'var(--color-text-muted)' }}>
                {fmtTime(currentTracking.startTime)} 开始 · {currentTracking.category}
              </span>
            </div>
          ) : (
            <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
              AI 追踪已启动 — 等待活动中...
            </span>
          )}
          <button
            onClick={() => navigate('/timeline')}
            className="text-[11px] px-2.5 py-1 rounded-full"
            style={{
              background: 'var(--color-accent-soft)',
              color: 'var(--color-accent)',
            }}
          >
            查看时间线
          </button>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Focus time */}
        <div
          className="flex items-center gap-4 rounded-2xl cursor-pointer"
          onClick={() => navigate('/focus')}
          style={{
            background: CARD_GRADIENT_BG,
            border: '1px solid var(--color-border-subtle)',
            boxShadow: 'var(--shadow-card)',
            padding: '20px 24px',
            transition: TRANSITION_ALL,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-card)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <ProgressRing value={goalPct} color={accentColor} onClick={() => navigate('/focus')}>
            <span className="metric-value" style={{ fontSize: '1.25rem' }}>
              {totalHours}:{String(totalMins).padStart(2, '0')}
            </span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>专注时长</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
              {Math.round(goalPct)}% 目标
            </p>
            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              目标 {fmtDuration(dailyGoalMinutes)}
            </p>
          </div>
        </div>

        {/* Activity count */}
        <div
          className="flex items-center gap-4 rounded-2xl"
          style={{
            background: CARD_GRADIENT_BG,
            border: '1px solid var(--color-border-subtle)',
            boxShadow: 'var(--shadow-card)',
            padding: '20px 24px',
            transition: TRANSITION_ALL,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-card)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <div
            className="flex items-center justify-center w-[88px] h-[88px] rounded-2xl"
            style={{ background: 'var(--color-accent-soft)' }}
          >
            <span className="metric-value">{dailyStats.activityCount}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>活动数量</p>
            {topCategory && (
              <Badge variant="accent" className="mt-1">
                {topCategory[0]} {fmtDuration(topCategory[1])}
              </Badge>
            )}
          </div>
        </div>

        {/* Streak */}
        <div
          className="flex items-center gap-4 rounded-2xl"
          style={{
            background: CARD_GRADIENT_BG,
            border: '1px solid var(--color-border-subtle)',
            boxShadow: 'var(--shadow-card)',
            padding: '20px 24px',
            transition: TRANSITION_ALL,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-card)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <div
            className="flex items-center justify-center w-[88px] h-[88px] rounded-2xl text-3xl"
            style={{ background: streak > 0 ? 'rgba(239,68,68,0.1)' : 'var(--color-bg-surface-2)' }}
          >
            <span role="img" aria-label="fire">🔥</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>连续打卡</p>
            <p className="mt-0.5 tabular-nums">
              <span className="metric-value" style={{ fontSize: '1.75rem' }}>{streak}</span>
              <span className="text-sm font-normal ml-1" style={{ color: 'var(--color-text-muted)' }}>天</span>
            </p>
            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>每日 &gt; 1小时</p>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Activity Timeline */}
        <div className="lg:col-span-3">
          <Card padding="sm">
            <h2 className="text-sm font-semibold px-2 pt-2 pb-3" style={{ color: 'var(--color-text-primary)' }}>
              今日时间线
            </h2>
            {sortedActivities.length === 0 ? (
              <EmptyState
                icon="📋"
                title="暂无活动"
                description="今天还没有记录到任何活动"
              />
            ) : (
              <div className="relative pl-6 pr-2 pb-2 space-y-0.5">
                {/* Timeline gradient line */}
                <div
                  className="absolute left-[17px] top-0 bottom-0 w-px"
                  style={{
                    background: 'linear-gradient(180deg, var(--color-border-subtle) 0%, transparent 100%)',
                    opacity: 0.4,
                  }}
                />
                {sortedActivities.map((act) => {
                  const catColor = CATEGORY_COLORS[act.category] || CATEGORY_COLORS['其他']
                  return (
                    <div
                      key={act.id}
                      className="relative flex items-start gap-3 py-2.5 px-2 rounded-xl cursor-pointer group"
                      style={{
                        borderLeft: `3px solid ${catColor}`,
                        marginLeft: '-3px',
                        transition: TRANSITION_ALL,
                      }}
                      onClick={() => setEditingActivity(act)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${catColor}0D`
                        e.currentTarget.style.transform = 'translateX(2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.transform = 'translateX(0)'
                      }}
                    >
                      {/* Dot on timeline */}
                      <div
                        className="absolute -left-[20px] top-[18px] w-2.5 h-2.5 rounded-full ring-2 ring-[var(--color-bg-surface-1)] z-10"
                        style={{ background: catColor }}
                      />
                      {/* Time */}
                      <span className="text-[11px] tabular-nums w-24 shrink-0 pt-0.5" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>
                        {fmtTime(act.startTime)} – {fmtTime(act.endTime)}
                      </span>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                          {act.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full"
                            style={{ background: catColor }}
                          />
                          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                            {act.category}
                          </span>
                          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                            {fmtDuration(act.duration)}
                          </span>
                        </div>
                      </div>
                      {/* Edit hint */}
                      <span className="text-[10px] opacity-0 group-hover:opacity-100 pt-1" style={{ color: 'var(--color-text-muted)', transition: 'opacity 200ms' }}>
                        编辑
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick tasks */}
          <Card padding="sm">
            <h2 className="text-sm font-semibold px-2 pt-2 pb-3" style={{ color: 'var(--color-text-primary)' }}>
              待办事项
            </h2>
            {pendingTasks.length === 0 ? (
              <p className="text-xs px-2 pb-3" style={{ color: 'var(--color-text-muted)' }}>全部完成!</p>
            ) : (
              <ul className="space-y-0.5 pb-1">
                {pendingTasks.map((task) => {
                  const done = task.status === 'completed'
                  const animating = checkedTasks[task.id]
                  return (
                    <li
                      key={task.id}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer"
                      style={{ transition: TRANSITION_ALL }}
                      onClick={() => handleTaskToggle(task.id, task.status)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-surface-2)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      {/* Circular checkbox with bounce */}
                      <span
                        className="flex items-center justify-center w-[18px] h-[18px] rounded-full border-2 shrink-0"
                        style={{
                          borderColor: done || animating ? 'var(--color-accent)' : 'var(--color-border-subtle)',
                          backgroundColor: done || animating ? 'var(--color-accent)' : 'transparent',
                          transition: TRANSITION_ALL,
                          transform: animating ? 'scale(1.3)' : 'scale(1)',
                        }}
                      >
                        {(done || animating) && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 5l2.5 2.5L8 3" />
                          </svg>
                        )}
                      </span>
                      <span
                        className="text-sm truncate"
                        style={{
                          color: done ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                          textDecoration: done ? 'line-through' : 'none',
                          transition: TRANSITION_ALL,
                        }}
                      >
                        {task.title}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          {/* Habits */}
          <Card padding="sm">
            <h2 className="text-sm font-semibold px-2 pt-2 pb-3" style={{ color: 'var(--color-text-primary)' }}>
              今日习惯
            </h2>
            {habits.length === 0 ? (
              <p className="text-xs px-2 pb-3" style={{ color: 'var(--color-text-muted)' }}>还没有习惯</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-1 pb-2">
                {habits.map((habit) => {
                  const done = habit.checkins[today] && habit.checkins[today] > 0
                  const animating = checkedHabits[habit.id]
                  const habitColor = (habit as any).color || 'var(--color-accent)'
                  return (
                    <button
                      key={habit.id}
                      onClick={() => handleCheckin(habit.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-left cursor-pointer"
                      style={{
                        transition: TRANSITION_ALL,
                        background: done
                          ? `${habitColor}18`
                          : 'var(--color-bg-surface-2)',
                        border: done ? `1px solid ${habitColor}30` : '1px solid transparent',
                        transform: animating ? 'scale(0.95)' : 'scale(1)',
                      }}
                      onMouseEnter={(e) => {
                        if (!done) e.currentTarget.style.opacity = '0.85'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1'
                      }}
                    >
                      <span className="text-base">{habit.icon}</span>
                      <span
                        className="text-xs font-medium truncate"
                        style={{ color: done ? habitColor : 'var(--color-text-secondary)' }}
                      >
                        {habit.name}
                      </span>
                      {(done || animating) && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          className="ml-auto shrink-0"
                          style={{
                            transition: TRANSITION_ALL,
                            transform: animating ? 'scale(1.4)' : 'scale(1)',
                          }}
                        >
                          <path
                            d="M2.5 6l2.5 2.5L9.5 4"
                            stroke={habitColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Category Breakdown Bar ── */}
      {categoryBar.length > 0 && (
        <Card padding="sm">
          <h2 className="text-sm font-semibold px-2 pt-2 pb-3" style={{ color: 'var(--color-text-primary)' }}>
            分类分布
          </h2>
          <div className="px-2 pb-3 space-y-2">
            {/* Stacked bar with rounded segments and gradients */}
            <div className="flex h-7 rounded-full overflow-hidden gap-[2px]">
              {categoryBar.map(({ cat, pct, mins }) => {
                const baseColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS['其他']
                const isWide = pct >= 15
                return (
                  <div
                    key={cat}
                    className="relative flex items-center justify-center overflow-hidden first:rounded-l-full last:rounded-r-full"
                    style={{
                      width: `${Math.max(pct, 2)}%`,
                      background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}CC 100%)`,
                      transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    title={`${cat}: ${pct.toFixed(1)}%`}
                  >
                    {isWide && (
                      <span className="text-[10px] font-medium text-white truncate px-1.5">
                        {cat} {fmtDuration(mins)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Legend — show labels below for narrow segments */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {categoryBar.map(({ cat, mins, pct }) => (
                <div key={cat} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  <span
                    className="w-2 h-2 rounded-sm shrink-0"
                    style={{ background: CATEGORY_COLORS[cat] || CATEGORY_COLORS['其他'] }}
                  />
                  {cat} {fmtDuration(mins)} ({pct.toFixed(0)}%)
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
