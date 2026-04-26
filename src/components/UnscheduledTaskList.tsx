import { useState } from 'react'
import { ChevronRight, GripVertical, Pencil, Trash2, Clock, Calendar, Play } from 'lucide-react'
import type { Task } from '../services/dataService'
import { formatDateShort } from '../constants/task'

interface UnscheduledTaskListProps {
  tasks: Task[]
  onTaskDragStart?: (e: React.DragEvent, task: Task) => void
  onTaskClick?: (task: Task) => void
  onStartFocus?: (task: Task) => void
  onEditTask?: (task: Task) => void
  onDeleteTask?: (task: Task) => void
  className?: string
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'var(--color-text-muted)',
  2: 'var(--color-blue)',
  3: 'var(--color-lemon)',
  4: 'var(--color-coral)',
  5: '#FF5252',
}

const PRIORITY_LABELS: Record<number, string> = {
  1: '低',
  2: '中',
  3: '高',
  4: '紧急',
  5: '非常紧急',
}

export default function UnscheduledTaskList({
  tasks,
  onTaskDragStart,
  onTaskClick,
  onStartFocus,
  onEditTask,
  onDeleteTask,
  className = '',
}: UnscheduledTaskListProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  const unscheduledTasks = tasks.filter(t => t.status !== 'completed' && !t.scheduledStartTime)
  const count = unscheduledTasks.length

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
    onTaskDragStart?.(e, task)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all ${className}`}
      style={{
        background: 'var(--color-bg-surface-1)',
        border: '2px solid var(--color-border-strong)',
        boxShadow: '4px 4px 0px var(--color-border-strong)',
        opacity: isDragging ? 0.8 : 1,
      }}
    >
      {/* 头部 - 点击可折叠 */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer transition-all hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            待安排任务
          </h3>
          {count > 0 && (
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
              style={{ background: 'var(--color-blue)20', color: '#0284C7' }}
            >
              {count}
            </span>
          )}
        </div>
        <ChevronRight
          size={18}
          style={{
            color: 'var(--color-text-muted)',
            transform: isExpanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        />
      </div>

      {/* 可折叠内容区 */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {count > 0 ? (
            <>
              <p className="text-xs mb-3 text-center py-2 rounded-lg" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                💡 拖拽任务到时间线安排时间
              </p>
              <div className="space-y-2">
                {unscheduledTasks.map(task => (
                  <div
                    key={task.id}
                    data-testid="unscheduled-task"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    className="p-3 rounded-xl flex items-start gap-2 transition-all hover:shadow-md cursor-grab active:cursor-grabbing group"
                    style={{ background: '#FAF8F5', border: '2px dashed var(--color-border-strong)' }}
                    onClick={() => onTaskClick?.(task)}
                  >
                    {/* 拖拽手柄 - 垂直居中 */}
                    <div className="pt-0.5">
                      <GripVertical size={14} style={{ color: 'var(--color-border-strong)', flexShrink: 0 }} />
                    </div>

                    {/* 优先级圆点 - 垂直居中 */}
                    <div className="pt-0.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[1],
                          boxShadow: `0 0 0 3px ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[1]}20`,
                        }}
                        title={`优先级: ${PRIORITY_LABELS[task.priority] || '普通'}`}
                      />
                    </div>

                    {/* 内容区域 - 更大宽度 */}
                    <div className="flex-1 min-w-0 pr-1">
                      <p data-testid="task-title" className="text-sm font-medium truncate leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {task.dueDate && (
                          <span className="text-xs flex items-center gap-0.5 whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                            <Calendar size={10} />
                            {formatDateShort(task.dueDate)}
                          </span>
                        )}
                        {task.estimatedMinutes && (
                          <span className="text-xs flex items-center gap-0.5 whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                            <Clock size={10} />
                            {task.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                      {task.firstStep && (
                        <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-blue)' }}>
                          ① {task.firstStep}
                        </p>
                      )}
                    </div>

                    {/* 操作按钮 - 优化尺寸和间距 */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {onStartFocus && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onStartFocus(task)
                          }}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{ background: '#34D39920' }}
                          title="开始专注"
                        >
                          <Play size={14} style={{ color: '#059669' }} />
                        </button>
                      )}
                      {onEditTask && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditTask(task)
                          }}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{ background: 'var(--color-blue)20' }}
                          title="编辑任务"
                        >
                          <Pencil size={14} style={{ color: '#0284C7' }} />
                        </button>
                      )}
                      {onDeleteTask && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteTask(task)
                          }}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{ background: '#F8717120' }}
                          title="删除任务"
                        >
                          <Trash2 size={14} style={{ color: '#DC2626' }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8" style={{ background: '#FAF8F5', borderRadius: '12px' }}>
              <p className="text-2xl mb-2">✨</p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                所有任务都已安排
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                去任务页面添加更多任务吧
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
