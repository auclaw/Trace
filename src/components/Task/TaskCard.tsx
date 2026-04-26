import { useState } from 'react'
import { Play, Pause, Clock, Flag, CheckSquare, Square } from 'lucide-react'
import type { Task, TaskStatus } from '../../services/dataService'
import { getPriorityConfig, getStatusConfig, EMOTIONAL_EMOJIS, SHADOWS, RADII, ANIMATIONS } from '../../constants/task'

interface TaskCardProps {
  task: Task
  selected?: boolean
  onSelect?: () => void
  onClick?: () => void
  onStartTimer?: () => void
  onStatusChange?: (status: TaskStatus) => void
}

export default function TaskCard({
  task,
  selected = false,
  onSelect,
  onClick,
  onStartTimer,
  onStatusChange,
}: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const statusConfig = getStatusConfig(task.status)
  const priorityConfig = getPriorityConfig(task.priority)

  const progress = task.estimatedMinutes > 0
    ? Math.min(100, Math.round(((task.timeLoggedMinutes || task.actualMinutes || 0) / task.estimatedMinutes) * 100))
    : 0

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.()
  }

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed'
    onStatusChange?.(newStatus)
  }

  const handleStartTimer = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStartTimer?.()
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.()
  }

  return (
    <div
      className={`p-4 cursor-pointer ${selected ? 'ring-2 ring-offset-2' : ''}`}
      style={{
        borderRadius: RADII.lg,
        background: '#FFFFFF',
        border: `2px solid ${selected ? '#79BEEB' : isHovered ? '#C8C5C0' : '#E8E6E1'}`,
        boxShadow: isHovered ? SHADOWS.card : SHADOWS.cardSmall,
        opacity: task.status === 'archived' ? 0.6 : 1,
        transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
        transition: `all ${ANIMATIONS.normal}`,
        '--tw-ring-color': '#79BEEB',
        '--tw-ring-offset-color': '#FAF8F5',
      } as React.CSSProperties}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox for multi-select */}
        <button
          onClick={handleCheckboxClick}
          className="mt-0.5 transition-all duration-200 hover:scale-110"
        >
          {selected ? (
            <CheckSquare size={20} style={{ color: '#79BEEB' }} />
          ) : (
            <Square size={20} style={{ color: '#D6D3CD' }} />
          )}
        </button>

        {/* Status indicator & completion checkbox */}
        <button
          onClick={handleToggleComplete}
          className="mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
          style={{
            background: task.status === 'completed' ? statusConfig.bg : '#FAF8F5',
            border: `2px solid ${task.status === 'completed' ? statusConfig.border : '#E8E6E1'}`,
          }}
        >
          {task.status === 'completed' && (
            <span style={{ color: statusConfig.text }}>✓</span>
          )}
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className="text-sm font-semibold line-clamp-2"
              style={{
                color: '#3A3638',
                textDecoration: task.status === 'completed' ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </h3>

            {/* Status badge */}
            <span
              className="px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap"
              style={{
                background: statusConfig.bg,
                color: statusConfig.text,
                border: `1px solid ${statusConfig.border}`,
              }}
            >
              {statusConfig.label}
            </span>
          </div>

          {/* First step hint */}
          {task.firstStep && task.status !== 'completed' && (
            <p className="text-xs mt-1.5 truncate" style={{ color: '#79BEEB' }}>
              第一步: {task.firstStep}
            </p>
          )}

          {/* Meta info row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Priority */}
            <span
              className="px-2 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1"
              style={{
                background: priorityConfig.bg,
                color: priorityConfig.text,
              }}
            >
              <Flag size={10} />
              {task.priority}
            </span>

            {/* Emotional tag */}
            {task.emotionalTag && (
              <span className="text-xs" title={task.emotionalTag}>
                {EMOTIONAL_EMOJIS[task.emotionalTag]}
              </span>
            )}

            {/* Due date */}
            {task.dueDate && (
              <span className="text-xs flex items-center gap-1" style={{ color: '#9E9899' }}>
                <Clock size={10} />
                {task.dueDate}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {task.status !== 'completed' && (task.timeLoggedMinutes || task.actualMinutes) > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: '#9E9899' }}>
                  已记录: {task.timeLoggedMinutes || task.actualMinutes} 分钟
                </span>
                <span className="text-xs font-medium" style={{ color: '#79BEEB' }}>
                  {progress}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: '#F3F4F6' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, progress)}%`,
                    background: progress >= 100 ? '#34D399' : '#79BEEB',
                  }}
                />
              </div>
            </div>
          )}

          {/* Estimated time */}
          {task.estimatedMinutes > 0 && task.status !== 'completed' && !(task.timeLoggedMinutes || task.actualMinutes) && (
            <div className="mt-2 flex items-center gap-1">
              <Clock size={12} style={{ color: '#9E9899' }} />
              <span className="text-xs" style={{ color: '#9E9899' }}>
                预计: {task.estimatedMinutes} 分钟
              </span>
            </div>
          )}
        </div>

        {/* Action buttons - show on hover */}
        <div
          className={`flex flex-col gap-1.5 transition-all duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {task.status !== 'completed' && (
            <button
              onClick={handleStartTimer}
              className="p-2 rounded-lg transition-all hover:scale-105"
              style={{ background: '#79BEEB20' }}
              title="开始计时"
            >
              {task.status === 'in_progress' ? (
                <Pause size={16} style={{ color: '#1D4ED8' }} />
              ) : (
                <Play size={16} style={{ color: '#0369A1' }} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
