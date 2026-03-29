// 日历视图 - 模仿 Rize 原版设计
// 按月浏览，点击日期查看当天统计

import React, { useState, useEffect } from 'react'
import { getActivitiesByDate, getStatsByDate, getMonthlyStats, Activity, DailyStats, deleteActivity, updateActivityCategory, createActivity, updateActivity } from '../utils/tracking'
import Timeline from '../components/Timeline'
import StatsCard from '../components/StatsCard'
import type { Theme } from '../App'

interface CalendarProps {
  theme: Theme
}

// 简单日历组件，显示当月日期，点击日期查看那天数据
// 后续可以扩展显示当月时间统计热力图

const Calendar: React.FC<CalendarProps> = ({ theme }) => {
  const isDark = theme === 'dark'
  const titleColor = isDark ? 'text-white' : 'text-gray-900'
  const textColor = isDark ? 'text-gray-400' : 'text-gray-500'
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white'
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200'
  const borderLight = isDark ? 'border-gray-600' : 'border-gray-100'
  const bodyText = isDark ? 'text-gray-300' : 'text-gray-600'
  const hoverBg = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
  const inputBg = isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<Date | null>(today)
  const [activities, setActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<Map<number, number>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  // 表单状态
  const [formName, setFormName] = useState('')
  const [formWindowTitle, setFormWindowTitle] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formStartHours, setFormStartHours] = useState('9')
  const [formStartMinutes, setFormStartMinutes] = useState('0')
  const [formDurationHours, setFormDurationHours] = useState('0')
  const [formDurationMinutes, setFormDurationMinutes] = useState('30')

  // 格式化日期为 YYYY-MM-DD
  const formatDateYMD = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 加载选中日期的数据
  const loadSelectedDateData = async (date: Date) => {
    try {
      setLoading(true)
      setError(null)
      const dateStr = formatDateYMD(date)
      const [activitiesData, statsData] = await Promise.all([
        getActivitiesByDate(dateStr),
        getStatsByDate(dateStr)
      ])
      setActivities(activitiesData)
      setStats(statsData)
    } catch (err: any) {
      console.error('加载日期数据失败', err)
      setError(err.toString() || '加载数据失败')
      setActivities([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  // 重新加载数据
  const retryLoad = () => {
    if (selectedDate) {
      loadSelectedDateData(selectedDate)
    }
  }

  // 生成当月日期
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startingDay = firstDay.getDay() // 0 = Sunday
    const daysInMonth = lastDay.getDate()

    const days: (number | null)[] = Array(startingDay).fill(null)
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    )
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    )
  }

  // 获取热力图背景色根据专注时长
  const getHeatmapColor = (day: number): string => {
    const minutes = monthlyStats.get(day) || 0
    if (minutes === 0) {
      return isDark ? 'bg-gray-800/20' : 'bg-gray-50'
    }
    // 根据时长分等级: 0, 1-30min, 30-120min, 120-240min, 240+
    if (isDark) {
      if (minutes < 30) return 'bg-green-900/30'
      if (minutes < 120) return 'bg-green-900/50'
      if (minutes < 240) return 'bg-green-800/70'
      return 'bg-green-700'
    } else {
      if (minutes < 30) return 'bg-green-100'
      if (minutes < 120) return 'bg-green-200'
      if (minutes < 240) return 'bg-green-300'
      return 'bg-green-400'
    }
  }

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ]

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  // 加载月度热力图统计
  useEffect(() => {
    const loadMonthlyStats = async () => {
      try {
        const data = await getMonthlyStats(currentYear, currentMonth + 1);
        const statsMap = new Map<number, number>();
        data.forEach(item => {
          statsMap.set(item.day, item.total_minutes);
        });
        setMonthlyStats(statsMap);
      } catch (err) {
        console.error('加载月度统计失败', err);
      }
    };
    loadMonthlyStats();
  }, [currentYear, currentMonth]);

  // 当选中日期变化时，加载数据
  useEffect(() => {
    if (selectedDate) {
      loadSelectedDateData(selectedDate)
    } else {
      setActivities([])
      setStats(null)
    }
  }, [selectedDate])

  const formatDurationMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? ` ${mins}分` : ''}`
    }
    return `${Math.round(minutes)}分钟`
  }

  const handleChangeCategory = async (id: string, currentCategory: string | null) => {
    const newCategory = prompt('请输入新分类', currentCategory || '')
    if (newCategory !== null && selectedDate) {
      await updateActivityCategory(id, newCategory)
      await loadSelectedDateData(selectedDate)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条记录吗？') && selectedDate) {
      await deleteActivity(id)
      await loadSelectedDateData(selectedDate)
    }
  }

  // 计算分类统计
  const getCategoryStats = () => {
    const categoryMap: {[key: string]: number} = {}
    for (const act of activities) {
      const cat = act.category || '未分类'
      categoryMap[cat] = (categoryMap[cat] || 0) + act.durationMinutes
    }
    const catStats = Object.entries(categoryMap).map(([category, duration]) => ({
      category, duration
    })).sort((a, b) => b.duration - a.duration)
    return catStats
  }

  const categoryStats = getCategoryStats()
  const totalMinutes = categoryStats.reduce((sum, item) => sum + item.duration, 0)

  // 打开添加活动模态框
  const openAddModal = () => {
    if (!selectedDate) return
    // 默认设置当前时间
    const now = new Date()
    setFormStartHours(now.getHours().toString())
    setFormStartMinutes(now.getMinutes().toString())
    setEditingActivity(null)
    setFormName('')
    setFormWindowTitle('')
    setFormCategory('')
    setFormDurationHours('0')
    setFormDurationMinutes('30')
    setShowModal(true)
  }

  // 打开编辑活动模态框
  const openEditModal = (activity: Activity) => {
    if (!selectedDate) return
    setEditingActivity(activity)
    setFormName(activity.name)
    setFormWindowTitle(activity.windowTitle)
    setFormCategory(activity.category || '')
    // 计算开始时间小时分钟
    const date = new Date(activity.startTimeMs)
    setFormStartHours(date.getHours().toString())
    setFormStartMinutes(date.getMinutes().toString())
    // 计算持续时长
    const duration = activity.durationMinutes
    const hours = Math.floor(duration / 60)
    const mins = Math.round(duration % 60)
    setFormDurationHours(hours.toString())
    setFormDurationMinutes(mins.toString())
    setShowModal(true)
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!selectedDate) return

    try {
      const hours = parseInt(formStartHours) || 0
      const mins = parseInt(formStartMinutes) || 0

      // 计算开始时间毫秒
      const selectedDayStart = new Date(selectedDate)
      selectedDayStart.setHours(hours, mins, 0, 0)
      const startTimeMs = selectedDayStart.getTime()

      const durHours = parseInt(formDurationHours) || 0
      const durMins = parseInt(formDurationMinutes) || 0
      const durationMinutes = durHours * 60 + durMins

      const category = formCategory.trim() || null

      if (editingActivity) {
        // 更新现有活动
        await updateActivity(
          editingActivity.id,
          formName || undefined,
          formWindowTitle || undefined,
          category,
          startTimeMs,
          durationMinutes > 0 ? durationMinutes : undefined
        )
      } else {
        // 创建新活动
        await createActivity(
          formName || '手动添加',
          formWindowTitle || formName || '手动添加活动',
          category,
          startTimeMs,
          durationMinutes > 0 ? durationMinutes : 1
        )
      }

      // 关闭模态框并刷新
      setShowModal(false)
      await loadSelectedDateData(selectedDate)
    } catch (err) {
      console.error('保存活动失败', err)
      alert('保存失败: ' + err)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingActivity(null)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className={`text-2xl font-bold ${titleColor} mb-2`}>日历视图</h2>
        <p className={textColor}>
          按日期浏览历史活动，点击日期查看当天统计
        </p>
      </div>

      <div className={`${cardBg} rounded-xl shadow-sm p-6 border ${borderColor}`}>
        {/* 日历头部 */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={prevMonth}
              className={`p-2 ${hoverBg} rounded-lg transition-colors ${textColor}`}
            >
              ←
            </button>
            <h3 className={`text-xl font-semibold ${titleColor}`}>
              {currentYear} 年 {monthNames[currentMonth]}
            </h3>
            <button
              onClick={nextMonth}
              className={`p-2 ${hoverBg} rounded-lg transition-colors ${textColor}`}
            >
              →
            </button>
          </div>
          {/* 热力图图例 - 移动到更显眼位置 */}
          <div className="flex items-center gap-2">
            <span className={`text-xs ${textColor}`}>活动强度: </span>
            <div className="flex gap-1">
              <div className={`w-4 h-4 rounded ${isDark ? 'bg-gray-800/20' : 'bg-gray-50'}`}></div>
              <div className={`w-4 h-4 rounded ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}></div>
              <div className={`w-4 h-4 rounded ${isDark ? 'bg-green-900/50' : 'bg-green-200'}`}></div>
              <div className={`w-4 h-4 rounded ${isDark ? 'bg-green-800/70' : 'bg-green-300'}`}></div>
              <div className={`w-4 h-4 rounded ${isDark ? 'bg-green-700' : 'bg-green-400'}`}></div>
            </div>
            <span className={`text-xs ${textColor}`}>少 → 多</span>
          </div>
        </div>

        {/* 星期头部 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className={`text-center text-sm font-medium ${textColor} py-2`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日期网格 - 限制最大宽度420px在桌面 */}
        <div className="grid grid-cols-7 gap-1 max-w-[420px] mx-auto">
          {generateCalendarDays().map((day, index) => {
            if (day === null) {
              return <div key={index} className="aspect-square"></div>
            }

            return (
              <div
                key={index}
                className={`
                  aspect-square flex items-center justify-center rounded-lg cursor-pointer text-sm transition-colors
                  ${getHeatmapColor(day)}
                  ${isToday(day) ? (isDark ? 'ring-2 ring-blue-400 text-blue-200' : 'ring-2 ring-blue-500 bg-blue-100 font-semibold') : ''}
                  ${isSelected(day) ? 'bg-blue-500 text-white font-semibold ring-2 ring-blue-300' : ''}
                  ${!isSelected(day) && !isToday(day) ? hoverBg : ''}
                  ${!isSelected(day) && !isToday(day) && (monthlyStats.get(day) || 0) === 0 && isDark ? 'text-gray-500' : ''}
                  ${!isSelected(day) && !isToday(day) && (monthlyStats.get(day) || 0) === 0 && !isDark ? 'text-gray-400' : ''}
                  ${!isSelected(day) && !isToday(day) && (monthlyStats.get(day) || 0) > 0 && isDark ? 'text-gray-100' : ''}
                  ${!isSelected(day) && !isToday(day) && (monthlyStats.get(day) || 0) > 0 && !isDark ? 'text-gray-800' : ''}
                `}
                onClick={() => {
                  const date = new Date(currentYear, currentMonth, day)
                  setSelectedDate(date)
                }}
                title={monthlyStats.get(day) ? `${Math.round(monthlyStats.get(day)! / 60 * 10) / 10} 小时` : '无活动'}
              >
                {day}
              </div>
            )
          })}
        </div>

        {/* 选中日期统计 */}
        {selectedDate && (
          <div className={`mt-6 pt-6 border-t ${borderLight}`}>
            <h4 className={`font-semibold ${titleColor} mb-2`}>
              {selectedDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </h4>

            {/* 错误状态 */}
            {error && (
              <div className={`${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border border-red-200'} rounded-lg p-4 mb-4`}>
                <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'} mb-2`}>加载数据失败: {error}</p>
                <button
                  onClick={retryLoad}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  重试
                </button>
              </div>
            )}

            {/* 加载中 */}
            {loading && (
              <div className={`text-center py-8 ${textColor}`}>
                加载中...
              </div>
            )}

            {/* 数据展示 */}
            {!loading && !error && (
              <>
                {/* 时间线 */}
                {activities.length > 0 && (
                  <div className="mb-6">
                    <Timeline
                      activities={activities}
                      onEditCategory={handleChangeCategory}
                      onDelete={handleDelete}
                      isDark={isDark}
                    />
                  </div>
                )}

                {/* 统计卡片 */}
                <StatsCard
                  theme={theme}
                  totalMinutes={totalMinutes}
                  activitiesCount={activities.length}
                  totalCategories={stats?.totalCategories || 0}
                  formatDurationMinutes={formatDurationMinutes}
                />

                {/* 添加活动按钮 */}
                {selectedDate && (
                  <div className="mb-4">
                    <button
                      onClick={openAddModal}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      + 手动添加活动
                    </button>
                  </div>
                )}

                {/* 时间线 */}
                {activities.length > 0 && (
                  <div className="mb-6">
                    <Timeline
                      activities={activities}
                      onEditCategory={handleChangeCategory}
                      onDelete={handleDelete}
                      isDark={isDark}
                    />
                  </div>
                )}

                {/* 分类统计 */}
                {categoryStats.length > 0 && (
                  <div className={`${cardBg} rounded-xl shadow-sm p-4 border ${borderColor} mb-6`}>
                    <h5 className={`text-lg font-semibold ${titleColor} mb-3`}>分类统计</h5>
                    <div className="space-y-2">
                      {categoryStats
                        .map(stat => (
                          <div key={stat.category} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className={`text-base font-medium ${titleColor}`}>{stat.category}</span>
                            </div>
                            <span className={bodyText}>{formatDurationMinutes(stat.duration)}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* 活动列表（可编辑） */}
                {activities.length > 0 && (
                  <div className={`${cardBg} rounded-xl shadow-sm p-4 border ${borderColor}`}>
                    <h5 className={`text-lg font-semibold ${titleColor} mb-3`}>活动列表</h5>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {activities.slice().sort((a, b) => a.startTimeMs - b.startTimeMs).map(act => {
                        const start = new Date(act.startTimeMs)
                        const startTimeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
                        return (
                          <div key={act.id} className={`flex items-center justify-between p-2 border ${borderLight} rounded ${hoverBg} transition-colors`}>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium ${titleColor} truncate`}>
                                {startTimeStr} • {act.windowTitle}
                              </div>
                              <div className={textColor}>
                                {act.name} • {act.category || '未分类'} • {formatDurationMinutes(act.durationMinutes)}
                              </div>
                            </div>
                            <div className="flex space-x-1 ml-2">
                              <button
                                onClick={() => openEditModal(act)}
                                className={`px-2 py-1 text-xs ${isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-100 text-blue-700'} rounded hover:bg-blue-200 transition-colors`}
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleDelete(act.id)}
                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 无数据 */}
                {activities.length === 0 && (
                  <div className={`text-center py-8 ${textColor}`}>
                    该日期暂无活动记录
                    {selectedDate && (
                      <div className="mt-4">
                        <button
                          onClick={openAddModal}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          添加第一条活动
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 添加/编辑活动模态框 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${cardBg} rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}>
              <h3 className={`text-xl font-semibold ${titleColor} mb-4`}>
                {editingActivity ? '编辑活动' : '添加手动活动'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>应用名称</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="例如: Google Chrome"
                    className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>窗口标题</label>
                  <input
                    type="text"
                    value={formWindowTitle}
                    onChange={(e) => setFormWindowTitle(e.target.value)}
                    placeholder="例如: GitHub - 代码仓库"
                    className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>分类</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="例如: 开发、工作、学习"
                    className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>开始时间</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={formStartHours}
                        onChange={(e) => setFormStartHours(e.target.value)}
                        placeholder="时"
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                      />
                      <span className={`text-xs ${textColor}`}>小时 (0-23)</span>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={formStartMinutes}
                        onChange={(e) => setFormStartMinutes(e.target.value)}
                        placeholder="分"
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                      />
                      <span className={`text-xs ${textColor}`}>分钟 (0-59)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>持续时长</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        min="0"
                        value={formDurationHours}
                        onChange={(e) => setFormDurationHours(e.target.value)}
                        placeholder="时"
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                      />
                      <span className={`text-xs ${textColor}`}>小时</span>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={formDurationMinutes}
                        onChange={(e) => setFormDurationMinutes(e.target.value)}
                        placeholder="分"
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                      />
                      <span className={`text-xs ${textColor}`}>分钟</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={closeModal}
                  className={`px-4 py-2 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'text-gray-700 bg-gray-100'} rounded-lg hover:bg-gray-200 transition-colors`}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingActivity ? '保存修改' : '添加活动'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Calendar
