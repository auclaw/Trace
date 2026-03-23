// 今日活动时间线 - 模仿 Rize 原版设计
// 水平滚动时间线，色块长度对应时长，不同分类不同颜色

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

interface TimelineProps {
  activities: Activity[]
  onEditCategory: (id: string, currentCategory: string | null) => void
  onDelete: (id: string) => void
}

const Timeline: React.FC<TimelineProps> = ({ activities, onEditCategory, onDelete }) => {
  const [hoveredActivity, setHoveredActivity] = useState<Activity | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 按开始时间排序
  const sortedActivities = [...activities].sort((a, b) => {
    return a.startTimeMs - b.startTimeMs
  })

  // 计算一天的开始毫秒（当天 0:00）
  const dayStart = sortedActivities.length > 0
    ? Math.floor(sortedActivities[0].startTimeMs / 86400000) * 86400000
    : 0
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
        y: e.clientY - rect.top
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

  if (sortedActivities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">今日时间线</h3>
        <div className="text-center py-12 text-gray-500">
          暂无活动记录，等待追踪...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200" ref={containerRef} onMouseMove={handleMouseMove}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">今日时间线</h3>
      <div className="overflow-x-auto">
        <div
          className="min-w-[800px] relative"
          style={{ height: '64px' }}
        >
          {/* 时间线背景格子 - 每小时一条线，包含 24:00 */}
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-gray-100"
              style={{ left: `${(i / 24) * 100}%` }}
            >
              <span className="absolute -top-6 left-0 text-xs text-gray-400 transform -translate-x-1/2">
                {i}:00
              </span>
            </div>
          ))}

          {/* 活动色块 - 每个活动根据绝对开始时间定位 */}
          {sortedActivities.map((activity) => {
            // 计算相对于当天开始的偏移百分比
            const startMs = activity.startTimeMs - dayStart
            const endMs = startMs + (activity.durationMinutes * 60 * 1000)

            // Clamp to [0, 100%]
            const startPercentage = Math.max(0, (startMs / totalDayMs) * 100)
            const endPercentage = Math.min(100, (endMs / totalDayMs) * 100)
            const widthPercentage = endPercentage - startPercentage

            const category = activity.category || '未分类'
            const color = getCategoryColor(category)

            return (
              <div
                key={activity.id}
                className="absolute top-1 bottom-1 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:scale-y-110"
                style={{
                  left: `${startPercentage}%`,
                  width: `${widthPercentage}%`,
                  minWidth: '8px',
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
              />
            )
          })}
        </div>

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
            <div className="text-gray-300 flex gap-2 mt-1">
              <span>{hoveredActivity.name}</span>
              <span>•</span>
              <span>{hoveredActivity.category || '未分类'}</span>
              <span>•</span>
              <span>{formatStartTime(hoveredActivity.startTimeMs)}</span>
              <span>•</span>
              <span>{formatDuration(hoveredActivity.durationMinutes)}</span>
            </div>
          </div>
        )}

        {/* 分类选择下拉框 */}
        {editingActivity && (
          <div
            className="absolute bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-20 w-64"
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

        <div className="mt-8 text-xs text-gray-500 flex items-center gap-4">
          <span>💡 点击色块修改分类，右键删除记录。色块长度对应耗时。</span>
        </div>
      </div>
    </div>
  )
}

export default Timeline
