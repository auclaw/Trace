import { useState, useEffect, useCallback, useMemo } from 'react'

import { Modal, Button, Progress, Badge, EmptyState, Input } from '../components/ui'
import { useAppStore } from '../store/useAppStore'
import type { Task, Subtask, TaskStatus, RepeatType } from '../services/dataService'
import useTheme from '../hooks/useTheme'
import { PRIORITY_COLORS } from '../config/themes'

// --- Types & Constants ---

type FilterTab = 'all' | 'pending' | 'in_progress' | 'completed'
type ViewMode = 'list' | 'board' | 'calendar' | 'timeline'

const FILTER_LABELS: Record<FilterTab, string> = {
  all: '全部',
  pending: '待办',
  in_progress: '进行中',
  completed: '已完成',
}

const VIEW_LABELS: Record<ViewMode, string> = {
  list: '列表视图',
  board: '看板视图',
  calendar: '日历视图',
  timeline: '时间线视图',
}

const VIEW_ICONS: Record<ViewMode, string> = {
  list: 'M3 4h10M3 8h10M3 12h10',
  board: 'M3 3h4v10H3zM9 3h4v7H9z',
  calendar: 'M3 5h10v8H3zM5 3v2M9 3v2',
  timeline: 'M2 8h12M4 5h3v6H4zM9 6h3v4H9z',
}

const REPEAT_LABELS: Record<RepeatType, string> = {
  none: '不重复',
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
}

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

// --- Helpers ---

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayDisplay(): string {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })
}

function fmtDuration(mins: number): string {
  if (mins <= 0) return '0m'
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`
  return `${m}m`
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function dateStr(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`
}


function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00')
  const db = new Date(b + 'T00:00:00')
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

function getHeatmapBg(count: number): string {
  if (count <= 0) return 'var(--color-bg-surface-2)'
  const opacity = count === 1 ? 25 : count === 2 ? 40 : count >= 3 ? 60 : 25
  return `color-mix(in srgb, var(--color-accent) ${opacity}%, var(--color-bg-surface-2))`
}

// --- Form state ---

interface TaskForm {
  title: string
  priority: 1 | 2 | 3 | 4 | 5
  project: string
  estimatedMinutes: number
  dueDate: string
  repeatType: RepeatType
  subtasks: Subtask[]
}

const EMPTY_FORM: TaskForm = {
  title: '',
  priority: 3,
  project: '',
  estimatedMinutes: 60,
  dueDate: todayStr(),
  repeatType: 'none',
  subtasks: [],
}

// ============================================================
// Main Component
// ============================================================

export default function Planner() {
  const { accentColor } = useTheme()

  const tasks = useAppStore((s) => s.tasks)
  const loadTasks = useAppStore((s) => s.loadTasks)
  const addTask = useAppStore((s) => s.addTask)
  const updateTask = useAppStore((s) => s.updateTask)
  const deleteTask = useAppStore((s) => s.deleteTask)

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filter, setFilter] = useState<FilterTab>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TaskForm>({ ...EMPTY_FORM })
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Calendar state
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState(todayStr())

  useEffect(() => { loadTasks() }, [loadTasks])

  // --- filtered tasks ---
  const filtered = tasks.filter((t) => {
    if (filter === 'all') return true
    return t.status === filter
  })

  // --- Kanban columns ---
  const boardColumns = useMemo(() => ({
    pending: filtered.filter((t) => t.status === 'pending'),
    in_progress: filtered.filter((t) => t.status === 'in_progress'),
    completed: filtered.filter((t) => t.status === 'completed'),
  }), [filtered])

  // --- Calendar grid ---
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth - 1, 1)
    const daysInMonth = new Date(calYear, calMonth, 0).getDate()
    let startWeekday = firstDay.getDay() - 1
    if (startWeekday < 0) startWeekday = 6
    const cells: (number | null)[] = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }, [calYear, calMonth])

  // Tasks grouped by due date for calendar
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    tasks.forEach((t) => {
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = []
        map[t.dueDate].push(t)
      }
    })
    return map
  }, [tasks])

  // --- Timeline range ---
  const timelineData = useMemo(() => {
    const sorted = [...tasks].filter((t) => t.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    if (sorted.length === 0) return { tasks: sorted, startDate: todayStr(), endDate: todayStr(), totalDays: 14 }
    const earliest = sorted.reduce((min, t) => {
      const created = t.createdAt.slice(0, 10)
      return created < min ? created : min
    }, sorted[0].dueDate)
    const latest = sorted.reduce((max, t) => t.dueDate > max ? t.dueDate : max, sorted[0].dueDate)
    const startDate = earliest < todayStr() ? earliest : todayStr()
    const endDateRaw = latest > todayStr() ? latest : todayStr()
    // Add 2 days padding
    const endD = new Date(endDateRaw + 'T00:00:00')
    endD.setDate(endD.getDate() + 2)
    const endDate = `${endD.getFullYear()}-${pad2(endD.getMonth() + 1)}-${pad2(endD.getDate())}`
    const totalDays = Math.max(14, daysBetween(startDate, endDate) + 1)
    return { tasks: sorted, startDate, endDate, totalDays }
  }, [tasks])

  // --- Modal handlers ---
  const openAdd = useCallback((presetDate?: string) => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, dueDate: presetDate || todayStr() })
    setNewSubtaskTitle('')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((task: Task) => {
    setEditingId(task.id)
    setForm({
      title: task.title,
      priority: task.priority,
      project: task.project,
      estimatedMinutes: task.estimatedMinutes,
      dueDate: task.dueDate,
      repeatType: task.repeatType,
      subtasks: task.subtasks.map((s) => ({ ...s })),
    })
    setNewSubtaskTitle('')
    setModalOpen(true)
  }, [])

  const handleSave = useCallback(() => {
    if (!form.title.trim()) return
    if (editingId) {
      updateTask(editingId, {
        title: form.title.trim(),
        priority: form.priority,
        project: form.project.trim(),
        estimatedMinutes: form.estimatedMinutes,
        dueDate: form.dueDate,
        repeatType: form.repeatType,
        subtasks: form.subtasks,
      })
    } else {
      addTask({
        title: form.title.trim(),
        priority: form.priority,
        status: 'pending' as TaskStatus,
        estimatedMinutes: form.estimatedMinutes,
        actualMinutes: 0,
        project: form.project.trim(),
        subtasks: form.subtasks,
        dueDate: form.dueDate,
        repeatType: form.repeatType,
        createdAt: new Date().toISOString(),
      })
    }
    setModalOpen(false)
  }, [editingId, form, addTask, updateTask])

  const toggleStatus = useCallback((task: Task) => {
    const next: TaskStatus = task.status === 'completed' ? 'pending' : 'completed'
    updateTask(task.id, { status: next })
  }, [updateTask])

  const cycleStatus = useCallback((task: Task) => {
    const order: TaskStatus[] = ['pending', 'in_progress', 'completed']
    const idx = order.indexOf(task.status)
    updateTask(task.id, { status: order[(idx + 1) % 3] })
  }, [updateTask])

  const handleDelete = useCallback((id: string) => {
    deleteTask(id)
    setConfirmDeleteId(null)
  }, [deleteTask])

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Subtask form helpers
  const addFormSubtask = useCallback(() => {
    if (!newSubtaskTitle.trim()) return
    setForm((f) => ({
      ...f,
      subtasks: [...f.subtasks, { id: crypto.randomUUID(), title: newSubtaskTitle.trim(), completed: false }],
    }))
    setNewSubtaskTitle('')
  }, [newSubtaskTitle])

  const toggleFormSubtask = useCallback((sid: string) => {
    setForm((f) => ({
      ...f,
      subtasks: f.subtasks.map((s) => (s.id === sid ? { ...s, completed: !s.completed } : s)),
    }))
  }, [])

  const removeFormSubtask = useCallback((sid: string) => {
    setForm((f) => ({ ...f, subtasks: f.subtasks.filter((s) => s.id !== sid) }))
  }, [])

  // Calendar nav
  const prevMonth = useCallback(() => {
    if (calMonth === 1) { setCalMonth(12); setCalYear((y) => y - 1) }
    else setCalMonth((m) => m - 1)
  }, [calMonth])

  const nextMonth = useCallback(() => {
    if (calMonth === 12) { setCalMonth(1); setCalYear((y) => y + 1) }
    else setCalMonth((m) => m + 1)
  }, [calMonth])

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            任务中心
          </h1>
          <div className="mt-1.5 h-1 rounded-full" style={{ width: 48, background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-soft))' }} />
        </div>
        <button
          onClick={() => openAdd()}
          className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent) 100%)', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 14px rgba(44, 24, 16, 0.15)' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(44, 24, 16, 0.22)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(44, 24, 16, 0.15)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
          添加任务
        </button>
      </div>
      <p className="text-sm text-[var(--color-text-muted)] mb-5">{todayDisplay()}</p>

      {/* ── View Mode Switcher ── */}
      <div className="flex items-center gap-2 mb-5">
        {(Object.keys(VIEW_LABELS) as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className="cursor-pointer inline-flex items-center gap-1.5 transition-all duration-200"
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 600,
              background: viewMode === mode ? 'var(--color-accent)' : 'var(--color-bg-surface-2)',
              color: viewMode === mode ? '#fff' : 'var(--color-text-secondary)',
              boxShadow: viewMode === mode ? '0 2px 8px rgba(44, 24, 16, 0.15)' : 'inset 0 0 0 1px var(--color-border-subtle)',
              transform: viewMode === mode ? 'scale(1.03)' : 'scale(1)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={VIEW_ICONS[mode]} />
            </svg>
            {VIEW_LABELS[mode]}
          </button>
        ))}
      </div>

      {/* ── Filter Tabs (for list & board) ── */}
      {(viewMode === 'list' || viewMode === 'board') && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(Object.keys(FILTER_LABELS) as FilterTab[]).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="cursor-pointer whitespace-nowrap transition-all duration-200"
              style={{
                padding: '6px 18px', borderRadius: 9999, fontSize: 13, fontWeight: 600,
                background: filter === key ? 'var(--color-accent)' : 'var(--color-accent-soft)',
                color: filter === key ? '#fff' : 'var(--color-text-secondary)',
                boxShadow: filter === key ? '0 2px 8px rgba(44, 24, 16, 0.12)' : 'none',
                transform: filter === key ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === 'list' && (
        filtered.length === 0 ? (
          <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fef8f0 100%)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-subtle)', boxShadow: 'var(--shadow-card)', padding: '48px 24px', textAlign: 'center' as const }}>
            <EmptyState icon="📋" title="暂无任务" description="点击「添加任务」来规划你的一天"
              action={<button onClick={() => openAdd()} className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white" style={{ background: 'var(--color-accent)', borderRadius: 'var(--radius-md)' }}>添加任务</button>} />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((task, idx) => (
              <TaskCard
                key={task.id} task={task} expanded={expandedIds.has(task.id)} confirmDelete={confirmDeleteId === task.id}
                onToggleStatus={() => toggleStatus(task)} onEdit={() => openEdit(task)}
                onDelete={() => setConfirmDeleteId(task.id)} onConfirmDelete={() => handleDelete(task.id)}
                onCancelDelete={() => setConfirmDeleteId(null)} onToggleExpand={() => toggleExpand(task.id)}
                onToggleSubtask={(sid) => { const st = task.subtasks.map((s) => s.id === sid ? { ...s, completed: !s.completed } : s); updateTask(task.id, { subtasks: st }) }}
                accentColor={accentColor} index={idx}
              />
            ))}
          </div>
        )
      )}

      {/* ── BOARD VIEW ── */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([
            { key: 'pending' as const, label: '待办', color: '#3b82f6' },
            { key: 'in_progress' as const, label: '进行中', color: '#f59e0b' },
            { key: 'completed' as const, label: '已完成', color: '#22c55e' },
          ] as const).map(({ key, label, color }) => (
            <div key={key} style={{ background: 'var(--color-bg-surface-1)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-xl)', padding: '16px', minHeight: 200 }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{label}</span>
                <span className="text-xs text-[var(--color-text-muted)] ml-auto">{boardColumns[key].length}</span>
              </div>
              {boardColumns[key].length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)] text-center py-8">暂无任务</p>
              ) : (
                <div className="space-y-2.5">
                  {boardColumns[key].map((task) => (
                    <div
                      key={task.id}
                      onClick={() => openEdit(task)}
                      className="cursor-pointer transition-all duration-200"
                      style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #fef8f0 100%)',
                        border: '1px solid var(--color-border-subtle)',
                        borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
                        borderRadius: 'var(--radius-lg)',
                        padding: '12px',
                        boxShadow: 'var(--shadow-card)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">{task.title}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); cycleStatus(task) }}
                          className="cursor-pointer flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                          style={{ border: task.status === 'completed' ? 'none' : '2px solid var(--color-border-subtle)', background: task.status === 'completed' ? 'var(--color-accent)' : 'transparent' }}
                        >
                          {task.status === 'completed' && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg>}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
                        {task.project && <Badge variant="accent">{task.project}</Badge>}
                        {task.dueDate && <span className="text-[10px] text-[var(--color-text-muted)]">{task.dueDate}</span>}
                      </div>
                      {task.subtasks.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <Progress value={(task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100} size="sm" className="w-12" />
                          <span className="text-[10px] text-[var(--color-text-muted)]">{task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── CALENDAR VIEW ── */}
      {viewMode === 'calendar' && (
        <div>
          {/* Month nav */}
          <div className="flex items-center gap-4 mb-5">
            <button onClick={prevMonth} className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-2)] transition-all cursor-pointer" style={{ boxShadow: 'inset 0 0 0 1px var(--color-border-subtle)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 4l-4 4 4 4" /></svg>
            </button>
            <h2 className="text-xl font-extrabold tracking-tight text-[var(--color-text-primary)] tabular-nums min-w-[8rem] text-center select-none">{calYear}年{calMonth}月</h2>
            <button onClick={nextMonth} className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-2)] transition-all cursor-pointer" style={{ boxShadow: 'inset 0 0 0 1px var(--color-border-subtle)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4l4 4-4 4" /></svg>
            </button>
            <Button variant="secondary" size="sm" onClick={() => { const t = new Date(); setCalYear(t.getFullYear()); setCalMonth(t.getMonth() + 1); setSelectedDate(todayStr()) }}>今天</Button>
          </div>

          {/* Calendar grid */}
          <div className="rounded-[var(--radius-xl)] overflow-hidden mb-5" style={{ background: 'linear-gradient(135deg, var(--color-bg-surface-1), var(--color-bg-surface-2))', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-subtle)', padding: '1.25rem' }}>
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="text-center text-[10px] font-semibold uppercase tracking-widest py-2" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => {
                if (day === null) return <div key={`e-${idx}`} className="aspect-square" />
                const ds = dateStr(calYear, calMonth, day)
                const taskCount = (tasksByDate[ds] || []).length
                const isToday = ds === todayStr()
                const isSelected = ds === selectedDate

                const cellStyle: React.CSSProperties = {
                  backgroundColor: getHeatmapBg(taskCount),
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }
                if (isToday && !isSelected) {
                  cellStyle.boxShadow = 'inset 0 0 0 2px var(--color-accent)'
                  cellStyle.background = 'linear-gradient(135deg, var(--color-accent-soft), transparent)'
                }
                if (isSelected) {
                  cellStyle.boxShadow = '0 0 0 2.5px var(--color-accent), 0 4px 12px rgba(44,24,16,0.12)'
                  cellStyle.background = 'var(--color-accent-soft)'
                }

                return (
                  <button key={ds} type="button" onClick={() => setSelectedDate(ds)}
                    className="aspect-square rounded-[var(--radius-md)] flex flex-col items-center justify-center relative text-sm cursor-pointer hover:scale-[1.08] hover:z-10"
                    style={cellStyle}
                  >
                    <span style={{ fontWeight: isSelected || isToday ? 700 : 500, color: isSelected || isToday ? 'var(--color-accent)' : taskCount > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                      {day}
                    </span>
                    {taskCount > 0 && !isSelected && (
                      <span className="absolute bottom-1.5 w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
                    )}
                  </button>
                )
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
              <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>少</span>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3].map((c) => (
                  <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getHeatmapBg(c) }} />
                ))}
              </div>
              <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>多</span>
            </div>
          </div>

          {/* Selected day detail */}
          <div className="rounded-[var(--radius-xl)]" style={{ background: 'linear-gradient(160deg, var(--color-bg-surface-1), var(--color-bg-surface-2))', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-subtle)', padding: '1.5rem' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                </h3>
                <span className="text-xs text-[var(--color-text-muted)]">{(tasksByDate[selectedDate] || []).length} 个任务</span>
              </div>
              <Button size="sm" onClick={() => openAdd(selectedDate)}>添加任务</Button>
            </div>
            {(tasksByDate[selectedDate] || []).length === 0 ? (
              <EmptyState icon="📅" title="当日无任务" description="点击上方按钮添加任务" action={<Button size="sm" onClick={() => openAdd(selectedDate)}>添加任务</Button>} />
            ) : (
              <div className="space-y-2">
                {(tasksByDate[selectedDate] || []).map((task) => (
                  <div key={task.id} onClick={() => openEdit(task)} className="flex items-center gap-3 py-2.5 px-3 rounded-[var(--radius-md)] cursor-pointer transition-all duration-200"
                    style={{ borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-surface-2)'; e.currentTarget.style.transform = 'translateX(2px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' }}
                  >
                    <span onClick={(e) => { e.stopPropagation(); toggleStatus(task) }}
                      className="cursor-pointer flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                      style={{ border: task.status === 'completed' ? 'none' : '2px solid var(--color-border-subtle)', background: task.status === 'completed' ? 'var(--color-accent)' : 'transparent' }}
                    >
                      {task.status === 'completed' && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg>}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'}`}>{task.title}</span>
                        {task.project && <Badge variant="accent">{task.project}</Badge>}
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)]">P{task.priority} · {fmtDuration(task.estimatedMinutes)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TIMELINE VIEW ── */}
      {viewMode === 'timeline' && (
        <div>
          {timelineData.tasks.length === 0 ? (
            <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fef8f0 100%)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-subtle)', boxShadow: 'var(--shadow-card)', padding: '48px 24px', textAlign: 'center' as const }}>
              <EmptyState icon="📊" title="暂无任务" description="添加带截止日期的任务以查看时间线" action={<Button onClick={() => openAdd()}>添加任务</Button>} />
            </div>
          ) : (
            <div className="rounded-[var(--radius-xl)] overflow-hidden" style={{ background: 'var(--color-bg-surface-1)', border: '1px solid var(--color-border-subtle)', boxShadow: 'var(--shadow-card)' }}>
              <div className="overflow-x-auto">
                <div style={{ minWidth: Math.max(700, timelineData.totalDays * 48) }}>
                  {/* Date headers */}
                  <div className="flex border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    <div className="flex-shrink-0 w-48 p-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">任务</div>
                    <div className="flex flex-1">
                      {Array.from({ length: timelineData.totalDays }, (_, i) => {
                        const d = new Date(timelineData.startDate + 'T00:00:00')
                        d.setDate(d.getDate() + i)
                        const ds = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
                        const isToday = ds === todayStr()
                        return (
                          <div key={ds} className="flex-1 min-w-[48px] text-center py-2 text-[10px] font-medium" style={{ color: isToday ? 'var(--color-accent)' : 'var(--color-text-muted)', fontWeight: isToday ? 700 : 500, background: isToday ? 'var(--color-accent-soft)' : undefined, borderLeft: '1px solid var(--color-border-subtle)' }}>
                            {d.getDate()}<br />{['日', '一', '二', '三', '四', '五', '六'][d.getDay()]}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Task rows */}
                  {timelineData.tasks.map((task, idx) => {
                    const createdDate = task.createdAt.slice(0, 10)
                    const startOffset = Math.max(0, daysBetween(timelineData.startDate, createdDate))
                    const endOffset = Math.max(startOffset + 1, daysBetween(timelineData.startDate, task.dueDate) + 1)
                    const barLeftPct = (startOffset / timelineData.totalDays) * 100
                    const barWidthPct = ((endOffset - startOffset) / timelineData.totalDays) * 100

                    return (
                      <div key={task.id} className="flex items-center border-b" style={{ borderColor: 'var(--color-border-subtle)', minHeight: 44, animation: `fadeInUp 0.3s ease ${idx * 40}ms both` }}>
                        <div className="flex-shrink-0 w-48 px-3 py-2 flex items-center gap-2 cursor-pointer" onClick={() => openEdit(task)}>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
                          <span className="text-xs font-medium text-[var(--color-text-primary)] truncate">{task.title}</span>
                        </div>
                        <div className="flex-1 relative" style={{ height: 32 }}>
                          <div
                            className="absolute top-1 rounded-md cursor-pointer transition-all duration-200 flex items-center px-2"
                            onClick={() => openEdit(task)}
                            style={{
                              left: `${barLeftPct}%`,
                              width: `${Math.max(barWidthPct, 2)}%`,
                              height: 24,
                              background: `linear-gradient(90deg, ${PRIORITY_COLORS[task.priority]}cc, ${PRIORITY_COLORS[task.priority]}88)`,
                              opacity: task.status === 'completed' ? 0.5 : 1,
                              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scaleY(1.15)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scaleY(1)' }}
                          >
                            <span className="text-[10px] font-semibold text-white truncate">{task.project || ''}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? '编辑任务' : '添加任务'} size="lg"
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button><Button onClick={handleSave} disabled={!form.title.trim()}>保存</Button></>}
      >
        <div className="space-y-5">
          <Input label="任务标题" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="输入任务名称..." />
          {/* Priority */}
          <div>
            <span className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-2">优先级</span>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map((p) => (
                <button key={p} onClick={() => setForm((f) => ({ ...f, priority: p }))}
                  className={['w-9 h-9 rounded-full text-xs font-bold transition-all cursor-pointer', form.priority === p ? 'ring-2 ring-offset-2 ring-[var(--color-accent)] scale-110' : 'opacity-60 hover:opacity-100'].join(' ')}
                  style={{ backgroundColor: PRIORITY_COLORS[p], color: '#fff' }}
                >{p}</button>
              ))}
            </div>
          </div>
          {/* Project + time */}
          <div className="grid grid-cols-2 gap-4">
            <Input label="项目" value={form.project} onChange={(v) => setForm((f) => ({ ...f, project: v }))} placeholder="例如: 工作" />
            <Input label="预估时间 (分钟)" type="number" value={String(form.estimatedMinutes)} onChange={(v) => setForm((f) => ({ ...f, estimatedMinutes: Math.max(1, Number(v) || 0) }))} />
          </div>
          {/* Due date + repeat */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1">截止日期</span>
              <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full text-sm py-2 bg-transparent border-b-2 border-[var(--color-border-subtle)]/50 focus:border-[var(--color-accent)] outline-none text-[var(--color-text-primary)] transition-colors" />
            </div>
            <div>
              <span className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1">重复</span>
              <select value={form.repeatType} onChange={(e) => setForm((f) => ({ ...f, repeatType: e.target.value as RepeatType }))}
                className="w-full text-sm py-2 bg-transparent border-b-2 border-[var(--color-border-subtle)]/50 focus:border-[var(--color-accent)] outline-none text-[var(--color-text-primary)] transition-colors cursor-pointer">
                {(Object.keys(REPEAT_LABELS) as RepeatType[]).map((r) => (
                  <option key={r} value={r}>{REPEAT_LABELS[r]}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Subtasks */}
          <div>
            <span className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-2">子任务</span>
            {form.subtasks.length > 0 && (
              <ul className="space-y-1.5 mb-3">
                {form.subtasks.map((st) => (
                  <li key={st.id} className="flex items-center gap-2 group">
                    <span onClick={() => toggleFormSubtask(st.id)} className="cursor-pointer flex-shrink-0 flex items-center justify-center transition-all duration-200"
                      style={{ width: 18, height: 18, borderRadius: '50%', border: st.completed ? 'none' : '2px solid var(--color-border-subtle)', background: st.completed ? 'var(--color-accent)' : 'transparent' }}>
                      {st.completed && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg>}
                    </span>
                    <span className={['flex-1 text-sm', st.completed ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'].join(' ')}>{st.title}</span>
                    <button onClick={() => removeFormSubtask(st.id)} className="opacity-0 group-hover:opacity-100 text-red-500 text-xs transition-opacity cursor-pointer">删除</button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input type="text" value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addFormSubtask()}
                placeholder="添加子任务..." className="flex-1 text-sm py-1.5 bg-transparent border-b border-[var(--color-border-subtle)]/40 focus:border-[var(--color-accent)] outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/60 transition-colors" />
              <Button size="sm" variant="ghost" onClick={addFormSubtask} disabled={!newSubtaskTitle.trim()}>添加</Button>
            </div>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ============================================================
// TaskCard sub-component (used in List & Board views)
// ============================================================

interface TaskCardProps {
  task: Task
  expanded: boolean
  confirmDelete: boolean
  compact?: boolean
  onToggleStatus: () => void
  onEdit: () => void
  onDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
  onToggleExpand: () => void
  onToggleSubtask: (sid: string) => void
  accentColor: string
  index: number
}

function TaskCard({
  task, expanded, confirmDelete,
  onToggleStatus, onEdit, onDelete, onConfirmDelete, onCancelDelete,
  onToggleExpand, onToggleSubtask, index,
}: TaskCardProps) {
  const isDone = task.status === 'completed'
  const completedSubs = task.subtasks.filter((s) => s.completed).length
  const totalSubs = task.subtasks.length
  const subProgress = totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0

  return (
    <div
      style={{
        animationDelay: `${index * 50}ms`,
        animationName: 'fadeInUp',
        animationDuration: '0.35s',
        animationTimingFunction: 'ease-out',
        animationFillMode: 'both',
        background: isDone ? 'var(--color-bg-surface-1)' : 'linear-gradient(135deg, #ffffff 0%, #fef8f0 100%)',
        border: '1px solid var(--color-border-subtle)',
        borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: '16px',
        opacity: isDone ? 0.6 : 1,
        transition: 'box-shadow 200ms ease, transform 200ms ease',
      }}
      onMouseEnter={(e) => { if (!isDone) { e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div className="flex items-start gap-3">
        {/* checkbox */}
        <span onClick={onToggleStatus} className="cursor-pointer flex-shrink-0 flex items-center justify-center mt-0.5 transition-all duration-200"
          style={{ width: 22, height: 22, borderRadius: '50%', border: isDone ? 'none' : '2px solid var(--color-border-subtle)', background: isDone ? 'var(--color-accent)' : 'transparent', transform: isDone ? 'scale(1.08)' : 'scale(1)', boxShadow: isDone ? '0 2px 6px rgba(44, 24, 16, 0.12)' : 'none' }}
        >
          {isDone && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg>}
        </span>
        {/* content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={['font-semibold text-[var(--color-text-primary)]', isDone ? 'line-through text-[var(--color-text-muted)]' : ''].join(' ')}>{task.title}</span>
            {task.project && <Badge variant="accent">{task.project}</Badge>}
            {task.repeatType !== 'none' && <Badge variant="warning">{REPEAT_LABELS[task.repeatType]}</Badge>}
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
              P{task.priority}
            </span>
            {totalSubs > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Progress value={subProgress} size="sm" className="w-16" />
                <span className="metric-value">{completedSubs}/{totalSubs}</span>
              </span>
            )}
            <span className="text-xs text-[var(--color-text-muted)]">
              <span className="metric-value">{fmtDuration(task.actualMinutes)}</span>{' / '}{fmtDuration(task.estimatedMinutes)}
            </span>
            {task.dueDate && <span className="text-xs text-[var(--color-text-muted)]">{task.dueDate}</span>}
          </div>
        </div>
        {/* actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {totalSubs > 0 && (
            <button onClick={onToggleExpand} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-2)] transition-all duration-200 cursor-pointer" style={{ borderRadius: 'var(--radius-md)' }} title="展开子任务">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}><path d="M6 4l4 4-4 4" /></svg>
            </button>
          )}
          <button onClick={onEdit} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-200 cursor-pointer" style={{ borderRadius: 'var(--radius-md)' }} title="编辑">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" /></svg>
          </button>
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <Button size="sm" variant="danger" onClick={onConfirmDelete}>确认</Button>
              <Button size="sm" variant="ghost" onClick={onCancelDelete}>取消</Button>
            </span>
          ) : (
            <button onClick={onDelete} className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 cursor-pointer" style={{ borderRadius: 'var(--radius-md)' }} title="删除">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded subtasks */}
      {expanded && totalSubs > 0 && (
        <div className="mt-3 ml-8 pl-4 space-y-2" style={{ borderLeft: '2px solid var(--color-accent-soft)' }}>
          {task.subtasks.map((st, stIdx) => (
            <label key={st.id} className="flex items-center gap-2.5 cursor-pointer py-0.5"
              style={{ animationDelay: `${stIdx * 30}ms`, animationName: 'fadeInUp', animationDuration: '0.25s', animationTimingFunction: 'ease-out', animationFillMode: 'both' }}
            >
              <span onClick={(e) => { e.preventDefault(); onToggleSubtask(st.id) }}
                className="flex-shrink-0 flex items-center justify-center transition-all duration-200"
                style={{ width: 16, height: 16, borderRadius: '50%', border: st.completed ? 'none' : '2px solid var(--color-border-subtle)', background: st.completed ? 'var(--color-accent)' : 'transparent' }}
              >
                {st.completed && <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg>}
              </span>
              <span className={['text-sm transition-colors duration-150', st.completed ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'].join(' ')}>{st.title}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
