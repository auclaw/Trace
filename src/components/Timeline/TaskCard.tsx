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
      style={{ background: '#FAF8F5', border: '1px solid #E8E6E1' }}
      onClick={onClick}
    >
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: priority === 'high' ? '#F87171' : '#9E9899' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#3A3638' }}>
          {task.title}
        </p>
        {task.dueDate && (
          <p className="text-xs" style={{ color: '#9E9899' }}>
            Due {task.dueDate}
          </p>
        )}
      </div>
    </div>
  )
}
