import { useState, useEffect, useRef, useCallback } from 'react'
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
        backgroundColor: '#f97316',
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

  const titleColor = isDark ? 'text-white' : 'text-gray-900'
  const textColor = isDark ? 'text-gray-400' : 'text-gray-500'
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white'
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200'
  const cardBorder = isDark ? 'border-gray-600' : 'border-gray-100'
  const hoverBg = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${titleColor} mb-2`}>今日概览</h2>
            <p className={textColor}>
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
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isTracking
                ? (isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-700 hover:bg-red-200')
                : (isDark ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-100 text-green-700 hover:bg-green-200')
            }`}
          >
            {isTracking ? '暂停追踪' : '开始追踪'}
          </button>
        </div>

        {/* 当前活动显示 - 正在追踪时显示 */}
        {isTracking && activities.length > 0 && (
          <div className={`mt-4 p-4 rounded-xl border ${borderColor} ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${textColor} mb-1`}>当前正在处理</p>
                {(() => {
                  // 获取最后一个活动（当前正在进行）
                  const sorted = [...activities].sort((a, b) => b.startTimeMs - a.startTimeMs)
                  const current = sorted[0]
                  const currentDuration = (Date.now() - current.startTimeMs) / (1000 * 60)
                  return (
                    <div>
                      <p className={`font-semibold ${titleColor}`}>{current.windowTitle}</p>
                      <p className={`text-sm ${textColor} mt-1`}>
                        {current.name} • {current.category || '未分类'} • 已进行 {formatDurationMinutes(Math.round(currentDuration))}
                      </p>
                    </div>
                  )
                })()}
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            </div>
          </div>
        )}
      </div>

      {/* Rize 风格时间线 */}
      <div className="mb-8">
        <Timeline
          activities={activities}
          onEditCategory={handleChangeCategory}
          onDelete={handleDelete}
          isDark={isDark}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-primary to-success rounded-2xl shadow-md p-6 text-white">
          <div className="text-sm font-medium text-orange-100 mb-1">总记录时间</div>
          <div className="text-3xl font-bold">
            {formatDurationMinutes(totalMinutes)}
          </div>
        </div>
        <div className={`${cardBg} rounded-2xl shadow-sm p-6 border ${borderColor}`}>
          <div className={`text-sm font-medium ${textColor} mb-1`}>分类数量</div>
          <div className={`text-3xl font-bold ${titleColor}`}>
            {categoryStats.length}
          </div>
        </div>
        <div className={`${cardBg} rounded-2xl shadow-sm p-6 border ${borderColor}`}>
          <div className={`text-sm font-medium ${textColor} mb-1`}>最久分类</div>
          <div className="text-3xl font-bold text-primary">
            {stats?.topCategory || '-'}
          </div>
        </div>
      </div>

      {/* 每日专注目标进度 */}
      <div className={`mb-8 ${cardBg} rounded-2xl shadow-sm p-6 border ${borderColor}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${titleColor}`}>今日专注目标</h3>
          <button
            onClick={openEditGoal}
            className={`px-3 py-1 text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-lg transition-colors`}
          >
            修改目标
          </button>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span className={textColor}>
                {formatDurationMinutes(totalMinutes)} / {formatDurationMinutes(dailyGoalMinutes)}
              </span>
              <span className={textColor}>
                {Math.round(goalPercentage)}%
              </span>
            </div>
            <div className={`h-4 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  goalPercentage >= 100
                    ? 'bg-gradient-to-r from-green-500 to-green-400'
                    : 'bg-gradient-to-r from-blue-500 to-primary'
                }`}
                style={{ width: `${goalPercentage}%` }}
              ></div>
            </div>
            <div className={`mt-3 text-sm font-medium ${
              goalPercentage >= 100
                ? 'text-green-500'
                : isDark
                ? 'text-gray-300'
                : 'text-gray-600'
            }`}>
              {getMotivationalMessage()}
            </div>
          </div>
        </div>
      </div>

      {/* 编辑目标弹窗 */}
      {showEditGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${cardBg} rounded-xl shadow-xl p-6 w-full max-w-sm`}>
            <h3 className={`text-xl font-semibold ${titleColor} mb-4`}>修改每日专注目标</h3>
            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                每日目标（小时）
              </label>
              <input
                type="number"
                min="1"
                max="16"
                step="0.5"
                value={editGoalValue}
                onChange={(e) => setEditGoalValue(e.target.value)}
                className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                }`}
              />
              <p className={`text-xs ${textColor} mt-1`}>推荐: 4 小时工作，8 小时全天专注</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowEditGoal(false)}
                className={`px-4 py-2 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'text-gray-700 bg-gray-100'} rounded-lg hover:bg-gray-200 transition-colors`}
              >
                取消
              </button>
              <button
                onClick={saveDailyGoal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 分享按钮区域 */}
      {categoryStats.length > 0 && (
        <div className={`mb-8 ${cardBg} rounded-2xl shadow-sm p-6 border ${borderColor}`}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${titleColor} mb-1`}>小红书分享</h3>
                <p className={`text-sm ${textColor}`}>生成今日成就卡片，分享到小红书打卡自律</p>
              </div>
              {!generatedImageUrl && (
                <button
                  onClick={generateTodayShare}
                  disabled={generatingImage}
                  className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {generatingImage ? '生成中...' : '📷 生成今日分享图'}
                </button>
              )}
            </div>

            {shareError && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'} text-sm`}>
                {shareError}
              </div>
            )}

            {generatedImageUrl && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={downloadImage}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  💾 下载图片
                </button>
                <button
                  onClick={copyImageToClipboard}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  📋 复制到剪贴板
                </button>
                {supportsShare && (
                  <button
                    onClick={shareImage}
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    📤 分享...
                  </button>
                )}
                <button
                  onClick={() => {
                    setGeneratedImageUrl(null)
                    setShareError(null)
                  }}
                  className={`px-4 py-2 text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-lg transition-colors`}
                >
                  重新生成
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 隐藏的分享卡片模板 */}
      {categoryStats.length > 0 && (
        <div className="hidden">
          <div ref={todayShareRef} className="w-[800px] h-[1000px] bg-gradient-to-br from-primary to-success p-12 text-white">
            <div className="h-full flex flex-col">
              <div className="text-center mb-10">
                <h1 className="text-5xl font-bold mb-3">merize 今日成就</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${cardBg} rounded-2xl shadow-sm p-6 border ${borderColor}`}>
          <h3 className={`text-lg font-semibold ${titleColor} mb-4`}>分类统计</h3>
          {loading ? (
            <div className={`text-center py-8 ${textColor}`}>加载中...</div>
          ) : categoryStats.length === 0 ? (
            <div className={`text-center py-8 ${textColor}`}>
              暂无活动记录，等待系统追踪...
            </div>
          ) : (
            <div className="space-y-3">
              {categoryStats
                .map(stat => (
                  <div key={stat.category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`text-base font-medium ${titleColor}`}>{stat.category}</span>
                    </div>
                    <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-medium`}>{formatDurationMinutes(stat.duration)}</span>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        <div className={`${cardBg} rounded-2xl shadow-sm p-6 border ${borderColor}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${titleColor}`}>原始活动记录</h3>
            {activities.some(a => !a.category) && (
              <button
                onClick={handleClassifyAll}
                className="px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
              >
                AI 一键分类
              </button>
            )}
          </div>
          {loading ? (
            <div className={`text-center py-8 ${textColor}`}>加载中...</div>
          ) : activities.length === 0 ? (
            <div className={`text-center py-8 ${textColor}`}>
              暂无活动记录
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activities.slice().reverse().map(act => {
                const start = new Date(act.startTimeMs)
                const startTimeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
                const endMs = act.startTimeMs + act.durationMinutes * 60 * 1000
                const endDate = new Date(endMs)
                const endTimeStr = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
                return (
                <div key={act.id} className={`flex items-center justify-between p-2 border ${cardBorder} rounded ${hoverBg} transition-colors`}>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${titleColor} truncate`}>
                      {startTimeStr} - {endTimeStr} • {act.windowTitle}
                    </div>
                    <div className={textColor}>
                      {act.name} • {act.category || '未分类'} • {formatDurationMinutes(act.durationMinutes)}
                    </div>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={() => handleChangeCategory(act.id, act.category)}
                      className={`px-2 py-1 text-xs ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded transition-colors`}
                    >
                      修改
                    </button>
                    <button
                      onClick={() => handleDelete(act.id)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
