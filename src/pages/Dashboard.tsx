import { useState, useEffect, useCallback, useRef } from 'react'
import { getTodayStats, getTodayActivities, classifyActivity, deleteActivity, updateActivityCategory, toggleTracking, Activity, DailyStats } from '../utils/tracking'
import { toPng } from 'html-to-image'
import Timeline from '../components/Timeline'
import type { Theme } from '../App'

interface DashboardProps {
  theme: Theme
  isTracking: boolean
  onTrackingChange: (status: boolean) => void
}

// 默认每日目标 4 小时 = 240 分钟
const DEFAULT_DAILY_GOAL = 240
const DAILY_GOAL_KEY = 'merize_daily_goal'

const Dashboard: React.FC<DashboardProps> = ({ theme, isTracking, onTrackingChange }) => {
  const isDark = theme === 'dark'
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryStats, setCategoryStats] = useState<{category: string, duration: number}[]>([])
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(() => {
    const saved = localStorage.getItem(DAILY_GOAL_KEY)
    return saved ? parseInt(saved, 10) : DEFAULT_DAILY_GOAL
  })
  const [showEditGoal, setShowEditGoal] = useState(false)
  const [editGoalValue, setEditGoalValue] = useState('')
  const todayShareRef = useRef<HTMLDivElement>(null)

  // Check if native share is supported
  const supportsShare = typeof navigator !== 'undefined' && navigator.share !== undefined

  const loadData = useCallback(async () => {
    try {
      const [statsData, activitiesData] = await Promise.all([
        getTodayStats(),
        getTodayActivities()
      ])
      setStats(statsData)
      setActivities(activitiesData)

      // 计算分类统计
      const categoryMap: {[key: string]: number} = {}
      for (const act of activitiesData) {
        const cat = act.category || '未分类'
        categoryMap[cat] = (categoryMap[cat] || 0) + act.durationMinutes
      }
      const catStats = Object.entries(categoryMap).map(([category, duration]) => ({
        category, duration
      })).sort((a, b) => b.duration - a.duration)
      setCategoryStats(catStats)
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    // 每分钟刷新一次数据，让当前活动时长实时更新
    const interval = setInterval(() => {
      loadData()
    }, 60000)

    return () => clearInterval(interval)
  }, [loadData])

  const formatDurationMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? ` ${mins}分` : ''}`
    }
    return `${Math.round(minutes)}分钟`
  }

  const handleClassifyAll = async () => {
    const unclassified = activities.filter(a => !a.category)
    if (unclassified.length === 0) {
      alert('所有活动已经完成分类')
      return
    }
    if (!confirm(`即将对 ${unclassified.length} 条未分类活动进行AI分类，继续吗？`)) {
      return
    }
    for (const act of unclassified) {
      try {
        const category = await classifyActivity(act.name, act.windowTitle)
        await updateActivityCategory(act.id, category)
      } catch (e) {
        console.error('分类失败', e)
      }
    }
    await loadData()
    alert(`分类完成！共处理 ${unclassified.length} 条活动`)
  }

  const handleChangeCategory = async (id: string, currentCategory: string | null) => {
    // Timeline 已经提供了选择界面，这里保留原逻辑兼容prompt方式
    const newCategory = prompt('请输入新分类', currentCategory || '')
    if (newCategory !== null) {
      await updateActivityCategory(id, newCategory)
      await loadData()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      await deleteActivity(id)
      await loadData()
    }
  }

  // 生成今日成就分享图片
  const generateTodayShare = async () => {
    if (!todayShareRef.current || categoryStats.length === 0) return

    try {
      setGeneratingImage(true)
      setShareError(null)
      const dataUrl = await toPng(todayShareRef.current, {
        backgroundColor: isDark ? '#0F3460' : '#0F3460',
        quality: 0.95
      })
      setGeneratedImageUrl(dataUrl)

      // Auto download on first generate
      const dateStr = new Date().toLocaleDateString('zh-CN')
      const link = document.createElement('a')
      link.download = `merize-today-${dateStr.replace(/\//g, '-')}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('生成图片失败', error)
      setShareError('生成图片失败: ' + error)
    } finally {
      setGeneratingImage(false)
    }
  }

  // Download image to file
  const downloadImage = () => {
    if (!generatedImageUrl) return
    const dateStr = new Date().toLocaleDateString('zh-CN')
    const link = document.createElement('a')
    link.download = `merize-today-${dateStr.replace(/\//g, '-')}.png`
    link.href = generatedImageUrl
    link.click()
  }

  // Copy image to clipboard
  const copyImageToClipboard = async () => {
    if (!generatedImageUrl) return
    try {
      setShareError(null)
      // Convert data URL to blob
      const response = await fetch(generatedImageUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ])
      alert('图片已复制到剪贴板！可以直接粘贴到小红书/微信了')
    } catch (error) {
      console.error('复制失败', error)
      setShareError('复制到剪贴板失败: ' + error)
    }
  }

  // Native share dialog
  const shareImage = async () => {
    if (!generatedImageUrl || !supportsShare) return
    try {
      setShareError(null)
      const response = await fetch(generatedImageUrl)
      const blob = await response.blob()
      const file = new File([blob], `merize-today-${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.png`, { type: 'image/png' })

      await navigator.share({
        files: [file],
        title: 'merize 今日成就',
        text: '#merize #时间管理 #自律 #效率提升',
      })
    } catch (error) {
      console.error('分享失败', error)
      if ((error as Error).name !== 'AbortError') {
        setShareError('分享失败: ' + error)
      }
    }
  }

  const totalMinutes = categoryStats.reduce((sum, item) => sum + item.duration, 0)
  const goalPercentage = Math.min(100, (totalMinutes / dailyGoalMinutes) * 100)

  // 获取鼓励文案
  const getMotivationalMessage = () => {
    if (goalPercentage >= 100) return '🎉 恭喜完成今日目标！太棒了！'
    if (goalPercentage >= 75) return '💪 加油！离目标不远了！'
    if (goalPercentage >= 50) return '👍 已完成一半，继续保持！'
    if (goalPercentage >= 25) return '⭐ 正在进步，保持专注！'
    return '🌱 开始今天的专注之旅吧！'
  }

  // 保存每日目标
  const saveDailyGoal = () => {
    const minutes = parseInt(editGoalValue, 10) * 60
    if (!isNaN(minutes) && minutes > 0) {
      setDailyGoalMinutes(minutes)
      localStorage.setItem(DAILY_GOAL_KEY, minutes.toString())
    }
    setShowEditGoal(false)
  }

  // 打开编辑目标弹窗
  const openEditGoal = () => {
    setEditGoalValue((dailyGoalMinutes / 60).toString())
    setShowEditGoal(true)
  }

  // Get semantic color for category based on Aether pattern
  const getCategoryColor = (category: string): string => {
    const lower = category.toLowerCase()
    if (lower.includes('专注') || lower.includes('work') || lower.includes('开发') || lower.includes('编程')) {
      return isDark ? '#34c759' : '#34c759'
    }
    if (lower.includes('会议') || lower.includes('meeting') || lower.includes('讨论')) {
      return isDark ? '#5aa9e6' : '#5aa9e6'
    }
    if (lower.includes('休息') || lower.includes('break') || lower.includes('放松')) {
      return isDark ? '#ff9500' : '#ff9500'
    }
    return isDark ? '#86868b' : '#6e6e73'
  }

  // Z-pattern layout classes - Aether Design System
  const baseCardClasses = `bg-${isDark ? 'aether-dark-200' : 'aether-200'} rounded-card shadow-subtle transition-all duration-300`
  const textPrimary = isDark ? 'text-aether-text-dark-primary' : 'text-aether-text-primary'
  const textSecondary = isDark ? 'text-aether-text-dark-secondary' : 'text-aether-text-secondary'
  const borderSubtle = `border border-[var(--color-border-subtle)]`

  // Focus session active: apply minimal cognitive load - dim non-essential elements
  const containerClasses = `min-h-screen p-4 md:p-8 content-max-width ${isTracking ? 'focus-session-active' : ''}`

  return (
    <div className={containerClasses}>
      {/* Z-pattern Step 1: TOP-LEFT - Daily Focus Goal */}
      <div className={`${baseCardClasses} p-6 mb-8 focus-essential`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className={`font-serif text-xl md:text-2xl font-semibold ${textPrimary} mb-2`}>
              🎯 今日专注目标
            </h1>
            <p className={textSecondary}>
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
              {isTracking ? ' • 🔍 正在追踪中' : ' • ⏸️ 追踪已暂停'}
            </p>
          </div>
          <button
            onClick={async () => {
              const newStatus = await toggleTracking(!isTracking)
              onTrackingChange(newStatus)
            }}
            className={`px-4 py-2 rounded-button font-medium transition-all duration-150 ${
              isTracking
                ? (isDark ? 'bg-[#92400E]/30 text-[#FBBF24] hover:bg-[#92400E]/50' : 'bg-[#92400E]/10 text-[#92400E] hover:bg-[#92400E]/20')
                : (isDark ? 'bg-[#065F46]/30 text-[#34D399] hover:bg-[#065F46]/50' : 'bg-[#065F46]/10 text-[#065F46] hover:bg-[#065F46]/20')
            }`}
          >
            {isTracking ? '暂停追踪' : '开始追踪'}
          </button>
        </div>

        {/* 当前活动显示 - 正在追踪时显示 */}
        {isTracking && activities.length > 0 && (
          <div className={`mt-4 p-4 rounded-card ${borderSubtle} bg-[var(--color-bg-surface-2)]`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${textSecondary} mb-1`}>当前正在处理</p>
                {(() => {
                  // 获取最后一个活动（当前正在进行）
                  const sorted = [...activities].sort((a, b) => b.startTimeMs - a.startTimeMs)
                  const current = sorted[0]
                  const currentDuration = (Date.now() - current.startTimeMs) / (1000 * 60)
                  return (
                    <div>
                      <p className={`font-medium ${textPrimary} truncate`}>{current.windowTitle}</p>
                      <p className={`text-sm ${textSecondary} mt-1`}>
                        {current.name} • {current.category || '未分类'} • 已进行 {formatDurationMinutes(Math.round(currentDuration))}
                      </p>
                    </div>
                  )
                })()}
              </div>
              <div className="w-3 h-3 rounded-full bg-[var(--color-success)] animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Daily Goal Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm ${textSecondary}`}>目标进度</span>
            <button
              onClick={openEditGoal}
              className={`px-3 py-1 text-sm ${isDark ? 'bg-aether-dark-300 text-aether-text-dark-secondary hover:bg-aether-dark-300/80' : 'bg-aether-300 text-aether-text-secondary hover:bg-aether-300/80'} rounded-button transition-colors`}
            >
              修改目标
            </button>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className={textSecondary}>
                  {formatDurationMinutes(totalMinutes)} / {formatDurationMinutes(dailyGoalMinutes)}
                </span>
                <span className={textSecondary}>
                  {Math.round(goalPercentage)}%
                </span>
              </div>
              <div className={`h-4 rounded-full overflow-hidden ${isDark ? 'bg-aether-dark-300' : 'bg-aether-300'}`}>
                <div
                  className={`h-full transition-all duration-500 ${
                    goalPercentage >= 100
                      ? 'bg-[var(--color-success)]'
                      : 'bg-[var(--color-accent)]'
                  }`}
                  style={{ width: `${goalPercentage}%` }}
                ></div>
              </div>
              <div className={`mt-3 text-sm font-medium ${
                goalPercentage >= 100
                  ? 'text-[var(--color-success)]'
                  : textSecondary
              }`}>
                {getMotivationalMessage()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Z-pattern Step 2: CENTER - Focus Timer & Live Flow Score (when active) */}
      {isTracking && (
        <div className={`mb-8 text-center focus-essential`}>
          <div className={`${baseCardClasses} p-8 inline-block ${isTracking ? 'animate-breath' : ''}`}>
            {activities.length > 0 && (
              <>
                {(() => {
                  const sorted = [...activities].sort((a, b) => b.startTimeMs - a.startTimeMs)
                  const current = sorted[0]
                  const currentDuration = (Date.now() - current.startTimeMs) / (1000 * 60)
                  const hours = Math.floor(currentDuration / 60)
                  const minutes = Math.floor(currentDuration % 60)
                  const seconds = Math.floor((currentDuration * 60) % 60)

                  // Calculate simple Flow Score based on session continuity
                  const flowScore = currentDuration > 30
                    ? Math.min(95, 70 + Math.floor(currentDuration / 5))
                    : Math.max(40, 30 + Math.floor(currentDuration * 1.5))

                  return (
                    <>
                      <div className="font-sans font-light text-[clamp(3rem,8vw,5rem)] leading-none tracking-tight text-[var(--color-accent)]">
                        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                      </div>
                      <div className={`mt-4 ${textSecondary} text-sm`}>当前专注会话</div>
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm ${textSecondary}`}>Live Flow Score</span>
                          <span className={`text-sm font-semibold ${textPrimary}`}>{Math.round(flowScore)}%</span>
                        </div>
                        <div className={`w-48 h-2 rounded-full overflow-hidden ${isDark ? 'bg-aether-dark-300' : 'bg-aether-300'}`}>
                          <div
                            className="h-full bg-[var(--color-accent)] transition-all duration-1000"
                            style={{ width: `${flowScore}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )
                })()}
              </>
            )}
          </div>
        </div>
      )}

      {/* Rize 风格时间线 - always present but dimmed when focus active */}
      <div className="mb-8">
        <Timeline
          activities={activities}
          onEditCategory={handleChangeCategory}
          onDelete={handleDelete}
          isDark={isDark}
        />
      </div>

      {/* Z-pattern Step 3: BOTTOM - Insight Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Statistics - Donut style similar to Rize */}
        <div className={`${baseCardClasses} p-6 ${borderSubtle}`}>
          <h3 className={`text-lg font-semibold ${textPrimary} mb-6`}>分类统计</h3>
          {loading ? (
            <div className={`text-center py-8 ${textSecondary}`}>加载中...</div>
          ) : categoryStats.length === 0 ? (
            <div className={`text-center py-8 ${textSecondary}`}>
              暂无活动记录，等待系统追踪...
            </div>
          ) : (
            <div className="space-y-3">
              {categoryStats
                .map(stat => (
                  <div key={stat.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: getCategoryColor(stat.category) }}
                      />
                      <span className={`text-base font-medium ${textPrimary}`}>{stat.category}</span>
                    </div>
                    <span className={`${textSecondary} font-medium`}>{formatDurationMinutes(stat.duration)}</span>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className={`${baseCardClasses} p-6 ${borderSubtle}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${textPrimary}`}>原始活动记录</h3>
            {activities.some(a => !a.category) && (
              <button
                onClick={handleClassifyAll}
                className="px-3 py-1 bg-[var(--color-accent)] text-white text-sm rounded-button hover:bg-[var(--color-accent)]/90 transition-colors"
              >
                AI 一键分类
              </button>
            )}
          </div>
          {loading ? (
            <div className={`text-center py-8 ${textSecondary}`}>加载中...</div>
          ) : activities.length === 0 ? (
            <div className={`text-center py-8 ${textSecondary}`}>
              暂无活动记录
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {activities.slice().reverse().map(act => {
                const start = new Date(act.startTimeMs)
                const startTimeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
                const endMs = act.startTimeMs + act.durationMinutes * 60 * 1000
                const endDate = new Date(endMs)
                const endTimeStr = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
                return (
                <div key={act.id} className={`flex items-center justify-between p-3 border ${borderSubtle} rounded-card transition-colors ${
                  isDark ? 'hover:bg-aether-dark-300' : 'hover:bg-aether-300'
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${textPrimary} truncate`}>
                      {startTimeStr} - {endTimeStr} • {act.windowTitle}
                    </div>
                    <div className={textSecondary}>
                      {act.name} • {act.category || '未分类'} • {formatDurationMinutes(act.durationMinutes)}
                    </div>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={() => handleChangeCategory(act.id, act.category)}
                      className={`px-2 py-1 text-xs ${isDark ? 'bg-aether-dark-300 text-aether-text-dark-secondary hover:bg-aether-dark-300/80' : 'bg-aether-300 text-aether-text-secondary hover:bg-aether-300/80'} rounded-button transition-colors`}
                    >
                      修改
                    </button>
                    <button
                      onClick={() => handleDelete(act.id)}
                      className="px-2 py-1 text-xs bg-[#92400E]/10 text-[#92400E] rounded-button hover:bg-[#92400E]/20 dark:bg-[#92400E]/30 dark:text-[#FBBF24] transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 分享按钮区域 */}
      {categoryStats.length > 0 && (
        <div className={`mb-8 ${baseCardClasses} p-6 ${borderSubtle}`}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-1`}>小红书分享</h3>
                <p className={`text-sm ${textSecondary}`}>生成今日成就卡片，分享到小红书打卡自律</p>
              </div>
              {!generatedImageUrl && (
                <button
                  onClick={generateTodayShare}
                  disabled={generatingImage}
                  className="px-6 py-3 bg-[var(--color-accent)] text-white rounded-card hover:bg-[var(--color-accent)]/90 disabled:opacity-50 transition-colors"
                >
                  {generatingImage ? '生成中...' : '📷 生成今日分享图'}
                </button>
              )}
            </div>

            {shareError && (
              <div className={`p-3 rounded-card ${isDark ? 'bg-[#92400E]/20 text-[#FBBF24]' : 'bg-[#92400E]/10 text-[#92400E]'} text-sm`}>
                {shareError}
              </div>
            )}

            {generatedImageUrl && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={downloadImage}
                  className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm rounded-button hover:bg-[var(--color-accent)]/90 transition-colors"
                >
                  💾 下载图片
                </button>
                <button
                  onClick={copyImageToClipboard}
                  className="px-4 py-2 bg-[var(--color-success)] text-white text-sm rounded-button hover:bg-[var(--color-success)]/90 transition-colors"
                >
                  📋 复制到剪贴板
                </button>
                {supportsShare && (
                  <button
                    onClick={shareImage}
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-button hover:bg-purple-700 transition-colors"
                  >
                    📤 分享...
                  </button>
                )}
                <button
                  onClick={() => {
                    setGeneratedImageUrl(null)
                    setShareError(null)
                  }}
                  className={`px-4 py-2 text-sm ${isDark ? 'bg-aether-dark-300 text-aether-text-dark-secondary hover:bg-aether-dark-300/80' : 'bg-aether-300 text-aether-text-secondary hover:bg-aether-300/80'} rounded-button transition-colors`}
                >
                  重新生成
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 编辑目标弹窗 */}
      {showEditGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-aether-dark-200' : 'bg-aether-200'} rounded-card shadow-elevated p-6 w-full max-w-sm`}>
            <h3 className={`text-xl font-semibold ${textPrimary} mb-4`}>修改每日专注目标</h3>
            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-aether-text-dark-secondary' : 'text-aether-text-secondary'} mb-2`}>
                每日目标（小时）
              </label>
              <input
                type="number"
                min="1"
                max="16"
                step="0.5"
                value={editGoalValue}
                onChange={(e) => setEditGoalValue(e.target.value)}
                className={`w-full px-3 py-2 border ${borderSubtle} rounded-button focus:outline-none focus:shadow-focus-ring ${
                  isDark ? 'bg-aether-dark-300 text-aether-text-dark-primary' : 'bg-white text-aether-text-primary'
                }`}
              />
              <p className={`text-xs ${textSecondary} mt-1`}>推荐: 4 小时工作，8 小时全天专注</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowEditGoal(false)}
                className={`px-4 py-2 ${isDark ? 'bg-aether-dark-300 text-aether-text-dark-secondary hover:bg-aether-dark-300/80' : 'text-aether-text-secondary bg-aether-300'} rounded-button hover:bg-opacity-80 transition-colors`}
              >
                取消
              </button>
              <button
                onClick={saveDailyGoal}
                className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-button hover:bg-[var(--color-accent)]/90 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 隐藏的分享卡片模板 */}
      {categoryStats.length > 0 && (
        <div className="hidden">
          <div ref={todayShareRef} className="w-[800px] h-[1000px] bg-gradient-to-br from-[#5aa9e6] to-[#3a8bc8] p-12 text-white">
            <div className="h-full flex flex-col">
              <div className="text-center mb-10">
                <h1 className="text-5xl font-bold mb-3 font-serif">Merize 今日成就</h1>
                <p className="text-xl opacity-90">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
              </div>

              <div className="flex-1 bg-white/10 rounded-3xl p-10 backdrop-blur">
                <div className="text-4xl font-bold mb-8 text-center">
                  今日总计 {formatDurationMinutes(totalMinutes)}
                </div>
                <div className="space-y-6">
                  {categoryStats.slice(0, 5).map((stat, index) => (
                    <div key={stat.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <span className="text-3xl font-bold opacity-70 w-10">{index + 1}</span>
                        <span className="text-2xl">{stat.category}</span>
                      </div>
                      <span className="text-2xl font-semibold">{formatDurationMinutes(stat.duration)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 text-center">
                {stats?.topCategory && (
                  <p className="text-3xl font-semibold mb-4">
                    今日专注 {stats.topCategory}
                  </p>
                )}
                <p className="text-xl opacity-80">#merize #时间管理 #自律 #效率提升</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
