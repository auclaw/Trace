import { useState, useEffect, useCallback } from 'react'
import { Card, Modal, Button, Progress, Badge, EmptyState, Input } from '../components/ui'
import { useAppStore } from '../store/useAppStore'
import type { Task, Subtask, TaskStatus, RepeatType } from '../services/dataService'
import useTheme from '../hooks/useTheme'
import { PRIORITY_COLORS } from '../config/themes'

// --- helpers ---

type FilterTab = 'all' | 'pending' | 'in_progress' | 'completed'

const FILTER_LABELS: Record<FilterTab, string> = {
  all: '全部',
  pending: '待办',
  in_progress: '进行中',
  completed: '已完成',
}

// used in the filter-tab counts area if needed in future
// const PRIORITY_LABELS: Record<number, string> = { 1: '最低', 2: '低', 3: '中', 4: '高', 5: '最高' }

const REPEAT_LABELS: Record<RepeatType, string> = {
  none: '不重复',
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayDisplay(): string {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

function fmtDuration(mins: number): string {
  if (mins <= 0) return '0m'
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`
  return `${m}m`
}

// --- blank task form state ---
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
// Component
// ============================================================

export default function Planner() {
  const { accentColor } = useTheme()

  const tasks = useAppStore((s) => s.tasks)
  const loadTasks = useAppStore((s) => s.loadTasks)
  const addTask = useAppStore((s) => s.addTask)
  const updateTask = useAppStore((s) => s.updateTask)
  const deleteTask = useAppStore((s) => s.deleteTask)

  const [filter, setFilter] = useState<FilterTab>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TaskForm>({ ...EMPTY_FORM })
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // --- load tasks on mount ---
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // --- filtered tasks ---
  const filtered = tasks.filter((t) => {
    if (filter === 'all') return true
    return t.status === filter
  })

  // --- open add modal ---
  const openAdd = useCallback(() => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, dueDate: todayStr() })
    setNewSubtaskTitle('')
    setModalOpen(true)
  }, [])

  // --- open edit modal ---
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

  // --- save (add or update) ---
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

  // --- toggle task status ---
  const toggleStatus = useCallback(
    (task: Task) => {
      const next: TaskStatus = task.status === 'completed' ? 'pending' : 'completed'
      updateTask(task.id, { status: next })
    },
    [updateTask]
  )

  // --- delete with confirmation ---
  const handleDelete = useCallback(
    (id: string) => {
      deleteTask(id)
      setConfirmDeleteId(null)
    },
    [deleteTask]
  )

  // --- toggle expand ---
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // --- subtask helpers inside form ---
  const addFormSubtask = useCallback(() => {
    if (!newSubtaskTitle.trim()) return
    setForm((f) => ({
      ...f,
      subtasks: [
        ...f.subtasks,
        { id: crypto.randomUUID(), title: newSubtaskTitle.trim(), completed: false },
      ],
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
    setForm((f) => ({
      ...f,
      subtasks: f.subtasks.filter((s) => s.id !== sid),
    }))
  }, [])

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">今日计划</h1>
        <Button onClick={openAdd}>添加任务</Button>
      </div>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">{todayDisplay()}</p>

      {/* ── Filter Tabs ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(Object.keys(FILTER_LABELS) as FilterTab[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap',
              filter === key
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            ].join(' ')}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      {/* ── Task List ── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title="暂无任务"
          description="点击「添加任务」来规划你的一天"
          action={<Button onClick={openAdd}>添加任务</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              expanded={expandedIds.has(task.id)}
              confirmDelete={confirmDeleteId === task.id}
              onToggleStatus={() => toggleStatus(task)}
              onEdit={() => openEdit(task)}
              onDelete={() => setConfirmDeleteId(task.id)}
              onConfirmDelete={() => handleDelete(task.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onToggleExpand={() => toggleExpand(task.id)}
              onToggleSubtask={(sid) => {
                const st = task.subtasks.map((s) =>
                  s.id === sid ? { ...s, completed: !s.completed } : s
                )
                updateTask(task.id, { subtasks: st })
              }}
              accentColor={accentColor}
            />
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? '编辑任务' : '添加任务'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!form.title.trim()}>
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* title */}
          <Input
            label="任务标题"
            value={form.title}
            onChange={(v) => setForm((f) => ({ ...f, title: v }))}
            placeholder="输入任务名称..."
          />

          {/* priority */}
          <div>
            <span className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-2">
              优先级
            </span>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setForm((f) => ({ ...f, priority: p }))}
                  className={[
                    'w-9 h-9 rounded-full text-xs font-bold transition-all cursor-pointer',
                    form.priority === p
                      ? 'ring-2 ring-offset-2 ring-[var(--color-accent)] scale-110'
                      : 'opacity-60 hover:opacity-100',
                  ].join(' ')}
                  style={{ backgroundColor: PRIORITY_COLORS[p], color: '#fff' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* project + estimated time row */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="项目"
              value={form.project}
              onChange={(v) => setForm((f) => ({ ...f, project: v }))}
              placeholder="例如: 工作"
            />
            <Input
              label="预估时间 (分钟)"
              type="number"
              value={String(form.estimatedMinutes)}
              onChange={(v) =>
                setForm((f) => ({ ...f, estimatedMinutes: Math.max(1, Number(v) || 0) }))
              }
            />
          </div>

          {/* due date + repeat row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1">
                截止日期
              </span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full text-sm py-2 bg-transparent border-b-2 border-[var(--color-border-subtle)]/50 focus:border-[var(--color-accent)] outline-none text-[var(--color-text-primary)] transition-colors"
              />
            </div>
            <div>
              <span className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1">
                重复
              </span>
              <select
                value={form.repeatType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, repeatType: e.target.value as RepeatType }))
                }
                className="w-full text-sm py-2 bg-transparent border-b-2 border-[var(--color-border-subtle)]/50 focus:border-[var(--color-accent)] outline-none text-[var(--color-text-primary)] transition-colors cursor-pointer"
              >
                {(Object.keys(REPEAT_LABELS) as RepeatType[]).map((r) => (
                  <option key={r} value={r}>
                    {REPEAT_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* subtasks */}
          <div>
            <span className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-2">
              子任务
            </span>
            {form.subtasks.length > 0 && (
              <ul className="space-y-1.5 mb-3">
                {form.subtasks.map((st) => (
                  <li key={st.id} className="flex items-center gap-2 group">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => toggleFormSubtask(st.id)}
                      className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
                    />
                    <span
                      className={[
                        'flex-1 text-sm',
                        st.completed
                          ? 'line-through text-[var(--color-text-muted)]'
                          : 'text-[var(--color-text-primary)]',
                      ].join(' ')}
                    >
                      {st.title}
                    </span>
                    <button
                      onClick={() => removeFormSubtask(st.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 text-xs transition-opacity cursor-pointer"
                    >
                      删除
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addFormSubtask()}
                placeholder="添加子任务..."
                className="flex-1 text-sm py-1.5 bg-transparent border-b border-[var(--color-border-subtle)]/40 focus:border-[var(--color-accent)] outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/60 transition-colors"
              />
              <Button size="sm" variant="ghost" onClick={addFormSubtask} disabled={!newSubtaskTitle.trim()}>
                添加
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ============================================================
// TaskCard sub-component
// ============================================================

interface TaskCardProps {
  task: Task
  expanded: boolean
  confirmDelete: boolean
  onToggleStatus: () => void
  onEdit: () => void
  onDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
  onToggleExpand: () => void
  onToggleSubtask: (sid: string) => void
  accentColor: string
}

function TaskCard({
  task,
  expanded,
  confirmDelete,
  onToggleStatus,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onToggleExpand,
  onToggleSubtask,
}: TaskCardProps) {
  const isDone = task.status === 'completed'
  const completedSubs = task.subtasks.filter((s) => s.completed).length
  const totalSubs = task.subtasks.length
  const subProgress = totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0

  return (
    <Card padding="sm" className={isDone ? 'opacity-60' : ''} hover>
      <div className="flex items-start gap-3">
        {/* checkbox */}
        <input
          type="checkbox"
          checked={isDone}
          onChange={onToggleStatus}
          className="mt-1 w-5 h-5 accent-[var(--color-accent)] cursor-pointer flex-shrink-0"
        />

        {/* content */}
        <div className="flex-1 min-w-0">
          {/* title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={[
                'font-semibold text-[var(--color-text-primary)]',
                isDone ? 'line-through text-[var(--color-text-muted)]' : '',
              ].join(' ')}
            >
              {task.title}
            </span>
            {task.project && <Badge variant="accent">{task.project}</Badge>}
            {task.repeatType !== 'none' && (
              <Badge variant="warning">{REPEAT_LABELS[task.repeatType]}</Badge>
            )}
          </div>

          {/* meta row */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {/* priority dot */}
            <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
              />
              P{task.priority}
            </span>

            {/* subtask progress */}
            {totalSubs > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Progress value={subProgress} size="sm" className="w-16" />
                {completedSubs}/{totalSubs}
              </span>
            )}

            {/* time */}
            <span className="text-xs text-[var(--color-text-muted)]">
              {fmtDuration(task.actualMinutes)} / {fmtDuration(task.estimatedMinutes)}
            </span>

            {/* due date */}
            {task.dueDate && (
              <span className="text-xs text-[var(--color-text-muted)]">{task.dueDate}</span>
            )}
          </div>
        </div>

        {/* actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {totalSubs > 0 && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-2)] transition-colors cursor-pointer"
              title="展开子任务"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
              >
                <path d="M6 4l4 4-4 4" />
              </svg>
            </button>
          )}
          {/* edit */}
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-colors cursor-pointer"
            title="编辑"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" />
            </svg>
          </button>
          {/* delete */}
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <Button size="sm" variant="danger" onClick={onConfirmDelete}>
                确认
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelDelete}>
                取消
              </Button>
            </span>
          ) : (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="删除"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* expanded subtasks */}
      {expanded && totalSubs > 0 && (
        <div className="mt-3 ml-8 pl-3 border-l-2 border-[var(--color-border-subtle)]/40 space-y-1.5">
          {task.subtasks.map((st) => (
            <label key={st.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={st.completed}
                onChange={() => onToggleSubtask(st.id)}
                className="w-4 h-4 accent-[var(--color-accent)]"
              />
              <span
                className={[
                  'text-sm',
                  st.completed
                    ? 'line-through text-[var(--color-text-muted)]'
                    : 'text-[var(--color-text-primary)]',
                ].join(' ')}
              >
                {st.title}
              </span>
            </label>
          ))}
        </div>
      )}
    </Card>
  )
}
