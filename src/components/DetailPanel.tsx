import { useState, useEffect } from 'react'
import { X, Save, Trash2, Plus } from 'lucide-react'
import type { TimeBlock, Task, TaskStatus } from '../services/dataService'
import { useAppStore } from '../store/useAppStore'
import { useToast } from './ui/Toast'
import { PRIORITY_CONFIG, PRIORITY_LABELS, formatDateFull } from '../constants/task'

type PanelData = TimeBlock | Task

interface DetailPanelProps {
  data: PanelData | null
  mode: 'add' | 'edit'
  defaultDate?: string
  onClose: () => void
  onSave?: (updated: any) => void
  onDelete?: () => void
}

const STATUSES = ['todo', 'in_progress', 'paused', 'completed', 'archived'] as const
const STATUS_LABELS: Record<string, string> = {
  'todo': '📝 待办',
  'in_progress': '⏳ 进行中',
  'paused': '⏸️ 已暂停',
  'completed': '✅ 已完成',
  'archived': '📦 已归档',
}
const START_HOUR = 0
const END_HOUR = 24

export default function DetailPanel({ data, mode, defaultDate, onClose, onSave, onDelete }: DetailPanelProps) {
  const categories = useAppStore((s) => s.categories)
  const tasks = useAppStore((s) => s.tasks)
  const { toast } = useToast()

  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [startHour, setStartHour] = useState(9)
  const [startMinute, setStartMinute] = useState(0)
  const [endHour, setEndHour] = useState(10)
  const [endMinute, setEndMinute] = useState(0)
  const [taskStartTime, setTaskStartTime] = useState('')
  const [priority, setPriority] = useState<number>(3)
  const [status, setStatus] = useState('todo')
  const [description, setDescription] = useState('')
  const [taskId, setTaskId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState(30)
  const [firstStep, setFirstStep] = useState('')
  const [emotionalTag, setEmotionalTag] = useState<'' | 'easy' | 'neutral' | 'resist'>('')

  const isTimeBlock = (d: PanelData): d is TimeBlock => 'category' in d
  const isTask = (d: PanelData): d is Task => 'project' in d

  useEffect(() => {
    if (data && mode === 'edit') {
      setTitle(data.title || '')

      if (isTimeBlock(data)) {
        setCategoryId((data as any).categoryId || data.category || '')
        const startStr = data.startTime?.slice(11, 16) || '09:00'
        const endStr = data.endTime?.slice(11, 16) || '10:00'
        const [sh, sm] = startStr.split(':').map(Number)
        const [eh, em] = endStr.split(':').map(Number)
        setStartHour(sh)
        setStartMinute(sm)
        setEndHour(eh)
        setEndMinute(em)
        // Convert string priority (e.g., 'P1', 'P2') to number
        const rawPriority = (data as any).priority
        const numPriority = typeof rawPriority === 'string'
          ? Math.max(1, Math.min(5, parseInt(rawPriority.replace('P', '')) || 3))
          : Math.max(1, Math.min(5, rawPriority || 3))
        setPriority(numPriority)
        setStatus((data as any).status || 'todo')
        setDescription((data as any).description || '')
        setTaskId((data as any).taskId || '')
      } else if (isTask(data)) {
        setCategoryId((data as any).categoryId || '')
        setTaskStartTime(data.scheduledStartTime?.slice(11, 16) || '')
        setPriority(data.priority || 3)
        // Convert old status values to new system for backward compatibility
        const rawStatus = String(data.status || 'todo')
        const convertedStatus = rawStatus === 'pending' ? 'todo' : (rawStatus as TaskStatus)
        setStatus(convertedStatus)
        setDescription((data as any).description || '')
        setTaskId(data.id)
        setDueDate(formatDateFull(data.dueDate))
        setEstimatedMinutes(data.estimatedMinutes || 30)
        setFirstStep(data.firstStep || '')
        setEmotionalTag((data.emotionalTag as any) || '')
      }
    } else if (mode === 'add') {
      setTitle('')
      setCategoryId('')
      setStartHour(9)
      setStartMinute(0)
      setEndHour(10)
      setEndMinute(0)
      setTaskStartTime('')
      setPriority(3)
      setStatus('todo')
      setDescription('')
      setTaskId('')
      setDueDate('')
      setEstimatedMinutes(30)
      setFirstStep('')
      setEmotionalTag('')
    }
  }, [data, mode])

  if (!data && mode === 'edit') return null

  // 添加模式默认为时间块，编辑模式根据数据判断
  const isBlockMode = mode === 'add' ? true : data ? isTimeBlock(data) : true

  const handleSave = () => {
    if (!title.trim()) {
      toast('请输入标题', 'warning')
      return
    }

    const dateStr = defaultDate || new Date().toISOString().slice(0, 10)

    if (isBlockMode) {
      const startTimeStr = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`
      const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
      const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
      const newBlock: TimeBlock = {
        id: data?.id || `temp-${Date.now()}`,
        title: title.trim(),
        startTime: `${dateStr}T${startTimeStr}:00`,
        endTime: `${dateStr}T${endTimeStr}:00`,
        durationMinutes,
        category: categories.find(c => c.id === categoryId)?.name as any || '其他',
        date: dateStr,
        completed: false,
        source: 'manual',
        categoryId: categoryId || undefined,
        status: 'pending' as const,
        description: description || undefined,
        taskId: taskId || undefined,
      }
      onSave?.(newBlock)
    } else if (data && isTask(data)) {
      const updatedTask: any = {
        ...data,
        title: title.trim(),
        categoryId: categoryId || undefined,
        priority,
        status,
        description: description || undefined,
        dueDate: dueDate || undefined,
        estimatedMinutes,
        firstStep: firstStep || undefined,
        emotionalTag: emotionalTag || undefined,
      }
      if (taskStartTime) {
        updatedTask.scheduledStartTime = `${dateStr}T${taskStartTime}:00`
        updatedTask.scheduledDate = dateStr
      }
      onSave?.(updatedTask)
    }
  }

  const getPriorityColor = (p: number) => {
    const config = PRIORITY_CONFIG[p] || PRIORITY_CONFIG[3]
    return { bg: `${config.bg}80`, text: config.text, border: config.border }
  }

  const panelTitle = mode === 'add' ? '添加活动' : (isBlockMode ? '编辑' : '任务详情')
  const durationMinutes = isBlockMode
    ? (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
    : 0

  return (
    <div
      data-testid="task-detail-panel"
      className="rounded-2xl p-5 mx-4 w-full max-w-md"
      style={{
        background: 'var(--color-bg-surface-1)',
        border: '2px solid var(--color-border-strong)',
        boxShadow: '8px 8px 0px rgba(0,0,0,0.15)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
          {panelTitle}
        </h3>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors focus-ring"
          aria-label="关闭详情面板"
        >
          <X size={18} style={{ color: 'var(--color-text-muted)' }} aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm mb-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>标题</label>
          <input
            data-testid="task-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="任务标题"
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
            style={{ background: '#FAF8F5', border: '2px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm mb-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>分类</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all cursor-pointer"
            style={{ background: '#FAF8F5', border: '2px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
          >
            <option value="">不分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {isBlockMode ? (
          <>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm mb-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>开始时间</label>
                <div className="flex gap-2">
                  <select
                    value={startHour}
                    onChange={(e) => {
                      const hour = parseInt(e.target.value)
                      const newStart = hour + startMinute / 60
                      const newEnd = endHour + endMinute / 60
                      setStartHour(hour)
                      if (newStart >= newEnd) {
                        setEndHour(Math.min(hour + 1, END_HOUR))
                        setEndMinute(0)
                      }
                    }}
                    className="flex-1 px-3 py-3 rounded-xl text-sm focus:outline-none transition-all cursor-pointer"
                    style={{ background: '#FAF8F5', border: '2px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
                  >
                    {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i).map(h => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span className="flex items-center justify-center text-lg font-medium" style={{ color: 'var(--color-text-muted)' }}>:</span>
                  <select
                    value={startMinute}
                    onChange={(e) => {
                      const minutes = parseInt(e.target.value)
                      const newStart = startHour + minutes / 60
                      const newEnd = endHour + endMinute / 60
                      setStartMinute(minutes)
                      if (newStart >= newEnd) {
                        const newEndMinutes = minutes + 30
                        if (newEndMinutes >= 60) {
                          setEndHour(Math.min(startHour + 1, END_HOUR))
                          setEndMinute(newEndMinutes - 60)
                        } else {
                          setEndHour(startHour)
                          setEndMinute(newEndMinutes)
                        }
                      }
                    }}
                    className="flex-1 px-3 py-3 rounded-xl text-sm focus:outline-none transition-all cursor-pointer"
                    style={{ background: '#FAF8F5', border: '2px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
                  >
                    {[0, 15, 30, 45].map(m => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm mb-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>结束时间</label>
                <div className="flex gap-2">
                  <select
                    value={endHour}
                    onChange={(e) => {
                      const hour = parseInt(e.target.value)
                      const newStart = startHour + startMinute / 60
                      const newEnd = hour + endMinute / 60
                      setEndHour(hour)
                      if (newStart >= newEnd) {
                        setStartHour(Math.max(hour - 1, START_HOUR))
                        setStartMinute(0)
                      }
                    }}
                    className="flex-1 px-3 py-3 rounded-xl text-sm focus:outline-none transition-all cursor-pointer"
                    style={{ background: '#FAF8F5', border: '2px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
                  >
                    {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i).map(h => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span className="flex items-center justify-center text-lg font-medium" style={{ color: 'var(--color-text-muted)' }}>:</span>
                  <select
                    value={endMinute}
                    onChange={(e) => {
                      const minutes = parseInt(e.target.value)
                      const newStart = startHour + startMinute / 60
                      const newEnd = endHour + minutes / 60
                      setEndMinute(minutes)
                      if (newStart >= newEnd) {
                        const newStartMinutes = minutes - 30
                        if (newStartMinutes < 0) {
                          setStartHour(Math.max(endHour - 1, START_HOUR))
                          setStartMinute(newStartMinutes + 60)
                        } else {
                          setStartHour(endHour)
                          setStartMinute(newStartMinutes)
                        }
                      }
                    }}
                    className="flex-1 px-3 py-3 rounded-xl text-sm focus:outline-none transition-all cursor-pointer"
                    style={{ background: '#FAF8F5', border: '2px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
                  >
                    {[0, 15, 30, 45].map(m => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="text-center py-3 rounded-xl" style={{ background: '#FAF8F5' }}>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>时长：</span>
              <span className="text-lg font-semibold" style={{ color: 'var(--color-blue)' }}>
                {durationMinutes} 分钟
              </span>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm mb-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>计划时间</label>
              <input
                type="time"
                value={taskStartTime}
                onChange={(e) => setTaskStartTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: '#FAF8F5', border: '2px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
              />
            </div>

            <div>
              <label className="block text-sm mb-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>优先级</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((p) => {
                  const colors = getPriorityColor(p)
                  const isSelected = priority === p
                  return (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className="flex-1 px-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: isSelected ? colors.bg : '#FAF8F5',
                        color: isSelected ? colors.text : 'var(--color-text-muted)',
                        border: isSelected ? `2px solid ${colors.border}` : '2px solid var(--color-border-light)',
                      }}
                    >
                      {PRIORITY_LABELS[p]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>截止日期</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: '#FAF8F5', border: '2px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
              />
            </div>

            <div>
              <label className="block text-sm mb-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>预计时长</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Math.max(5, Math.min(480, parseInt(e.target.value) || 0)))}
                  className="flex-1 px-4 py-3 rounded-xl text-sm"
                  style={{ background: '#FAF8F5', border: '2px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
                  min={5}
                  max={480}
                />
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>分钟</span>
              </div>
              <div className="flex gap-2">
                {[25, 50, 90].map((m) => (
                  <button
                    key={m}
                    onClick={() => setEstimatedMinutes(m)}
                    className="flex-1 px-2 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: estimatedMinutes === m ? 'var(--color-blue)' : '#FAF8F5',
                      color: estimatedMinutes === m ? 'white' : 'var(--color-text-secondary)',
                      border: estimatedMinutes === m ? '2px solid var(--color-blue-hover)' : '2px solid transparent',
                    }}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>第一步</label>
              <input
                type="text"
                value={firstStep}
                onChange={(e) => setFirstStep(e.target.value)}
                placeholder="例如: 撰写需求文档 (选填)"
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: '#FAF8F5', border: '2px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
              />
            </div>

            <div>
              <label className="block text-sm mb-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>做这件事的感觉</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setEmotionalTag(emotionalTag === 'easy' ? '' : 'easy')}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: emotionalTag === 'easy' ? 'var(--color-green)30' : '#FAF8F5',
                    color: emotionalTag === 'easy' ? '#2D5A4A' : 'var(--color-text-secondary)',
                    border: emotionalTag === 'easy' ? '2px solid var(--color-green)' : '2px solid var(--color-border-light)',
                  }}
                >
                  😊 轻松
                </button>
                <button
                  onClick={() => setEmotionalTag(emotionalTag === 'neutral' ? '' : 'neutral')}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: emotionalTag === 'neutral' ? 'var(--color-lemon)30' : '#FAF8F5',
                    color: emotionalTag === 'neutral' ? '#B8860B' : 'var(--color-text-secondary)',
                    border: emotionalTag === 'neutral' ? '2px solid var(--color-lemon)' : '2px solid var(--color-border-light)',
                  }}
                >
                  😐 一般
                </button>
                <button
                  onClick={() => setEmotionalTag(emotionalTag === 'resist' ? '' : 'resist')}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: emotionalTag === 'resist' ? 'var(--color-coral)30' : '#FAF8F5',
                    color: emotionalTag === 'resist' ? '#8B0000' : 'var(--color-text-secondary)',
                    border: emotionalTag === 'resist' ? '2px solid var(--color-coral)' : '2px solid var(--color-border-light)',
                  }}
                >
                  😰 困难
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>状态</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all cursor-pointer"
                style={{ background: '#FAF8F5', border: '2px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm mb-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>备注</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="添加备注..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all resize-none"
            style={{ background: '#FAF8F5', border: '2px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
          />
        </div>

        {isBlockMode && (
          <div>
            <label className="block text-sm mb-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>关联任务</label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all cursor-pointer"
              style={{ background: '#FAF8F5', border: '2px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
            >
              <option value="">不关联任务</option>
              {tasks.filter(t => t.status !== 'completed').map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 px-4 py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-blue)' }}
          >
            {mode === 'add' ? <Plus size={16} /> : <Save size={16} />}
            {mode === 'add' ? '添加' : '保存'}
          </button>
          {mode === 'edit' && onDelete && (
            <button
              data-testid="task-delete"
              onClick={onDelete}
              className="px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
              style={{ background: '#DC2626' }}
            >
              <Trash2 size={16} />
              删除
            </button>
          )}
          {mode === 'add' && (
            <button
              onClick={onClose}
              className="px-6 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: '#FAF8F5', color: 'var(--color-text-secondary)', border: '2px solid var(--color-border-light)' }}
            >
              取消
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
