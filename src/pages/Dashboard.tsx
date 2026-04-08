import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Modal, Button, Badge, EmptyState } from '../components/ui'
import Input from '../components/ui/Input'
import { useAppStore } from '../store/useAppStore'
import type { Activity, ActivityCategory } from '../services/dataService'
import useTheme from '../hooks/useTheme'
import { CATEGORY_COLORS } from '../config/themes'
import dataService from '../services/dataService'

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

// ── Circular progress ring ──

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
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth={stroke}
          opacity={0.2}
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
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
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

  // Load data on mount
  useEffect(() => {
    loadActivities()
    loadTasks()
    loadHabits()
  }, [loadActivities, loadTasks, loadHabits])

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
      updateTask(id, { status: currentStatus === 'completed' ? 'pending' : 'completed' })
    },
    [updateTask],
  )

  const handleCheckin = useCallback(
    (habitId: string) => {
      checkinHabit(habitId, today, 1)
    },
    [checkinHabit, today],
  )

  // ── Render ──

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
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

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
          今日概览
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          {dateLabel} &middot; {greeting()}
        </p>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Focus time */}
        <Card hover onClick={() => navigate('/focus')} className="flex items-center gap-4">
          <ProgressRing value={goalPct} color={accentColor} onClick={() => navigate('/focus')}>
            <span className="text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
              {totalHours}:{String(totalMins).padStart(2, '0')}
            </span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-text-muted)]">专注时长</p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">
              {Math.round(goalPct)}% 目标
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              目标 {fmtDuration(dailyGoalMinutes)}
            </p>
          </div>
        </Card>

        {/* Activity count */}
        <Card className="flex items-center gap-4">
          <div
            className="flex items-center justify-center w-[88px] h-[88px] rounded-2xl text-3xl font-bold"
            style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
          >
            {dailyStats.activityCount}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-text-muted)]">活动数量</p>
            {topCategory && (
              <Badge variant="accent" className="mt-1">
                {topCategory[0]} {fmtDuration(topCategory[1])}
              </Badge>
            )}
          </div>
        </Card>

        {/* Streak */}
        <Card className="flex items-center gap-4">
          <div
            className="flex items-center justify-center w-[88px] h-[88px] rounded-2xl text-3xl"
            style={{ background: streak > 0 ? 'rgba(239,68,68,0.1)' : 'var(--color-bg-surface-2)' }}
          >
            <span role="img" aria-label="fire">🔥</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-text-muted)]">连续打卡</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-0.5 tabular-nums">
              {streak}<span className="text-sm font-normal text-[var(--color-text-muted)] ml-1">天</span>
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)]">每日 &gt; 1小时</p>
          </div>
        </Card>
      </div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Activity Timeline */}
        <div className="lg:col-span-3">
          <Card padding="sm">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] px-2 pt-2 pb-3">
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
                {/* Timeline line */}
                <div
                  className="absolute left-[17px] top-0 bottom-0 w-px"
                  style={{ background: 'var(--color-border-subtle)', opacity: 0.3 }}
                />
                {sortedActivities.map((act) => {
                  const catColor = CATEGORY_COLORS[act.category] || CATEGORY_COLORS['其他']
                  return (
                    <div
                      key={act.id}
                      className="relative flex items-start gap-3 py-2.5 px-2 rounded-xl hover:bg-[var(--color-bg-surface-2)] transition-colors cursor-pointer group"
                      onClick={() => setEditingActivity(act)}
                    >
                      {/* Dot */}
                      <div
                        className="absolute -left-[17px] top-[18px] w-2.5 h-2.5 rounded-full ring-2 ring-[var(--color-bg-surface-1)] z-10"
                        style={{ background: catColor }}
                      />
                      {/* Time */}
                      <span className="text-[11px] tabular-nums text-[var(--color-text-muted)] w-24 shrink-0 pt-0.5">
                        {fmtTime(act.startTime)} – {fmtTime(act.endTime)}
                      </span>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                          {act.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full"
                            style={{ background: catColor }}
                          />
                          <span className="text-[11px] text-[var(--color-text-muted)]">
                            {act.category}
                          </span>
                          <span className="text-[11px] text-[var(--color-text-muted)]">
                            {fmtDuration(act.duration)}
                          </span>
                        </div>
                      </div>
                      {/* Edit hint */}
                      <span className="text-[10px] text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity pt-1">
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
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] px-2 pt-2 pb-3">
              待办事项
            </h2>
            {pendingTasks.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] px-2 pb-3">全部完成!</p>
            ) : (
              <ul className="space-y-0.5 pb-1">
                {pendingTasks.map((task) => {
                  const done = task.status === 'completed'
                  return (
                    <li
                      key={task.id}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--color-bg-surface-2)] transition-colors cursor-pointer"
                      onClick={() => handleTaskToggle(task.id, task.status)}
                    >
                      <span
                        className={[
                          'flex items-center justify-center w-[18px] h-[18px] rounded-md border-2 shrink-0 transition-colors',
                          done
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                            : 'border-[var(--color-border-subtle)]',
                        ].join(' ')}
                      >
                        {done && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 5l2.5 2.5L8 3" />
                          </svg>
                        )}
                      </span>
                      <span
                        className={[
                          'text-sm truncate',
                          done
                            ? 'line-through text-[var(--color-text-muted)]'
                            : 'text-[var(--color-text-primary)]',
                        ].join(' ')}
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
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] px-2 pt-2 pb-3">
              今日习惯
            </h2>
            {habits.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] px-2 pb-3">还没有习惯</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-1 pb-2">
                {habits.map((habit) => {
                  const done = habit.checkins[today] && habit.checkins[today] > 0
                  return (
                    <button
                      key={habit.id}
                      onClick={() => handleCheckin(habit.id)}
                      className={[
                        'flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all cursor-pointer',
                        done
                          ? 'bg-[var(--color-accent-soft)] ring-1 ring-[var(--color-accent)]/30'
                          : 'bg-[var(--color-bg-surface-2)] hover:bg-[var(--color-bg-surface-2)]/80',
                      ].join(' ')}
                    >
                      <span className="text-base">{habit.icon}</span>
                      <span className={[
                        'text-xs font-medium truncate',
                        done ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]',
                      ].join(' ')}>
                        {habit.name}
                      </span>
                      {done && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto shrink-0">
                          <path d="M2.5 6l2.5 2.5L9.5 4" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] px-2 pt-2 pb-3">
            分类分布
          </h2>
          <div className="px-2 pb-3 space-y-2">
            {/* Stacked bar */}
            <div className="flex h-3 rounded-full overflow-hidden">
              {categoryBar.map(({ cat, pct }) => (
                <div
                  key={cat}
                  style={{
                    width: `${Math.max(pct, 1)}%`,
                    background: CATEGORY_COLORS[cat] || CATEGORY_COLORS['其他'],
                  }}
                  className="transition-all duration-500"
                  title={`${cat}: ${pct.toFixed(1)}%`}
                />
              ))}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {categoryBar.map(({ cat, mins, pct }) => (
                <div key={cat} className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
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
