import { useState, useEffect, useMemo } from 'react'
import { Plus, X } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useToastFeedback } from '../hooks/useToastFeedback'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import TaskCard from '../components/Task/TaskCard'
import BatchActionBar from '../components/Task/BatchActionBar'
import ViewSwitcher from '../components/Task/ViewSwitcher'
import TableView from '../components/Task/TableView'
import CalendarView from '../components/Task/CalendarView'
import DetailPanel from '../components/DetailPanel'
import type { Task, TaskStatus } from '../services/dataService'
import { PRIORITY_BG_COLORS, PRIORITY_LABELS, STATUS_FILTERS, isValidDate } from '../constants/task'
import type { ViewMode } from '../components/Task/ViewSwitcher'

export default function TaskPage() {
  const tasks = useAppStore((s) => s.tasks)
  const loadTasks = useAppStore((s) => s.loadTasks)
  const updateTask = useAppStore((s) => s.updateTask)
  const addTask = useAppStore((s) => s.addTask)
  const deleteTask = useAppStore((s) => s.deleteTask)
  const { success, error, warning } = useToastFeedback()

  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskEstimatedMinutes, setNewTaskEstimatedMinutes] = useState(30)
  const [newTaskFirstStep, setNewTaskFirstStep] = useState('')
  const [newTaskEmotion, setNewTaskEmotion] = useState<'' | 'easy' | 'neutral' | 'resist'>('')

  const [filter, setFilter] = useState<TaskStatus | 'all' | 'active'>('active')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)

  // Multi-selection state
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())

  // Batch operation loading state
  const [batchLoading, setBatchLoading] = useState(false)

  // Batch delete confirmation
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false)

  // Detail panel state
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)

  useEffect(() => {
    loadTasks().finally(() => setLoading(false))
  }, [loadTasks])

  // Handle ESC key to close detail panel and modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDetailPanel) {
          setShowDetailPanel(false)
          setDetailTask(null)
        }
        if (taskToDelete) {
          setTaskToDelete(null)
        }
        if (showBatchDeleteConfirm) {
          setShowBatchDeleteConfirm(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showDetailPanel, taskToDelete, showBatchDeleteConfirm])

  // Filter tasks based on current filter
  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'all':
        return tasks
      case 'active':
        return tasks.filter((t) => t.status === 'in_progress' || t.status === 'paused')
      default:
        return tasks.filter((t) => t.status === filter)
    }
  }, [tasks, filter])

  // Clear selected tasks that are no longer in filtered tasks when filter changes
  useEffect(() => {
    const filteredTaskIds = new Set(filteredTasks.map((t) => t.id))
    setSelectedTasks((prev) => {
      const next = new Set<string>()
      prev.forEach((id) => {
        if (filteredTaskIds.has(id)) {
          next.add(id)
        }
      })
      return next
    })
  }, [filteredTasks])

  // Group tasks by status for board view
  const tasksByStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      paused: [],
      completed: [],
      archived: [],
    }
    filteredTasks.forEach((t) => {
      groups[t.status] = groups[t.status] || []
      groups[t.status].push(t)
    })
    return groups
  }, [filteredTasks])

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      warning('请输入任务标题')
      return
    }
    // Validate due date validation
    if (newTaskDueDate && !isValidDate(newTaskDueDate)) {
      warning('请输入有效的截止日期')
      return
    }
    try {
      await addTask({
        title: newTaskTitle,
        priority: newTaskPriority,
        status: 'todo',
        estimatedMinutes: newTaskEstimatedMinutes,
        actualMinutes: 0,
        project: '',
        subtasks: [],
        dueDate: newTaskDueDate,
        repeatType: 'none',
        createdAt: new Date().toISOString(),
        firstStep: newTaskFirstStep || undefined,
        emotionalTag: newTaskEmotion || undefined,
        timeLoggedMinutes: 0,
      })
      setNewTaskTitle('')
      setNewTaskPriority(3)
      setNewTaskDueDate('')
      setNewTaskEstimatedMinutes(30)
      setNewTaskFirstStep('')
      setNewTaskEmotion('')
      setShowAddForm(false)
      success('已添加任务')
    } catch (err) {
      error('添加任务失败，请重试')
      console.error('Add task error:', err)
    }
  }

  // 删除任务 - dataService.deleteTask 已内置级联删除关联的时间块
  const deleteTaskWithTimeBlocks = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    try {
      // dataService.deleteTask 已内置级联删除关联的时间块
      await deleteTask(taskId)
      return task
    } catch (error) {
      console.error('Delete task with time blocks error:', error)
      throw error
    }
  }

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      try {
        await deleteTaskWithTimeBlocks(taskToDelete)
        setTaskToDelete(null)
        setSelectedTasks((prev) => {
          const next = new Set(prev)
          next.delete(taskToDelete)
          return next
        })
        success('已删除任务')
      } catch (err) {
        error('删除失败，请重试')
        console.error('Delete task error:', err)
      }
    }
  }

  const handleTaskClick = (task: Task) => {
    setDetailTask(task)
    setShowDetailPanel(true)
  }

  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(filteredTasks.map((t) => t.id)))
    }
  }

  const handleClearSelection = () => {
    setSelectedTasks(new Set())
  }

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTask(taskId, { status })
      success(status === 'completed' ? '已完成任务' : '已更新状态')
    } catch (err) {
      error('状态更新失败，请重试')
      console.error('Status change error:', err)
    }
  }

  const handleStartTimer = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'in_progress' ? 'paused' : 'in_progress'
    try {
      await updateTask(task.id, { status: newStatus })
      success(newStatus === 'in_progress' ? '已开始专注' : '已暂停')
    } catch (err) {
      error('操作失败，请重试')
      console.error('Start timer error:', err)
    }
  }

  const handleBatchComplete = async () => {
    if (batchLoading) return
    setBatchLoading(true)
    const taskCount = selectedTasks.size
    try {
      const promises = Array.from(selectedTasks).map((id) =>
        updateTask(id, { status: 'completed' })
      )
      await Promise.all(promises)
      success(`已完成 ${taskCount} 个任务`)
      setSelectedTasks(new Set())
    } catch (err) {
      error('批量操作失败，请重试')
      console.error('Batch complete error:', err)
    } finally {
      setBatchLoading(false)
    }
  }

  const handleBatchArchive = async () => {
    if (batchLoading) return
    setBatchLoading(true)
    const taskCount = selectedTasks.size
    try {
      const promises = Array.from(selectedTasks).map((id) =>
        updateTask(id, { status: 'archived' })
      )
      await Promise.all(promises)
      success(`已归档 ${taskCount} 个任务`)
      setSelectedTasks(new Set())
    } catch (err) {
      error('批量归档失败，请重试')
      console.error('Batch archive error:', err)
    } finally {
      setBatchLoading(false)
    }
  }

  const handleBatchDeleteConfirm = () => {
    setShowBatchDeleteConfirm(true)
  }

  const handleBatchDelete = async () => {
    if (batchLoading) return
    setBatchLoading(true)
    const taskCount = selectedTasks.size
    try {
      const promises = Array.from(selectedTasks).map((id) => deleteTaskWithTimeBlocks(id))
      await Promise.all(promises)
      success(`已删除 ${taskCount} 个任务`)
      setSelectedTasks(new Set())
      setShowBatchDeleteConfirm(false)
    } catch (err) {
      error('批量删除失败，请重试')
      console.error('Batch delete error:', err)
    } finally {
      setBatchLoading(false)
    }
  }

  const handleSaveTask = async (updatedTask: Task) => {
    try {
      await updateTask(updatedTask.id, updatedTask)
      setShowDetailPanel(false)
      setDetailTask(null)
      success('任务已更新')
    } catch (err) {
      error('保存失败，请重试')
      console.error('Save task error:', err)
    }
  }

  const handleDeleteTaskFromPanel = async () => {
    if (detailTask) {
      try {
        await deleteTaskWithTimeBlocks(detailTask.id)
        setShowDetailPanel(false)
        setDetailTask(null)
        success('任务已删除')
      } catch (err) {
        error('删除失败，请重试')
        console.error('Delete task error:', err)
      }
    }
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
            {filteredTasks.length} 个任务
          </p>
        </div>

        <div className="flex gap-2">
          <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />

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
            添加任务
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
            style={{
              background: filter === f.key ? '#79BEEB' : '#FFFFFF',
              color: filter === f.key ? 'white' : '#5C5658',
              border: filter === f.key ? '2px solid #5AACDF' : '2px solid #D6D3CD',
              boxShadow: filter === f.key ? '3px 3px 0px rgba(121, 190, 235, 0.4)' : '3px 3px 0px #D6D3CD',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddForm && (
        <div
          className="mb-6 p-5 rounded-xl"
          style={{
            background: '#FFFFFF',
            border: '2px solid #D6D3CD',
            boxShadow: '4px 4px 0px #D6D3CD',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: '#3A3638' }}>
              新任务
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <X size={18} style={{ color: '#9E9899' }} />
            </button>
          </div>

          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="需要做什么？"
            className="w-full px-4 py-3 rounded-xl mb-4 text-sm"
            style={{
              background: '#FAF8F5',
              border: '2px solid #E8E6E1',
              color: '#3A3638',
              outline: 'none',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            autoFocus
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Priority */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#5C5658' }}>
                优先级
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((p) => (
                  <button
                    key={p}
                    onClick={() => setNewTaskPriority(p as 1 | 2 | 3 | 4 | 5)}
                    className="flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: newTaskPriority === p ? PRIORITY_BG_COLORS[p] : '#FAF8F5',
                      color: newTaskPriority === p ? 'white' : '#5C5658',
                    }}
                  >
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#5C5658' }}>
                截止日期（可选）
              </p>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={{
                  background: '#FAF8F5',
                  border: '2px solid #E8E6E1',
                  color: '#3A3638',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Estimated Duration */}
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2" style={{ color: '#5C5658' }}>
              预计时长
            </p>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                value={newTaskEstimatedMinutes}
                onChange={(e) => setNewTaskEstimatedMinutes(Math.max(5, Math.min(480, parseInt(e.target.value) || 0)))}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm"
                style={{
                  background: '#FAF8F5',
                  border: '2px solid #E8E6E1',
                  color: '#3A3638',
                  outline: 'none',
                }}
                min={5}
                max={480}
              />
              <span className="text-sm" style={{ color: '#5C5658' }}>分钟</span>
            </div>
            <div className="flex gap-2">
              {[25, 50, 90].map((m) => (
                <button
                  key={m}
                  onClick={() => setNewTaskEstimatedMinutes(m)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: newTaskEstimatedMinutes === m ? '#79BEEB' : '#FAF8F5',
                    color: newTaskEstimatedMinutes === m ? 'white' : '#5C5658',
                    border: newTaskEstimatedMinutes === m ? '2px solid #5AACDF' : '2px solid transparent',
                  }}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* First Step */}
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2" style={{ color: '#5C5658' }}>
              第一步是什么？
            </p>
            <input
              type="text"
              value={newTaskFirstStep}
              onChange={(e) => setNewTaskFirstStep(e.target.value)}
              placeholder="例如：打开项目文件夹..."
              className="w-full px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: '#FAF8F5',
                border: '2px solid #E8E6E1',
                color: '#3A3638',
                outline: 'none',
              }}
            />
          </div>

          {/* Emotional Tag */}
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2" style={{ color: '#5C5658' }}>
              做这件事的感觉
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setNewTaskEmotion(newTaskEmotion === 'easy' ? '' : 'easy')}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: newTaskEmotion === 'easy' ? '#A8E6CF' : '#FAF8F5',
                  color: newTaskEmotion === 'easy' ? '#2D5A4A' : '#5C5658',
                }}
              >
                😊 轻松
              </button>
              <button
                onClick={() => setNewTaskEmotion(newTaskEmotion === 'neutral' ? '' : 'neutral')}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: newTaskEmotion === 'neutral' ? '#FFD3B6' : '#FAF8F5',
                  color: newTaskEmotion === 'neutral' ? '#B8860B' : '#5C5658',
                }}
              >
                😐 一般
              </button>
              <button
                onClick={() => setNewTaskEmotion(newTaskEmotion === 'resist' ? '' : 'resist')}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: newTaskEmotion === 'resist' ? '#FF8C82' : '#FAF8F5',
                  color: newTaskEmotion === 'resist' ? '#8B0000' : '#5C5658',
                }}
              >
                😰 困难
              </button>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: '#FAF8F5', color: '#5C5658' }}
            >
              取消
            </button>
            <button
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#79BEEB' }}
            >
              添加任务
            </button>
          </div>
        </div>
      )}

      {/* Detail Panel Modal */}
      {showDetailPanel && detailTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <DetailPanel
            data={detailTask}
            mode="edit"
            onClose={() => {
              setShowDetailPanel(false)
              setDetailTask(null)
            }}
            onSave={handleSaveTask}
            onDelete={handleDeleteTaskFromPanel}
          />
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3 pb-4">
          {filteredTasks.length === 0 ? (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#FFFFFF',
                border: '2px solid #D6D3CD',
                boxShadow: '4px 4px 0px #D6D3CD',
              }}
            >
              <EmptyState
                icon="📋"
                title={filter === 'all' ? '暂无任务' : '该筛选条件下无任务'}
                description={
                  filter === 'all'
                    ? '点击上方按钮添加您的第一个任务，开始管理您的时间！'
                    : '尝试切换筛选条件查看更多任务。'
                }
                action={
                  filter === 'all' ? (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: '#79BEEB', color: 'white' }}
                    >
                      添加任务
                    </button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                selected={selectedTasks.has(task.id)}
                onSelect={() => handleTaskSelect(task.id)}
                onClick={() => handleTaskClick(task)}
                onStartTimer={() => handleStartTimer(task)}
                onStatusChange={(status) => handleStatusChange(task.id, status)}
              />
            ))
          )}
        </div>
      )}

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {(['todo', 'in_progress', 'paused', 'completed', 'archived'] as const).map((status) => {
            const statusTasks = tasksByStatus[status] || []
            const statusLabels: Record<TaskStatus, string> = {
              todo: '待办',
              in_progress: '进行中',
              paused: '已暂停',
              completed: '已完成',
              archived: '已归档',
            }
            return (
              <div key={status}>
                <h3 className="text-sm font-semibold mb-3 px-1" style={{ color: '#5C5658' }}>
                  {statusLabels[status]}
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ background: '#F5F1EA' }}>
                    {statusTasks.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {statusTasks.length === 0 ? (
                    <div
                      className="p-6 rounded-2xl text-center"
                      style={{ background: '#FFFFFF', border: '2px dashed #D6D3CD' }}
                    >
                      <p className="text-xs" style={{ color: '#9E9899' }}>暂无任务</p>
                    </div>
                  ) : (
                    statusTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        selected={selectedTasks.has(task.id)}
                        onSelect={() => handleTaskSelect(task.id)}
                        onClick={() => handleTaskClick(task)}
                        onStartTimer={() => handleStartTimer(task)}
                        onStatusChange={(s) => handleStatusChange(task.id, s)}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <TableView
          tasks={filteredTasks}
          onUpdateTask={updateTask}
          onStartTimer={handleStartTimer}
          onDeleteTask={(id) => setTaskToDelete(id)}
          onTaskClick={handleTaskClick}
          selectedTasks={selectedTasks}
          onTaskSelect={handleTaskSelect}
        />
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <CalendarView
          tasks={filteredTasks}
          onAddTask={(date) => {
            setNewTaskDueDate(date)
            setShowAddForm(true)
          }}
          onTaskClick={handleTaskClick}
        />
      )}

      {/* Batch Action Bar */}
      <BatchActionBar
        selectedCount={selectedTasks.size}
        totalCount={filteredTasks.length}
        loading={batchLoading}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onBatchComplete={handleBatchComplete}
        onBatchDelete={handleBatchDeleteConfirm}
        onBatchArchive={handleBatchArchive}
      />

      {/* Single Task Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="删除任务"
        message="确定要删除这个任务吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />

      {/* Batch Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="批量删除任务"
        message={`确定要删除选中的 ${selectedTasks.size} 个任务吗？此操作无法撤销。`}
        confirmText="全部删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  )
}
