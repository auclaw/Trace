// 今日计划 - 滴答清单风格增强
// 支持项目分类、子任务、重复任务

import React, { useState, useEffect, useCallback } from 'react'
import {
  getTodayPlannedTasks,
  addPlannedTask,
  updatePlannedTask,
  deletePlannedTask,
  aiRescheduleTasks,
  getTaskActualTime,
  PlannedTask,
  SubTask,
  RepeatType
} from '../utils/planner'
import type { Theme } from '../App'

import { v4 as uuidv4 } from 'uuid'

interface PlannerProps {
  theme: Theme
}

const Planner: React.FC<PlannerProps> = ({ theme }) => {
  const isDark = theme === 'dark'
  const titleColor = isDark ? 'text-aether-text-dark-primary' : 'text-aether-text-primary'
  const textColor = isDark ? 'text-aether-text-dark-secondary' : 'text-aether-text-secondary'
  const cardBg = isDark ? 'bg-aether-dark-200' : 'bg-aether-200'
  const borderColor = isDark ? 'border-[var(--color-border-subtle)]' : 'border-[var(--color-border-subtle)]'
  const labelText = isDark ? 'text-aether-text-dark-secondary' : 'text-aether-text-secondary'
  const inputBg = isDark ? 'bg-aether-dark-300 border-[var(--color-border-subtle)] text-aether-text-dark-primary' : 'bg-aether-200 border-[var(--color-border-subtle)] text-aether-text-primary'
  const [tasks, setTasks] = useState<PlannedTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState(3)
  const [newEstimated, setNewEstimated] = useState(60)
  const [newProject, setNewProject] = useState('')
  const [newRepeatType, setNewRepeatType] = useState<RepeatType>('none')
  const [rescheduling, setRescheduling] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  // 编辑状态
  const [editingTitle, setEditingTitle] = useState('')
  const [editingPriority, setEditingPriority] = useState(3)
  const [editingEstimated, setEditingEstimated] = useState(60)
  const [editingProject, setEditingProject] = useState('')
  const [editingRepeatType, setEditingRepeatType] = useState<RepeatType>('none')
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  const loadTasks = useCallback(async () => {
    try {
      let data = await getTodayPlannedTasks()

      // 为每个未完成任务更新实际用时
      for (let i = 0; i < data.length; i++) {
        if (!data[i].completed) {
          try {
            const actualTime = await getTaskActualTime(data[i].id)
            data[i].actualMinutes = actualTime
          } catch (e) {
            console.error('获取实际时间失败', e)
          }
        }
      }

      // 按优先级排序（1 最高，排前面）
      data.sort((a, b) => a.priority - b.priority)
      setTasks(data)
    } catch (error) {
      console.error('加载任务失败', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
    // 每分钟刷新一次实际用时
    const interval = setInterval(() => {
      loadTasks()
    }, 60000)
    return () => clearInterval(interval)
  }, [loadTasks])

  const handleAddTask = async () => {
    if (!newTitle.trim()) return
    try {
      await addPlannedTask(
        newTitle.trim(),
        newPriority,
        newEstimated,
        newProject.trim() || undefined,
        newRepeatType === 'none' ? undefined : newRepeatType
      )
      await loadTasks()
      setNewTitle('')
      setNewProject('')
      setNewRepeatType('none')
      setShowAddForm(false)
    } catch (error) {
      console.error('添加任务失败', error)
    }
  }

  const handleEditTask = async (task: PlannedTask) => {
    try {
      await updatePlannedTask(task.id, {
        title: editingTitle,
        priority: editingPriority,
        estimated_minutes: editingEstimated,
        project: editingProject.trim() || null,
        repeat_type: editingRepeatType === 'none' ? null : editingRepeatType
      })
      await loadTasks()
      setEditingId(null)
    } catch (error) {
      console.error('更新任务失败', error)
    }
  }

  const handleToggleCompleted = async (task: PlannedTask) => {
    try {
      await updatePlannedTask(task.id, { completed: !task.completed })
      await loadTasks()
    } catch (error) {
      console.error('更新任务失败', error)
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (confirm('确定删除这个任务吗？')) {
      try {
        await deletePlannedTask(id)
        await loadTasks()
      } catch (error) {
        console.error('删除任务失败', error)
      }
    }
  }

  const handleAiReschedule = async () => {
    try {
      setRescheduling(true)
      const reordered = await aiRescheduleTasks(tasks, new Date())
      // 更新顺序到后端
      for (let i = 0; i < reordered.length; i++) {
        await updatePlannedTask(reordered[i].id, {
          priority: i + 1
        })
      }
      await loadTasks()
      alert('AI 已重新排序完成！')
    } catch (error) {
      console.error('AI 重排失败', error)
      alert('重排失败: ' + (error as Error).message)
    } finally {
      setRescheduling(false)
    }
  }

  const startEdit = (task: PlannedTask) => {
    setEditingId(task.id)
    setEditingTitle(task.title)
    setEditingPriority(task.priority)
    setEditingEstimated(task.estimatedMinutes)
    setEditingProject(task.project || '')
    setEditingRepeatType(task.repeat_type || 'none')
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  // 切换展开/收起子任务
  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  // 添加子任务
  const addSubtask = async (task: PlannedTask) => {
    if (!newSubtaskTitle.trim()) return
    const currentSubtasks = task.subtasks || []
    const newSubtasks: SubTask[] = [
      ...currentSubtasks,
      { id: uuidv4(), title: newSubtaskTitle.trim(), completed: false }
    ]
    try {
      await updatePlannedTask(task.id, { subtasks: newSubtasks })
      await loadTasks()
      setNewSubtaskTitle('')
    } catch (error) {
      console.error('添加子任务失败', error)
    }
  }

  // 切换子任务完成状态
  const toggleSubtask = async (task: PlannedTask, subtaskId: string) => {
    if (!task.subtasks) return
    const newSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    )
    try {
      await updatePlannedTask(task.id, { subtasks: newSubtasks })
      await loadTasks()
    } catch (error) {
      console.error('更新子任务失败', error)
    }
  }

  // 删除子任务
  const deleteSubtask = async (task: PlannedTask, subtaskId: string) => {
    if (!task.subtasks) return
    const newSubtasks = task.subtasks.filter(st => st.id !== subtaskId)
    try {
      await updatePlannedTask(task.id, { subtasks: newSubtasks })
      await loadTasks()
    } catch (error) {
      console.error('删除子任务失败', error)
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes === 0) return '0m'
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`
    }
    return `${mins}m`
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-700'
      case 2: return 'bg-orange-100 text-orange-700'
      case 3: return 'bg-yellow-100 text-yellow-700'
      case 4: return 'bg-[rgba(255,79,0,0.15)] text-[var(--color-accent)]'
      case 5: return 'bg-[var(--color-border-light)] text-[var(--color-text-secondary)]'
      default: return 'bg-[var(--color-border-light)] text-[var(--color-text-secondary)]'
    }
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return '最高'
      case 2: return '高'
      case 3: return '中'
      case 4: return '低'
      case 5: return '最低'
      default: return '中'
    }
  }

  const getRepeatLabel = (type?: RepeatType) => {
    if (!type || type === 'none') return '不重复'
    const map: Record<string, string> = {
      daily: '每日',
      weekly: '每周',
      monthly: '每月'
    }
    return map[type]
  }

  const totalEstimated = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0)
  const totalActual = tasks.reduce((sum, t) => sum + t.actualMinutes, 0)
  const completedCount = tasks.filter(t => t.completed).length
  const totalCount = tasks.length

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className={`text-2xl font-bold ${titleColor}`}>今日计划</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200 transform hover:scale-[1.02]"
          >
            + 添加任务
          </button>
        </div>
        <p className={textColor}>
          {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`${cardBg} rounded-xl p-6 border ${borderColor} transition-all duration-200`}>
          <div className={`text-sm font-medium ${textColor} mb-1`}>总任务</div>
          <div className={`text-3xl font-bold ${titleColor}`}>
            {completedCount} / {totalCount}
          </div>
        </div>
        <div className={`${cardBg} rounded-xl p-6 border ${borderColor} transition-all duration-200`}>
          <div className={`text-sm font-medium ${textColor} mb-1`}>预估总时间</div>
          <div className={`text-3xl font-bold ${titleColor}`}>
            {formatDuration(totalEstimated)}
          </div>
        </div>
        <div className={`${cardBg} rounded-xl p-6 border ${borderColor} transition-all duration-200`}>
          <div className={`text-sm font-medium ${textColor} mb-1`}>实际已用</div>
          <div className="text-3xl font-bold text-primary">
            {formatDuration(totalActual)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-primary to-success rounded-xl p-6 text-white transition-all duration-200">
          <div className="text-sm font-medium text-orange-100 mb-1">进度</div>
          <div className="text-3xl font-bold">
            {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* 添加任务表单 */}
      {showAddForm && (
        <div className={`${cardBg} rounded-xl p-6 border ${borderColor} mb-6 animate-in fade-in slide-in-from-top-2 duration-300`}>
          <h3 className={`text-lg font-semibold mb-4 ${titleColor}`}>添加新任务</h3>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${labelText} mb-1`}>任务标题</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="输入任务描述..."
                className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${inputBg}`}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${labelText} mb-1`}>
                  优先级: {newPriority} ({getPriorityLabel(newPriority)})
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newPriority}
                  onChange={(e) => setNewPriority(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className={`flex justify-between text-xs ${textColor}`}>
                  <span>1 - 最高</span>
                  <span>5 - 最低</span>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${labelText} mb-1`}>预估时间 (分钟)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={newEstimated}
                  onChange={(e) => setNewEstimated(parseFloat(e.target.value) || 60)}
                  className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${inputBg}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${labelText} mb-1`}>项目分类 (可选)</label>
                <input
                  type="text"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  placeholder="例如: 工作、学习、项目X"
                  className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${inputBg}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${labelText} mb-1`}>重复</label>
                <select
                  value={newRepeatType}
                  onChange={(e) => setNewRepeatType(e.target.value as RepeatType)}
                  className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${inputBg}`}
                >
                  <option value="none">不重复</option>
                  <option value="daily">每日重复</option>
                  <option value="weekly">每周重复</option>
                  <option value="monthly">每月重复</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddTask}
                disabled={!newTitle.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                添加
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className={`px-4 py-2 ${isDark ? 'bg-aether-dark-300 text-aether-text-dark-secondary hover:bg-aether-dark-300/80' : 'bg-aether-300 text-aether-text-secondary hover:bg-aether-300/80'} rounded-lg transition-colors`}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI 重排按钮 */}
      {tasks.length > 1 && (
        <div className="mb-6">
          <button
            onClick={handleAiReschedule}
            disabled={rescheduling}
            className="w-full px-4 py-3 bg-[var(--color-accent)] text-[#fffefb] rounded-lg hover:opacity-90 disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.01]"
          >
            {rescheduling ? 'AI 重排中...' : '🤖 AI 自动重排延误任务'}
          </button>
          <p className={`text-xs ${textColor} mt-2 text-center`}>
            如果当前任务延误，AI 会根据优先级自动重排剩余任务，建议低优先级任务推迟到明天
          </p>
        </div>
      )}

      {/* 任务列表 */}
      {loading ? (
        <div className={`text-center py-8 ${textColor}`}>加载中...</div>
      ) : tasks.length === 0 ? (
        <div className={`text-center py-12 ${textColor}`}>
          <p className="text-lg">今天还没有添加任务</p>
          <p className="text-sm mt-2">点击"添加任务"开始规划你的一天吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div
              key={task.id}
              className={`${cardBg} rounded-lg p-4 border transition-all duration-200 ${
                task.completed
                  ? (isDark ? 'border-[var(--color-border-subtle)] opacity-60' : 'border-[var(--color-border-subtle)] opacity-60')
                  : (isDark ? 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]/50' : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]/50')
              } ${editingId === task.id ? 'ring-2 ring-primary/20' : ''}`}
            >
              {editingId === task.id ? (
                // 编辑模式
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${inputBg}`}
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-medium ${labelText} mb-1`}>
                        优先级: {editingPriority} ({getPriorityLabel(editingPriority)})
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={editingPriority}
                        onChange={(e) => setEditingPriority(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${labelText} mb-1`}>预估时间 (分钟)</label>
                      <input
                        type="number"
                        min="5"
                        max="480"
                        value={editingEstimated}
                        onChange={(e) => setEditingEstimated(parseFloat(e.target.value) || 60)}
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${inputBg}`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-medium ${labelText} mb-1`}>项目分类</label>
                      <input
                        type="text"
                        value={editingProject}
                        onChange={(e) => setEditingProject(e.target.value)}
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${inputBg}`}
                        placeholder="留空表示无项目"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${labelText} mb-1`}>重复</label>
                      <select
                        value={editingRepeatType}
                        onChange={(e) => setEditingRepeatType(e.target.value as RepeatType)}
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${inputBg}`}
                      >
                        <option value="none">不重复</option>
                        <option value="daily">每日重复</option>
                        <option value="weekly">每周重复</option>
                        <option value="monthly">每月重复</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={cancelEdit}
                      className={`px-3 py-1 text-sm ${isDark ? 'bg-aether-dark-300 text-aether-text-dark-secondary hover:bg-aether-dark-300/80' : 'bg-aether-300 text-aether-text-secondary hover:bg-aether-300/80'} rounded hover:opacity-90 transition-colors`}
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleEditTask(task)}
                      className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                // 查看模式
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleCompleted(task)}
                        className="w-5 h-5 text-primary rounded focus:ring-primary transition-all"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-lg font-medium ${
                            task.completed
                              ? `line-through ${textColor}`
                              : titleColor
                          }`}>
                            {task.title}
                          </h4>
                          {task.project && (
                            <span className={`text-xs ${isDark ? 'bg-aether-dark-300 text-aether-text-dark-secondary' : 'bg-aether-300 text-aether-text-secondary'} px-2 py-0.5 rounded-full`}>
                              {task.project}
                            </span>
                          )}
                          {task.repeat_type && task.repeat_type !== 'none' && (
                            <span className={`text-xs ${isDark ? 'bg-[rgba(255,79,0,0.2)] text-[var(--color-accent)]' : 'bg-[rgba(255,79,0,0.1)] text-[var(--color-accent)]'} px-2 py-0.5 rounded-full`}>
                              {getRepeatLabel(task.repeat_type)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {getPriorityLabel(task.priority)}
                          </span>
                          <span className={`text-xs ${textColor}`}>
                            预估: {formatDuration(task.estimatedMinutes)}
                          </span>
                          <span className={`text-xs ${
                            task.actualMinutes > task.estimatedMinutes
                              ? 'text-red-500'
                              : 'text-green-600'
                          }`}>
                            实际: {formatDuration(task.actualMinutes)}
                          </span>
                          {task.actualMinutes > 0 && (
                            <span className={`text-xs ${textColor}`}>
                              ({Math.round((task.actualMinutes / task.estimatedMinutes) * 100)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      {(task.subtasks?.length || 0) > 0 && (
                        <button
                          onClick={() => toggleExpand(task.id)}
                          className={`px-2 py-1 text-xs ${isDark ? 'bg-aether-dark-300 text-aether-text-dark-secondary hover:bg-aether-dark-300/80' : 'bg-aether-300 text-aether-text-secondary hover:bg-aether-300/80'} rounded hover:opacity-90 transition-colors`}
                        >
                          {expandedTasks.has(task.id) ? '收起' : `子任务(${task.subtasks?.length || 0})`}
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(task)}
                        className={`px-2 py-1 text-xs ${isDark ? 'bg-[rgba(255,79,0,0.2)] text-[var(--color-accent)] hover:bg-[rgba(255,79,0,0.3)]' : 'bg-[rgba(255,79,0,0.1)] text-[var(--color-accent)]'} rounded hover:bg-[rgba(255,79,0,0.2)] transition-colors`}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>

                  {/* 进度条 */}
                  {task.estimatedMinutes > 0 && (
                    <div className={`mt-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          task.completed ? 'bg-green-500' :
                          task.actualMinutes > task.estimatedMinutes ? 'bg-orange-500' : 'bg-primary'
                        }`}
                        style={{
                          width: `${Math.min(100, (task.actualMinutes / task.estimatedMinutes) * 100)}%`
                        }}
                      />
                    </div>
                  )}

                  {/* 子任务列表 */}
                  {expandedTasks.has(task.id) && task.subtasks && task.subtasks.length > 0 && (
                    <div className={`mt-4 pl-8 border-l-2 ${isDark ? 'border-gray-700' : 'border-gray-200'} space-y-2`}>
                      {task.subtasks.map(subtask => (
                        <div key={subtask.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => toggleSubtask(task, subtask.id)}
                              className="w-4 h-4 text-primary"
                            />
                            <span className={`text-sm ${subtask.completed ? `line-through ${textColor}` : titleColor}`}>
                              {subtask.title}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteSubtask(task, subtask.id)}
                            className={`text-xs ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
                          >
                            删除
                          </button>
                        </div>
                      ))}
                      {/* 添加新子任务 */}
                      <div className="flex space-x-2 pt-2">
                        <input
                          type="text"
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          placeholder="添加子任务..."
                          className={`flex-1 px-2 py-1 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-primary ${inputBg}`}
                          onKeyDown={(e) => e.key === 'Enter' && addSubtask(task)}
                        />
                        <button
                          onClick={() => addSubtask(task)}
                          disabled={!newSubtaskTitle.trim()}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          添加
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 如果展开且没有子任务，显示添加框 */}
                  {expandedTasks.has(task.id) && (!task.subtasks || task.subtasks.length === 0) && (
                    <div className={`mt-4 pl-8 border-l-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex space-x-2 pt-2">
                        <input
                          type="text"
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          placeholder="添加子任务..."
                          className={`flex-1 px-2 py-1 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-primary ${inputBg}`}
                          onKeyDown={(e) => e.key === 'Enter' && addSubtask(task)}
                        />
                        <button
                          onClick={() => addSubtask(task)}
                          disabled={!newSubtaskTitle.trim()}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          添加
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Planner
