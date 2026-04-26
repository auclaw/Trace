import TaskCard from './TaskCard'
import type { Task } from '../../services/dataService'

interface TaskListProps {
  title: string
  tasks: Task[]
  maxItems?: number
  onTaskClick?: (task: Task) => void
  onAddNew?: () => void
}

export default function TaskList({
  title,
  tasks,
  maxItems = 5,
  onTaskClick,
  onAddNew,
}: TaskListProps) {
  const displayTasks = tasks.slice(0, maxItems)

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: '#FFFFFF',
        border: '2px solid #D6D3CD',
        boxShadow: '4px 4px 0px #D6D3CD',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: '#3A3638' }}>
          {title}
        </h3>
        {onAddNew && (
          <span
            className="text-xs font-semibold cursor-pointer transition-all hover:opacity-80"
            style={{ color: '#79BEEB' }}
            onClick={onAddNew}
          >
            + ADD NEW
          </span>
        )}
      </div>
      <div className="space-y-2">
        {displayTasks.length > 0 ? (
          displayTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              priority={task.priority && task.priority >= 4 ? 'high' : 'normal'}
              onClick={() => onTaskClick?.(task)}
            />
          ))
        ) : (
          <div className="text-center py-6">
            <p className="text-xs" style={{ color: '#9E9899' }}>暂无任务 🎉</p>
          </div>
        )}
      </div>
    </div>
  )
}
