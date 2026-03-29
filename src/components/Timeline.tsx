// 今日活动时间线 - 垂直时间线，色块高度对应时长，不同分类不同颜色

import React, { useState, useRef } from 'react'
import { Activity } from '../utils/tracking'

// 分类颜色映射 - 现代明快配色，年轻活力且不失专业
const CATEGORY_COLORS: Record<string, string> = {
  '开发': '#0099FF',      // 亮蓝色 - 年轻活力
  '工作': '#22C55E',      // 翠绿色 - 清新积极
  '学习': '#A78BFA',      // 柔紫色 - 优雅知性
  '设计': '#F59E0B',      // 橙色
  '娱乐': '#FF9A3C',      // 暖橙色 - 明快活泼
  '视频': '#EF4444',      // 红色
  '音乐': '#8B5CF6',      // 紫色
  '社交/通讯': '#FF6B6B',  // 珊瑚红 - 温暖亲切
  '社交': '#FF6B6B',      // 珊瑚红
  '浏览': '#8B95A6',      // 蓝灰 - 低调内敛
  '工具使用': '#22D3EE',   // 天青色 - 清爽干净
  '笔记': '#10B981',      // 绿色
  '购物': '#EC4899',      // 粉色
  '游戏': '#6366F1',      // 靛蓝
  '其他': '#D1D5DB',      // 浅灰
  '未分类': '#D1D5DB',    // 浅灰 - 中性低调
}

// 常用分类列表供快速选择
const COMMON_CATEGORIES = [
  '开发', '工作', '学习', '设计', '娱乐', '视频', '音乐',
  '社交/通讯', '浏览', '工具使用', '笔记', '购物', '游戏', '其他', '未分类'
]

// 合并配置 - 2分钟阈值
const MERGE_GAP_THRESHOLD_MS = 2 * 60 * 1000 // 2分钟

// 显示inline text的最小高度百分比 - 至少需要占 ~20 分钟 (20/1440 = ~1.4%)
const MIN_HEIGHT_PERCENT_FOR_TEXT = 1.4

const getCategoryColor = (category?: string): string => {
  if (!category) return CATEGORY_COLORS['未分类']
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category]
  // 对未知分类生成一个基于字符串hash的颜色
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = hash % 360
  return `hsl(${h}, 70%, 60%)`
}

// 合并连续活动：间隙小于阈值且同一个应用 -> 合并为一个区块
interface MergedActivity {
  id: string
  startTimeMs: number
  endTimeMs: number
  durationMinutes: number
  name: string
  windowTitle: string
  category: string | null
}

const mergeContiguousActivities = (sorted: Activity[]): MergedActivity[] => {
  if (sorted.length === 0) return []

  const result: MergedActivity[] = []
  let current: MergedActivity | null = null

  for (const activity of sorted) {
    const category = activity.category || '未分类'
    if (!current) {
      // Start first merged activity
      current = {
        id: activity.id,
        startTimeMs: activity.startTimeMs,
        endTimeMs: activity.startTimeMs + activity.durationMinutes * 60 * 1000,
        durationMinutes: activity.durationMinutes,
        name: activity.name,
        windowTitle: activity.windowTitle,
        category: category,
      }
    } else {
      // Check if we can merge with current
      const gap = activity.startTimeMs - current.endTimeMs
      const sameName = activity.name === current.name
      const sameCategory = (activity.category || '未分类') === current.category

      if (gap <= MERGE_GAP_THRESHOLD_MS && sameName && sameCategory) {
        // Merge it
        current.endTimeMs = activity.startTimeMs + activity.durationMinutes * 60 * 1000
        current.durationMinutes += activity.durationMinutes
        // Keep the first id for editing - if user deletes, it removes the whole merged block
        // This is acceptable behavior for automatic merging
      } else {
        // Push current and start new
        result.push(current)
        current = {
          id: activity.id,
          startTimeMs: activity.startTimeMs,
          endTimeMs: activity.startTimeMs + activity.durationMinutes * 60 * 1000,
          durationMinutes: activity.durationMinutes,
          name: activity.name,
          windowTitle: activity.windowTitle,
          category: category,
        }
      }
    }
  }

  if (current) {
    result.push(current)
  }

  return result
}

interface TimelineProps {
  activities: Activity[]
  onEditCategory: (id: string, currentCategory: string | null) => void
  onDelete: (id: string) => void
  isDark: boolean
}

const Timeline: React.FC<TimelineProps> = ({ activities, onEditCategory, onDelete, isDark }) => {
  const [hoveredActivity, setHoveredActivity] = useState<any | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const [editingActivity, setEditingActivity] = useState<any | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 按开始时间排序
  const sortedActivities = [...activities].sort((a, b) => {
    return a.startTimeMs - b.startTimeMs
  })

  // 合并连续活动
  const mergedActivities = mergeContiguousActivities(sortedActivities)

  // 计算一天的开始毫秒（当天 0:00）
  const dayStart = sortedActivities.length > 0
    ? Math.floor(sortedActivities[0].startTimeMs / 86400000) * 86400000
    : Math.floor(Date.now() / 86400000) * 86400000
  const totalDayMs = 86400000 // 24 小时 = 86400000 毫秒

  // 格式化开始时间
  const formatStartTime = (startTimeMs: number): string => {
    const date = new Date(startTimeMs)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }


  // 格式化时长
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? ` ${mins}分` : ''}`
    }
    return `${mins}分钟`
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setHoverPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleCategorySelect = (category: string) => {
    if (editingActivity) {
      onEditCategory(editingActivity.id, editingActivity.category)
      // 这里需要实际修改，我们通过传入的回调处理，但是原来的onEditCategory会弹出prompt
      // 我们现在已经处理了选择，直接在这里调用update
      // 由于原API设计，我们还是让父组件处理，但是传入新值
      // 这里hack一下：创建一个自定义prompt替换
      const originalPrompt = window.prompt
      window.prompt = () => category
      onEditCategory(editingActivity.id, editingActivity.category)
      window.prompt = originalPrompt
      setEditingActivity(null)
    }
  }

  const handleCustomCategory = () => {
    if (editingActivity) {
      const category = prompt('请输入自定义分类', editingActivity.category || '')
      if (category !== null) {
        onEditCategory(editingActivity.id, editingActivity.category)
      }
      setEditingActivity(null)
    }
  }

  // 总高度 600px 对应 24 小时
  const totalHeight = 600

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`} ref={containerRef} onMouseMove={handleMouseMove}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>今日时间线</h3>
      <div className="overflow-y-auto">
        <div
          className="relative ml-12"
          style={{ minHeight: `${totalHeight}px` }}
        >
          {/* 时间线背景格子 - 每小时一条水平线，包含 24:00 */}
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className={`absolute left-0 right-0 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              style={{ top: `${(i / 24) * 100}%` }}
            >
              <span className={`absolute -left-12 -top-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} w-10 text-right`}>
                {i}:00
              </span>
            </div>
          ))}

          {/* 活动色块 - 每个活动根据绝对开始时间垂直定位，高度对应时长 */}
          {mergedActivities.map((activity) => {
            // 计算相对于当天开始的偏移百分比
            const startMs = activity.startTimeMs - dayStart
            const endMs = activity.endTimeMs

            // Clamp to [0, 100%]
            const startPercentage = Math.max(0, (startMs / totalDayMs) * 100)
            const endPercentage = Math.min(100, (endMs / totalDayMs) * 100)
            const heightPercentage = endPercentage - startPercentage

            const category = activity.category || '未分类'
            const color = getCategoryColor(category)
            const showInlineText = heightPercentage >= MIN_HEIGHT_PERCENT_FOR_TEXT

            return (
              <div
                key={activity.id}
                className="absolute left-1 right-1 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:scale-x-105"
                style={{
                  top: `${startPercentage}%`,
                  height: `${heightPercentage}%`,
                  minHeight: '8px',
                  backgroundColor: color,
                  opacity: editingActivity?.id === activity.id ? 1 : 0.85,
                  outline: editingActivity?.id === activity.id ? '2px solid white' : 'none',
                }}
                onMouseEnter={() => setHoveredActivity(activity)}
                onMouseLeave={() => setHoveredActivity(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingActivity(activity)
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  if (confirm('确定删除这条记录？')) {
                    onDelete(activity.id)
                  }
                }}
              >
                {showInlineText && (
                  <div className="absolute inset-0 px-2 py-1 overflow-hidden">
                    <div className="text-white text-xs font-medium truncate opacity-90">
                      {activity.windowTitle || activity.name}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {sortedActivities.length === 0 && (
          <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            暂无活动记录，等待系统采集...
          </div>
        )}

        {/* 悬浮信息卡片 */}
        {hoveredActivity && (
          <div
            className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs z-10 pointer-events-none animate-in fade-in duration-150"
            style={{
              left: `${Math.min(hoverPosition.x + 10, (containerRef.current?.clientWidth || 800) - 200)}px`,
              top: `${hoverPosition.y + 20}px`,
              maxWidth: '250px',
            }}
          >
            <div className="font-semibold truncate">{hoveredActivity.windowTitle}</div>
            <div className="text-gray-300 flex flex-col gap-1 mt-1">
              <div>{hoveredActivity.name} • {hoveredActivity.category || '未分类'}</div>
              <div>
                {formatStartTime(hoveredActivity.startTimeMs)} ~ {formatStartTime(hoveredActivity.endTimeMs)}
                • {formatDuration(hoveredActivity.durationMinutes)}
              </div>
            </div>
          </div>
        )}

        {/* 分类选择下拉框 */}
        {editingActivity && (
          <div
            className={`absolute bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-20 w-64`}
            style={{
              left: `${Math.min(hoverPosition.x, (containerRef.current?.clientWidth || 800) - 260)}px`,
              top: `${hoverPosition.y + 30}px`,
            }}
          >
            <div className="text-sm font-medium text-gray-900 mb-2">选择分类</div>
            <div className="grid grid-cols-2 gap-1">
              {COMMON_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-2 py-1 text-sm rounded text-left transition-colors ${
                    editingActivity.category === cat
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  style={editingActivity.category !== cat ? { backgroundColor: `${getCategoryColor(cat)}20` } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <button
                onClick={handleCustomCategory}
                className="w-full px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                + 自定义分类
              </button>
            </div>
            <button
              onClick={() => setEditingActivity(null)}
              className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center rounded-full"
            >
              ×
            </button>
          </div>
        )}

        {/* 点击外部关闭编辑框 */}
        {editingActivity && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setEditingActivity(null)}
          />
        )}

        <div className="mt-6 text-xs text-gray-500 flex items-center gap-4">
          <span>💡 点击色块修改分类，右键删除记录。色块高度对应耗时。</span>
        </div>
      </div>
    </div>
  )
}

export default Timeline
