import type { Task } from '../../services/dataService'

interface TaskCardProps {
  task: Task
  priority?: 'high' | 'normal'
  onClick?: () => void
}

export default function TaskCard({ task, priority = 'normal', onClick }: TaskCardProps) {
  return (
    <div
      className="p-3 rounded-xl flex items-center gap-3 transition-all hover:bg-gray-50 cursor-pointer"
      style={{ background: '#FAF8F5', border: '1px solid var(--color-border-light)' }}
      onClick={onClick}
    >
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: priority === 'high' ? '#F87171' : 'var(--color-text-muted)' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
          {task.title}
        </p>
        {task.dueDate && (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Due {task.dueDate}
          </p>
        )}
      </div>
    </div>
  )
}
