import { useState, useEffect } from 'react'
import { Plus, Check, Clock, Flag, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

const PRIORITY_COLORS: Record<number, string> = {
  1: '#9E9899',
  2: '#79BEEB',
  3: '#FFD3B6',
  4: '#FF8C82',
  5: '#FF5252',
}

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent',
  5: 'Critical',
}

export default function TaskPage() {
  const tasks = useAppStore((s) => s.tasks)
  const loadTasks = useAppStore((s) => s.loadTasks)
  const updateTask = useAppStore((s) => s.updateTask)
  const addTask = useAppStore((s) => s.addTask)
  const deleteTask = useAppStore((s) => s.deleteTask)

  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  useEffect(() => {
    loadTasks().finally(() => setLoading(false))
  }, [loadTasks])

  const pendingTasks = tasks.filter((t) => t.status !== 'completed')
  const completedTasks = tasks.filter((t) => t.status === 'completed')

  const filteredTasks =
    filter === 'all' ? tasks : filter === 'pending' ? pendingTasks : completedTasks

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return
    addTask({
      title: newTaskTitle,
      priority: newTaskPriority,
      status: 'pending',
      estimatedMinutes: 30,
      actualMinutes: 0,
      project: '',
      subtasks: [],
      dueDate: '',
      repeatType: 'none',
      createdAt: new Date().toISOString(),
    })
    setNewTaskTitle('')
    setShowAddForm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-base)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-8 py-8" style={{ background: 'var(--color-bg-base)' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}>
            Tasks
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {pendingTasks.length} items pending
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]"
          style={{
            background: '#79BEEB',
            color: 'white',
            boxShadow: '3px 3px 0px #D6D3CD',
          }}
        >
          <Plus size={16} className="inline mr-1" />
          Add Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
            style={{
              background: filter === f ? '#79BEEB' : '#FFFFFF',
              color: filter === f ? 'white' : '#5C5658',
              border: filter === f ? '2px solid #5AACDF' : '2px solid #D6D3CD',
              boxShadow: filter === f ? '3px 3px 0px rgba(121, 190, 235, 0.4)' : '3px 3px 0px #D6D3CD',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddForm && (
        <div
          className="mb-6 p-5 rounded-2xl"
          style={{
            background: '#FFFFFF',
            border: '2px solid #D6D3CD',
            boxShadow: '4px 4px 0px #D6D3CD',
          }}
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: '#3A3638' }}>
            New Task
          </h3>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full px-4 py-3 rounded-xl mb-4 text-sm"
            style={{
              background: '#F5F1EA',
              border: '2px solid #D6D3CD',
              color: '#3A3638',
              outline: 'none',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            autoFocus
          />
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2" style={{ color: '#5C5658' }}>
              Priority
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  onClick={() => setNewTaskPriority(p as 1 | 2 | 3 | 4 | 5)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: newTaskPriority === p ? PRIORITY_COLORS[p] : '#F5F1EA',
                    color: newTaskPriority === p ? 'white' : '#5C5658',
                  }}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: '#F5F1EA', color: '#5C5658' }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddTask}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: '#79BEEB', color: 'white' }}
            >
              Add Task
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div
            className="p-8 text-center rounded-2xl"
            style={{
              background: '#FFFFFF',
              border: '2px solid #D6D3CD',
              boxShadow: '4px 4px 0px #D6D3CD',
            }}
          >
            <div
              className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(121, 190, 235, 0.12)' }}
            >
              <Clock size={20} style={{ color: '#79BEEB' }} />
            </div>
            <p className="text-sm" style={{ color: '#9E9899' }}>
              No tasks found. Start by adding your first task!
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-xl transition-all duration-200 hover:translate-x-1"
              style={{
                background: '#FFFFFF',
                border: '2px solid #D6D3CD',
                boxShadow: '3px 3px 0px #D6D3CD',
                opacity: task.status === 'completed' ? 0.6 : 1,
              }}
            >
              <div className="flex items-center gap-3">
                {/* Checkbox */}
                <button
                  onClick={() =>
                    updateTask(task.id, {
                      status: task.status === 'completed' ? 'pending' : 'completed',
                    })
                  }
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: task.status === 'completed' ? '#A8E6CF' : '#F5F1EA',
                    border: `2px solid ${task.status === 'completed' ? '#7DD4B0' : '#D6D3CD'}`,
                  }}
                >
                  {task.status === 'completed' && <Check size={14} style={{ color: '#2D5A4A' }} />}
                </button>

                <div className="flex-1 min-w-0">
                  <h3
                    className="text-sm font-semibold"
                    style={{
                      color: '#3A3638',
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className="px-2 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1"
                      style={{
                        background: `${PRIORITY_COLORS[task.priority] || '#9E9899'}30`,
                        color: PRIORITY_COLORS[task.priority] || '#9E9899',
                      }}
                    >
                      <Flag size={10} />
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                    {task.estimatedMinutes && (
                      <span className="text-xs" style={{ color: '#9E9899' }}>
                        <Clock size={10} className="inline mr-1" />
                        {task.estimatedMinutes}m
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-2 rounded-lg transition-all hover:scale-110"
                  style={{ background: 'rgba(255, 140, 130, 0.12)' }}
                >
                  <Trash2 size={14} style={{ color: '#FF8C82' }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
