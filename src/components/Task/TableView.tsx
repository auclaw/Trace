import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Play, Clock, Trash2 } from 'lucide-react'
import InlineEdit from './InlineEdit'
import type { Task, TaskStatus } from '../../services/dataService'

type SortField = 'title' | 'status' | 'priority' | 'dueDate' | 'estimatedMinutes'
type SortDirection = 'asc' | 'desc'

interface TableViewProps {
  tasks: Task[]
  onUpdateTask: (id: string, updates: Partial<Task>) => void
  onStartTimer: (task: Task) => void
  onDeleteTask: (id: string) => void
  onTaskClick: (task: Task) => void
  selectedTasks: Set<string>
  onTaskSelect: (id: string) => void
}

export default function TableView({
  tasks,
  onUpdateTask,
  onStartTimer,
  onDeleteTask,
  onTaskClick,
  selectedTasks,
  onTaskSelect,
}: TableViewProps) {
  const [sortField, setSortField] = useState<SortField>('dueDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedTasks = useMemo(() => {
    const sorted = [...tasks]
    sorted.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'priority':
          comparison = b.priority - a.priority
          break
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          comparison = a.dueDate.localeCompare(b.dueDate)
          break
        case 'estimatedMinutes':
          comparison = a.estimatedMinutes - b.estimatedMinutes
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [tasks, sortField, sortDirection])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return null
    }
    return sortDirection === 'asc' ? (
      <ChevronUp size={14} style={{ color: 'var(--color-blue)' }} />
    ) : (
      <ChevronDown size={14} style={{ color: 'var(--color-blue)' }} />
    )
  }

  if (tasks.length === 0) {
    return (
      <div
        className="p-12 text-center rounded-xl"
        style={{ background: 'var(--color-bg-surface-1)', border: '2px dashed var(--color-border-light)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          暂无任务
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ background: 'var(--color-bg-surface-1)' }}>
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th
              className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              style={{
                background: '#FAF8F5',
                color: 'var(--color-text-secondary)',
                borderBottom: '2px solid var(--color-border-light)',
                minWidth: '40px',
              }}
            >
              #
            </th>
            <th
              className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              style={{
                background: '#FAF8F5',
                color: 'var(--color-text-secondary)',
                borderBottom: '2px solid var(--color-border-light)',
                minWidth: '300px',
              }}
              onClick={() => handleSort('title')}
            >
              <div className="flex items-center gap-1">
                标题
                <SortIcon field="title" />
              </div>
            </th>
            <th
              className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              style={{
                background: '#FAF8F5',
                color: 'var(--color-text-secondary)',
                borderBottom: '2px solid var(--color-border-light)',
                minWidth: '100px',
              }}
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-1">
                状态
                <SortIcon field="status" />
              </div>
            </th>
            <th
              className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              style={{
                background: '#FAF8F5',
                color: 'var(--color-text-secondary)',
                borderBottom: '2px solid var(--color-border-light)',
                minWidth: '80px',
              }}
              onClick={() => handleSort('priority')}
            >
              <div className="flex items-center gap-1">
                优先级
                <SortIcon field="priority" />
              </div>
            </th>
            <th
              className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              style={{
                background: '#FAF8F5',
                color: 'var(--color-text-secondary)',
                borderBottom: '2px solid var(--color-border-light)',
                minWidth: '120px',
              }}
              onClick={() => handleSort('dueDate')}
            >
              <div className="flex items-center gap-1">
                截止日期
                <SortIcon field="dueDate" />
              </div>
            </th>
            <th
              className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              style={{
                background: '#FAF8F5',
                color: 'var(--color-text-secondary)',
                borderBottom: '2px solid var(--color-border-light)',
                minWidth: '100px',
              }}
              onClick={() => handleSort('estimatedMinutes')}
            >
              <div className="flex items-center gap-1">
                预计时长
                <SortIcon field="estimatedMinutes" />
              </div>
            </th>
            <th
              className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider"
              style={{
                background: '#FAF8F5',
                color: 'var(--color-text-secondary)',
                borderBottom: '2px solid var(--color-border-light)',
                minWidth: '120px',
              }}
            >
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task) => (
            <tr
              key={task.id}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              style={{
                background: selectedTasks.has(task.id) ? 'var(--color-blue)10' : 'transparent',
                borderBottom: '1px solid var(--color-border-light)',
              }}
              onClick={() => onTaskClick(task)}
            >
              <td
                className="px-3 py-2 text-xs"
                style={{ color: 'var(--color-text-muted)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selectedTasks.has(task.id)}
                  onChange={() => onTaskSelect(task.id)}
                  className="cursor-pointer"
                  style={{ accentColor: 'var(--color-blue)' }}
                />
              </td>
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <InlineEdit
                  value={task.title}
                  onSave={(value) => onUpdateTask(task.id, { title: value })}
                  placeholder="任务标题"
                />
              </td>
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <InlineEdit
                  value={task.status}
                  onSave={(value) =>
                    onUpdateTask(task.id, { status: value as TaskStatus })
                  }
                  type="status"
                />
              </td>
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <InlineEdit
                  value={String(task.priority)}
                  onSave={(value) =>
                    onUpdateTask(task.id, { priority: Number(value) as 1 | 2 | 3 | 4 | 5 })
                  }
                  type="priority"
                />
              </td>
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <InlineEdit
                  value={task.dueDate}
                  onSave={(value) => onUpdateTask(task.id, { dueDate: value })}
                  type="date"
                  placeholder="无截止日期"
                />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {task.estimatedMinutes} 分钟
                  </span>
                </div>
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center justify-center gap-1">
                  {task.status !== 'completed' && task.status !== 'archived' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onStartTimer(task)
                      }}
                      className="p-1.5 rounded-lg transition-all hover:scale-105"
                      style={{ background: 'var(--color-blue)20' }}
                      title="开始计时"
                    >
                      <Play size={14} style={{ color: 'var(--color-blue)' }} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteTask(task.id)
                    }}
                    className="p-1.5 rounded-lg transition-all hover:scale-105"
                    style={{ background: '#FEF2F2' }}
                    title="删除"
                  >
                    <Trash2 size={14} style={{ color: '#EF4444' }} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
