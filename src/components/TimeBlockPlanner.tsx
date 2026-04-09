// TimeBlock Planner Component
// 时间块日程规划组件 - 可拖拽安排一天任务
// 集成 AI 智能排期建议

import React, { useState, useEffect, useCallback } from 'react'
import type { Theme } from '../App'
import type { TimeBlockDTO, TaskDTO } from '../utils/api'
import {
  getTimeblocks,
  createTimeblock,
  updateTimeblock,
  deleteTimeblock,
  toggleTimeblockCompleted,
  aiSuggestSchedule,
  getTasks
} from '../utils/api'

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
  const [formCategory, setFormCategory] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formStartTime, setFormStartTime] = useState('09:00')
  const [formDuration, setFormDuration] = useState('60')
  const [formTaskId, setFormTaskId] = useState<number | null>(null)

  const formatDateYMD = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const parseTimeToDate = (timeStr: string, baseDate: Date): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const date = new Date(baseDate)
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const dateStr = formatDateYMD(selectedDate)
      const [blocksData, tasksData] = await Promise.all([
        getTimeblocks(dateStr),
        getTasks()
      ])
      // 按开始时间排序
      blocksData.sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
      setTimeblocks(blocksData)
      setTasks(tasksData.filter(t => t.status !== 'completed'))
    } catch (err) {
      console.error('加载时间块失败', err)
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
    setFormCategory('')
    setFormNotes('')
    setFormStartTime(currentTime)
    setFormDuration('60')
    setFormTaskId(null)
    setEditingBlock(null)
    setShowModal(true)
  }

  const openEditModal = (block: TimeBlockDTO) => {
    const start = new Date(block.start_time)
    const timeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
    setFormTitle(block.title)
    setFormCategory(block.category || '')
    setFormNotes(block.notes || '')
    setFormStartTime(timeStr)
    setFormDuration(block.duration_minutes.toString())
    setFormTaskId(block.task_id || null)
    setEditingBlock(block)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingBlock(null)
  }

  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      alert('请输入标题')
      return
    }

    const startDt = parseTimeToDate(formStartTime, selectedDate)
    const duration = parseInt(formDuration) || 30
    const endDt = new Date(startDt.getTime() + duration * 60 * 1000)

    const data: Partial<TimeBlockDTO> = {
      title: formTitle,
      category: formCategory || undefined,
      notes: formNotes || undefined,
      start_time: startDt.toISOString(),
      end_time: endDt.toISOString(),
      duration_minutes: duration,
      task_id: formTaskId || undefined,
    }

    try {
      if (editingBlock) {
        await updateTimeblock(editingBlock.id, data)
      } else {
        await createTimeblock(data)
      }
      closeModal()
      await loadData()
    } catch (err) {
      console.error('保存失败', err)
      alert('保存失败')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个时间块吗？')) return
    try {
      await deleteTimeblock(id)
      await loadData()
    } catch (err) {
      console.error('删除失败', err)
      alert('删除失败')
    }
  }

  const handleToggleCompleted = async (block: TimeBlockDTO) => {
    try {
      await toggleTimeblockCompleted(block.id)
      await loadData()
    } catch (err) {
      console.error('切换状态失败', err)
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
      const suggestions = await aiSuggestSchedule(
        pendingTasks.map(t => ({
          title: t.title,
          estimated_minutes: t.estimated_minutes || 30
        })),
        Math.max(availableHours, 1)
      )

      // 保存建议的时间块
      for (const suggestion of suggestions) {
        await createTimeblock(suggestion)
      }

      await loadData()
      alert(`AI 已为你推荐 ${suggestions.length} 个时间块`)
    } catch (err) {
      console.error('AI 建议失败', err)
      alert('AI 建议失败，请稍后重试')
    } finally {
      setSuggesting(false)
    }
  }

  const formatTime = (isoStr: string): string => {
    const d = new Date(isoStr)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const getCategoryColor = (category?: string): string => {
    if (!category) return 'bg-blue-500'
    const colors: Record<string, string> = {
      '工作': 'bg-blue-500',
      '开发': 'bg-indigo-500',
      '学习': 'bg-green-500',
      '会议': 'bg-yellow-500',
      '社交': 'bg-purple-500',
      '娱乐': 'bg-pink-500',
      '视频': 'bg-red-500',
      '休息': 'bg-gray-500',
    }
    return colors[category] || 'bg-blue-500'
  }

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
            const isCompleted = block.is_completed === 1
            const categoryColor = getCategoryColor(block.category)
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
                    {block.category && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--color-bg-surface-3)', ...textStyle }}>
                        {block.category}
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-1 flex items-center gap-2" style={textStyle}>
                    <span>{formatTime(block.start_time)} - {formatTime(block.end_time)}</span>
                    <span>•</span>
                    <span>{block.duration_minutes} 分钟</span>
                    {block.notes && (
                      <>
                        <span>•</span>
                        <span className="truncate">{block.notes}</span>
                      </>
                    )}
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
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="例如：开发、工作、会议"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={inputStyle}
                />
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

              <div>
                <label className={`block text-sm font-medium text-[var(--color-text-secondary)] mb-1`}>
                  备注 (可选)
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="额外说明..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={inputStyle}
                />
              </div>

              {tasks.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium text-[var(--color-text-secondary)] mb-1`}>
                    关联任务 (可选)
                  </label>
                  <select
                    value={formTaskId || ''}
                    onChange={(e) => setFormTaskId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={inputStyle}
                  >
                    <option value="">无</option>
                    {tasks.map(task => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
