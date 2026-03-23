import { useState, useEffect, useRef } from 'react'
import { getWeeklyStats, WeeklyStatItem, getAllActivitiesExport } from '../utils/tracking'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { toPng } from 'html-to-image'
import type { Theme } from '../App'

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'
]

interface StatisticsProps {
  theme: Theme
}

const Statistics: React.FC<StatisticsProps> = ({ theme }) => {
  const isDark = theme === 'dark'
  const titleColor = isDark ? 'text-white' : 'text-gray-900'
  const textColor = isDark ? 'text-gray-400' : 'text-gray-500'
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white'
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200'
  const borderLight = isDark ? 'border-gray-700' : 'border-gray-100'
  const bodyText = isDark ? 'text-gray-300' : 'text-gray-600'
  const [stats, setStats] = useState<WeeklyStatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const shareCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getWeeklyStats()
      setStats(data)
    } catch (error) {
      console.error('加载统计失败', error)
    } finally {
      setLoading(false)
    }
  }

  // 导出 JSON
  const exportJSON = async () => {
    try {
      setExporting(true)
      const allActivities = await getAllActivitiesExport()
      const jsonStr = JSON.stringify(allActivities, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().split('T')[0]
      a.download = `merize-activities-export-${dateStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('导出 JSON 失败', error)
      alert('导出失败: ' + error)
    } finally {
      setExporting(false)
    }
  }

  // 导出 CSV
  const exportCSV = async () => {
    try {
      setExporting(true)
      const allActivities = await getAllActivitiesExport()

      // CSV header
      const headers = ['id,name,windowTitle,category,taskId,startTimeMs,durationMinutes']
      // CSV rows
      const rows = allActivities.map(act => [
        act.id,
        `"${act.name.replace(/"/g, '""')}"`,
        `"${act.windowTitle.replace(/"/g, '""')}"`,
        act.category ? `"${act.category.replace(/"/g, '""')}"` : '',
        act.taskId || '',
        act.startTimeMs,
        act.durationMinutes
      ].join(','))

      const csvContent = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().split('T')[0]
      a.download = `merize-activities-export-${dateStr}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('导出 CSV 失败', error)
      alert('导出失败: ' + error)
    } finally {
      setExporting(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? ` ${mins}分` : ''}`
    }
    return `${Math.round(minutes)}分钟`
  }

  const totalDuration = stats.reduce((sum, item) => sum + item.duration, 0)

  const chartData = stats.map(item => ({
    name: item.category,
    value: item.duration
  }))

  // 生成小红书分享图片 - 周总结打卡
  const generateShareImage = async () => {
    if (!shareCardRef.current || stats.length === 0) return

    try {
      setGeneratingImage(true)

      // 计算本周日期
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      const weekEnd = new Date(now)
      weekEnd.setDate(now.getDate() + (6 - now.getDay()))
      const dateStr = `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`

      const dataUrl = await toPng(shareCardRef.current, {
        backgroundColor: '#f97316',
        quality: 0.95
      })

      // 创建下载链接
      const link = document.createElement('a')
      link.download = `merize-weekly-${dateStr.replace('/', '-')}.png`
      link.href = dataUrl
      link.click()

      alert('周总结图片已生成！可以直接发到小红书打卡 #时间管理 #效率提升')
    } catch (error) {
      console.error('生成图片失败', error)
      alert('生成图片失败: ' + error)
    } finally {
      setGeneratingImage(false)
    }
  }

  // 获取本周Top3分类
  const topThreeStats = stats.slice(0, 3)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className={`text-2xl font-bold ${titleColor} mb-2`}>每周统计</h2>
        <p className={textColor}>
          查看本周时间分配，生成小红书打卡图片
        </p>
      </div>

      {/* 导出和分享区域 */}
      <div className={`mb-6 ${cardBg} rounded-2xl shadow-sm p-6 border ${borderColor}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className={`text-lg font-semibold ${titleColor} mb-3`}>数据导出</h3>
            <p className={`text-sm ${textColor} mb-4`}>
              将所有历史活动数据导出为 JSON 或 CSV 文件，保存到本地
            </p>
            <div className="flex gap-3">
              <button
                onClick={exportJSON}
                disabled={exporting}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {exporting ? '导出中...' : '导出 JSON'}
              </button>
              <button
                onClick={exportCSV}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {exporting ? '导出中...' : '导出 CSV'}
              </button>
            </div>
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${titleColor} mb-3`}>小红书分享</h3>
            <p className={`text-sm ${textColor} mb-4`}>
              生成精美周总结图片，打卡发小红书分享你的时间管理成果
            </p>
            <button
              onClick={generateShareImage}
              disabled={generatingImage || stats.length === 0}
              className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generatingImage ? '生成中...' : '📷 生成周总结分享图'}
            </button>
          </div>
        </div>
      </div>

      {/* 隐藏的分享卡片 - 用于生成图片 */}
      {stats.length > 0 && (
        <div className="mb-8 hidden">
          <div ref={shareCardRef} className="w-[800px] h-[1000px] bg-gradient-to-br from-primary to-success p-12 text-white">
            <div className="h-full flex flex-col">
              <div className="text-center mb-12">
                <h1 className="text-5xl font-bold mb-4">merize 周总结</h1>
                <p className="text-xl opacity-90">
                  {new Date().getFullYear()}年{new Date().getMonth() + 1}月
                  第{Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()) / 7)}周
                </p>
              </div>

              <div className="flex-1">
                <div className="bg-white/10 rounded-3xl p-8 backdrop-blur">
                  <div className="text-3xl font-bold mb-6 text-center">
                    本周总计 {formatDuration(totalDuration)}
                  </div>
                  <div className="space-y-4">
                    {topThreeStats.map((item, index) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold opacity-70 w-8">{index + 1}</span>
                          <span className="text-xl">{item.category}</span>
                        </div>
                        <span className="text-xl font-semibold">{formatDuration(item.duration)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center">
                <p className="text-2xl font-semibold mb-2">
                  最长投入：{stats[0]?.category || '无'} → {formatDuration(stats[0]?.duration || 0)}
                </p>
                <p className="text-lg opacity-80 mt-4">#merize #时间管理 #效率提升</p>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${cardBg} rounded-2xl shadow-sm p-6 border ${borderColor}`}>
          <h3 className={`text-lg font-semibold ${titleColor} mb-4`}>时间分布饼图</h3>
          {loading ? (
            <div className={`text-center py-12 ${textColor}`}>加载中...</div>
          ) : stats.length === 0 ? (
            <div className={`text-center py-12 ${textColor}`}>暂无数据</div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatDuration(value)}
                    contentStyle={{
                      backgroundColor: isDark ? '#374151' : '#ffffff',
                      border: isDark ? '1px solid #4B5563' : '1px solid #e5e7eb',
                      color: isDark ? '#ffffff' : '#111827'
                    }}
                  />
                  <Legend wrapperStyle={{ color: isDark ? '#ffffff' : '#333333' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={`${cardBg} rounded-2xl shadow-sm p-6 border ${borderColor}`}>
          <h3 className={`text-lg font-semibold ${titleColor} mb-4`}>详细数据</h3>
          {loading ? (
            <div className={`text-center py-12 ${textColor}`}>加载中...</div>
          ) : stats.length === 0 ? (
            <div className={`text-center py-12 ${textColor}`}>暂无数据</div>
          ) : (
            <div className="space-y-4">
              <div className={`pb-2 border-b ${borderLight}`}>
                <div className={`flex justify-between font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                  <span>分类</span>
                  <span>总计 • 占比</span>
                </div>
              </div>
              {stats.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className={`font-medium ${titleColor}`}>{item.category}</div>
                  <div className={bodyText}>
                    {formatDuration(item.duration)} • {item.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
              <div className={`pt-2 border-t ${borderLight}`}>
                <div className={`flex justify-between font-bold ${titleColor}`}>
                  <span>总计</span>
                  <span>{formatDuration(totalDuration)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Statistics
