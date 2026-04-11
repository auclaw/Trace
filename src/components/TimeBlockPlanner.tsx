// TimeBlock Planner Component
// 时间块日程规划组件 - 可拖拽安排一天任务
// 集成 AI 智能排期建议

import React, { useState, useEffect, useCallback } from 'react'
import type { Theme } from '../App'
import type { TimeBlock, Task, ActivityCategory } from '../services/dataService'
import dataService from '../services/dataService'

export type TimeBlockDTO = TimeBlock
export type TaskDTO = Task

const {
  getTimeBlocks,
  addTimeBlock,
  updateTimeBlock,
  deleteTimeBlock,
  getTasks,
} = dataService

// AI suggestion is handled inline

interface TimeBlockPlannerProps {
  selectedDate: Date
  theme: Theme
}

const TimeBlockPlanner: React.FC<TimeBlockPlannerProps> = ({ selectedDate, theme: _theme }) => {
  const titleStyle: React.CSSProperties = { color: 'var(--color-text-primary)' }
  const textStyle: React.CSSProperties = { color: 'var(--color-text-secondary)' }
  const cardStyle: React.CSSProperties = { background: 'var(--color-bg-surface-2)' }
  const borderStyle: React.CSSProperties = { borderColor: 'var(--color-border-subtle)' }
  const inputStyle: React.CSSProperties = { background: 'var(--color-bg-surface-2)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-primary)' }

  const [timeblocks, setTimeblocks] = useState<TimeBlockDTO[]>([])
  const [tasks, setTasks] = useState<TaskDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingBlock, setEditingBlock] = useState<TimeBlockDTO | null>(null)
  const [suggesting, setSuggesting] = useState(false)

  // 表单状态
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState<ActivityCategory>('工作')
  const [formStartTime, setFormStartTime] = useState('09:00')
  const [formDuration, setFormDuration] = useState('60')

  const formatDateYMD = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const parseTimeToDate = (timeStr: string, dateStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return `${dateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
  }

  const calculateDurationMinutes = (startTimeStr: string, endTimeStr: string): number => {
    const start = new Date(startTimeStr)
    const end = new Date(endTimeStr)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60))
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const dateStr = formatDateYMD(selectedDate)
      const [blocksData, tasksData] = await Promise.all([
        getTimeBlocks(dateStr),
        getTasks()
      ])
      // 按开始时间排序
      blocksData.sort((a: TimeBlockDTO, b: TimeBlockDTO) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
      setTimeblocks(blocksData)
      setTasks(tasksData.filter((t: TaskDTO) => t.status !== 'completed'))
    } catch (err) {
      if (import.meta.env.DEV) console.error('加载时间块失败', err)
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    loadData()
  }, [selectedDate, loadData])

  const openAddModal = () => {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setFormTitle('')
    setFormCategory('工作')
    setFormStartTime(currentTime)
    setFormDuration('60')
    setEditingBlock(null)
    setShowModal(true)
  }

  const openEditModal = (block: TimeBlockDTO) => {
    const start = new Date(block.startTime)
    const timeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
    const duration = calculateDurationMinutes(block.startTime, block.endTime)
    setFormTitle(block.title)
    setFormCategory(block.category)
    setFormStartTime(timeStr)
    setFormDuration(duration.toString())
    setEditingBlock(block)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingBlock(null)
  }

  const handleToggleCompleted = async (block: TimeBlock) => {
    try {
      await updateTimeBlock(block.id, {
        ...block,
        completed: !block.completed
      })
      await loadData()
    } catch (err) {
      if (import.meta.env.DEV) console.error('切换状态失败', err)
    }
  }

  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      alert('请输入标题')
      return
    }

    const dateStr = formatDateYMD(selectedDate)
    const startTime = parseTimeToDate(formStartTime, dateStr)
    const duration = parseInt(formDuration) || 30
    const startDate = new Date(startTime)
    const endTime = new Date(startDate.getTime() + duration * 60 * 1000).toISOString().slice(0, 19)

    const baseData = {
      title: formTitle,
      category: formCategory,
      date: dateStr,
      endTime,
      startTime,
      durationMinutes: duration,
    }

    try {
      if (editingBlock) {
        await updateTimeBlock(editingBlock.id, {
          ...baseData,
          completed: editingBlock.completed,
        })
      } else {
        await addTimeBlock({
          ...baseData,
          completed: false,
        })
      }
      closeModal()
      await loadData()
    } catch (err) {
      if (import.meta.env.DEV) console.error('保存失败', err)
      alert('保存失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个时间块吗？')) return
    try {
      await deleteTimeBlock(id)
      await loadData()
    } catch (err) {
      if (import.meta.env.DEV) console.error('删除失败', err)
      alert('删除失败')
    }
  }

  const handleAiSuggest = async () => {
    const pendingTasks = tasks.filter(t => t.status === 'pending')
    if (pendingTasks.length === 0) {
      alert('没有待完成任务可以安排')
      return
    }

    // 计算可用时间：从现在到晚上 23:00
    const now = new Date()
    const endOfDay = new Date(selectedDate)
    endOfDay.setHours(23, 0, 0, 0)
    let availableHours = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (availableHours < 1) availableHours = 8 // 如果已经很晚，默认按 8 小时算

    setSuggesting(true)
    try {
      // Create simple blocks from pending tasks with automatic spacing
      const dateStr = formatDateYMD(selectedDate)
      let currentTime = new Date(now.getTime())
      // If current time is before 8:00 AM, start at 8:00 AM
      const startOfDay = new Date(selectedDate).setHours(8, 0, 0, 0)
      if (currentTime.getTime() < startOfDay) {
        currentTime = new Date(startOfDay)
      }

      for (const task of pendingTasks) {
        const duration = task.estimatedMinutes || 30
        const startTime = new Date(currentTime.getTime())
        const endTime = new Date(startTime.getTime() + duration * 60 * 1000)

        await addTimeBlock({
          title: task.title,
          category: '工作',
          date: dateStr,
          startTime: startTime.toISOString().slice(0, 19),
          endTime: endTime.toISOString().slice(0, 19),
          durationMinutes: duration,
          completed: false,
        })

        // Add 5 minute break between tasks
        currentTime = new Date(endTime.getTime() + 5 * 60 * 1000)
      }

      await loadData()
      alert(`AI 已为你安排 ${pendingTasks.length} 个时间块`)
    } catch (err) {
      if (import.meta.env.DEV) console.error('AI 建议失败', err)
      alert('AI 建议失败，请稍后重试')
    } finally {
      setSuggesting(false)
    }
  }

  const formatTime = (isoStr: string): string => {
    const d = new Date(isoStr)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60))
  }

  const getCategoryColor = (category: ActivityCategory): string => {
    const colors: Record<ActivityCategory, string> = {
      '开发': 'bg-indigo-500',
      '工作': 'bg-blue-500',
      '学习': 'bg-green-500',
      '会议': 'bg-yellow-500',
      '休息': 'bg-gray-500',
      '娱乐': 'bg-pink-500',
      '运动': 'bg-orange-500',
      '阅读': 'bg-cyan-500',
      '其他': 'bg-purple-500',
    }
    return colors[category] || 'bg-blue-500'
  }

  const categoryOptions: ActivityCategory[] = ['开发', '工作', '学习', '会议', '休息', '娱乐', '运动', '阅读', '其他']

  return (
    <div className="rounded-xl p-6 border mt-6" style={{ ...cardStyle, ...borderStyle }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={titleStyle}>
          时间块规划
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleAiSuggest}
            disabled={suggesting}
            className={`px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 ${
              suggesting ? 'animate-pulse' : ''
            }`}
          >
            {suggesting ? 'AI 生成中...' : 'AI 智能排期'}
          </button>
          <button
            onClick={openAddModal}
            className="px-3 py-1.5 text-sm bg-[var(--color-accent)] text-[#fffefb] rounded-lg hover:opacity-90 transition-colors"
          >
            + 添加时间块
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8" style={textStyle}>加载中...</div>
      )}

      {!loading && timeblocks.length === 0 && (
        <div className="text-center py-12" style={textStyle}>
          <p className="mb-4">这天还没有时间块安排</p>
          <p className="text-sm mb-6">
            可以手动添加，或使用 AI 根据你的待办任务智能生成日程安排
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-[var(--color-accent)] text-[#fffefb] rounded-lg hover:opacity-90 transition-colors"
            >
              添加第一个时间块
            </button>
            {tasks.filter(t => t.status !== 'completed').length > 0 && (
              <button
                onClick={handleAiSuggest}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:opacity-90 transition-colors"
              >
                AI 自动排期
              </button>
            )}
          </div>
        </div>
      )}

      {!loading && timeblocks.length > 0 && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {timeblocks.map(block => {
            const isCompleted = block.completed
            const categoryColor = getCategoryColor(block.category)
            const duration = calculateDuration(block.startTime, block.endTime)
            return (
              <div
                key={block.id}
                className={`
                  flex items-center p-3 border rounded-lg transition-colors
                  ${isCompleted ? 'opacity-60' : ''}
                `}
                style={borderStyle}
                onClick={() => handleToggleCompleted(block)}
              >
                <div className={`w-2 h-full rounded-full mr-3 ${categoryColor} ${isCompleted ? 'opacity-40' : ''}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ ...titleStyle, textDecoration: isCompleted ? 'line-through' : 'none' }}>
                      {block.title}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--color-bg-surface-3)', ...textStyle }}>
                      {block.category}
                    </span>
                  </div>
                  <div className="text-xs mt-1 flex items-center gap-2" style={textStyle}>
                    <span>{formatTime(block.startTime)} - {formatTime(block.endTime)}</span>
                    <span>•</span>
                    <span>{duration} 分钟</span>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditModal(block)
                    }}
                    className="px-2 py-1 text-xs rounded hover:opacity-80 transition-colors"
                    style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
                  >
                    编辑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(block.id)
                    }}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 添加/编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-md border" style={{ ...cardStyle, ...borderStyle }}>
            <h3 className="text-xl font-semibold mb-4" style={titleStyle}>
              {editingBlock ? '编辑时间块' : '添加时间块'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium text-[var(--color-text-secondary)] mb-1`}>
                  标题
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="例如：完成需求文档"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium text-[var(--color-text-secondary)] mb-1`}>
                  分类
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ActivityCategory)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={inputStyle}
                >
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium text-[var(--color-text-secondary)] mb-1`}>
                  开始时间
                </label>
                <input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium text-[var(--color-text-secondary)] mb-1`}>
                  持续时长 (分钟)
                </label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg hover:opacity-80 transition-colors"
                style={{ background: 'var(--color-bg-surface-3)', color: 'var(--color-text-secondary)' }}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-[var(--color-accent)] text-[#fffefb] rounded-lg hover:opacity-90 transition-colors"
              >
                {editingBlock ? '保存修改' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeBlockPlanner
