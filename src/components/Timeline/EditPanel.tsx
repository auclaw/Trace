import { X, Save, Plus, Trash2 } from 'lucide-react'
import type { TimeBlock, ActivityCategory, Task } from '../../services/dataService'

const CATEGORY_LIST: ActivityCategory[] = [
  '开发', '工作', '会议', '休息', '学习', '娱乐', '运动', '阅读', '其他'
]

interface EditPanelProps {
  isAdding: boolean
  newTitle: string
  newCategory: ActivityCategory
  newStartHour: number
  newEndHour: number
  newDate: Date
  selectedBlock: TimeBlock | null
  editTitle: string
  editCategory: ActivityCategory
  editStartTime: string
  editEndTime: string
  tasks: Task[]
  editTaskId: string
  onTitleChange: (title: string) => void
  onCategoryChange: (category: ActivityCategory) => void
  onStartHourChange: (hour: number) => void
  onEndHourChange: (hour: number) => void
  onDateChange: (date: Date) => void
  onEditTitleChange: (title: string) => void
  onEditCategoryChange: (category: ActivityCategory) => void
  onEditStartTimeChange: (time: string) => void
  onEditEndTimeChange: (time: string) => void
  onEditTaskIdChange: (taskId: string) => void
  onSave: () => void
  onDelete: () => void
  onClose: () => void
}

export default function EditPanel({
  isAdding,
  newTitle,
  newCategory,
  newStartHour,
  newEndHour,
  newDate,
  selectedBlock,
  editTitle,
  editCategory,
  editStartTime,
  editEndTime,
  tasks,
  editTaskId,
  onTitleChange,
  onCategoryChange,
  onStartHourChange,
  onEndHourChange,
  onDateChange,
  onEditTitleChange,
  onEditCategoryChange,
  onEditStartTimeChange,
  onEditEndTimeChange,
  onEditTaskIdChange,
  onSave,
  onDelete,
  onClose,
}: EditPanelProps) {
  const formatDateYMD = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  if (!isAdding && !selectedBlock) return null

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--color-bg-surface-1)',
        border: '2px solid var(--color-border-strong)',
        boxShadow: '4px 4px 0px var(--color-border-strong)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {isAdding ? '添加事件' : '事件详情'}
        </h3>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <X size={16} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>

      {isAdding ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>日期</label>
            <input
              type="date"
              value={formatDateYMD(newDate)}
              onChange={(e) => onDateChange(new Date(e.target.value))}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              style={{ background: 'var(--color-bg-surface-3)', border: '2px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>标题</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="输入活动标题..."
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              style={{ background: 'var(--color-bg-surface-3)', border: '2px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>分类</label>
            <select
              value={newCategory}
              onChange={(e) => onCategoryChange(e.target.value as ActivityCategory)}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              style={{ background: 'var(--color-bg-surface-3)', border: '2px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}
            >
              {CATEGORY_LIST.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>开始</label>
              <input
                type="range"
                min={0}
                max={23.5}
                step={0.5}
                value={newStartHour}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  onStartHourChange(val)
                  if (val >= newEndHour) onEndHourChange(Math.min(val + 0.5, 24))
                }}
                className="w-full"
              />
              <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                {String(Math.floor(newStartHour)).padStart(2, '0')}:
                {String(Math.round((newStartHour % 1) * 60)).padStart(2, '0')}
              </p>
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>结束</label>
              <input
                type="range"
                min={0.5}
                max={24}
                step={0.5}
                value={newEndHour}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  onEndHourChange(val)
                  if (val <= newStartHour) onStartHourChange(Math.max(val - 0.5, 0))
                }}
                className="w-full"
              />
              <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                {String(Math.floor(newEndHour)).padStart(2, '0')}:
                {String(Math.round((newEndHour % 1) * 60)).padStart(2, '0')}
              </p>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={onSave}
              disabled={!newTitle.trim()}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 flex items-center justify-center gap-1 disabled:opacity-50"
              style={{ background: 'var(--color-blue)' }}
            >
              <Plus size={14} />
              添加
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{ background: 'var(--color-bg-surface-3)', color: 'var(--color-text-secondary)', border: '2px solid var(--color-border-strong)' }}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>标题</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              style={{ background: 'var(--color-bg-surface-3)', border: '2px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>分类</label>
            <select
              value={editCategory}
              onChange={(e) => onEditCategoryChange(e.target.value as ActivityCategory)}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              style={{ background: 'var(--color-bg-surface-3)', border: '2px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}
            >
              {CATEGORY_LIST.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>开始</label>
              <input
                type="time"
                value={editStartTime}
                onChange={(e) => onEditStartTimeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                style={{ background: 'var(--color-bg-surface-3)', border: '2px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>结束</label>
              <input
                type="time"
                value={editEndTime}
                onChange={(e) => onEditEndTimeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                style={{ background: 'var(--color-bg-surface-3)', border: '2px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>关联任务</label>
            <select
              value={editTaskId}
              onChange={(e) => onEditTaskIdChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              style={{ background: 'var(--color-bg-surface-3)', border: '2px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}
            >
              <option value="">不关联任务</option>
              {tasks.filter(t => t.status !== 'completed').map(task => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            💡 拖拽事件的上下边缘调整时长，拖拽中间移动位置
          </p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={onSave}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 flex items-center justify-center gap-1"
              style={{ background: 'var(--color-blue)' }}
            >
              <Save size={14} />
              保存
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-red-100 flex items-center justify-center gap-1"
              style={{ background: '#FEE2E2', color: '#DC2626' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
