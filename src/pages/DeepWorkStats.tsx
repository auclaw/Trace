import { useState, useEffect, useCallback } from 'react'
import type { Theme } from '../App'
import { apiRequest } from '../utils/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'


interface DeepWorkStatsData {
  total_flow_minutes: number
  flow_block_count: number
  avg_flow_duration: number
  max_flow_duration: number
  flow_by_hour: Array<{ hour: number; minutes: number }>
  interruption_count: number
  interruption_by_source: Array<{ source: string; count: number }>
  total_recovery_minutes: number
}

interface DeepWorkStatsProps {
  theme: Theme
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const DeepWorkStats: React.FC<DeepWorkStatsProps> = ({ theme }) => {
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [stats, setStats] = useState<DeepWorkStatsData | null>(null)

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiRequest(`/api/deep-work/stats?period=${period}`, 'GET')
      if (response.code === 200) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('加载深度工作统计失败', error)
    } finally {
      setLoading(false)
    }
  }, [period])

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? ` ${mins}分` : ''}`
    }
    return `${Math.round(minutes)}分钟`
  }

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      'chat': '聊天工具',
      'email': '邮件',
      'meeting': '会议',
      'social': '社交媒体',
      'other': '其他',
    }
    return labels[source] || source
  }

  const hourFormatter = (hour: number) => {
    return `${hour}:00`
  }

  useEffect(() => {
    loadStats()
  }, [period, loadStats])

  const bgClass = isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
  const cardBgClass = isDark ? 'bg-gray-800' : 'bg-gray-50'
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200'
  const textColor = isDark ? 'text-gray-300' : 'text-gray-600'
  const buttonActiveClass = isDark
    ? 'bg-blue-600 text-white'
    : 'bg-blue-100 text-blue-700'
  const buttonInactiveClass = isDark
    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'

  if (loading) {
    return (
      <div className={`${bgClass} min-h-screen p-4`}>
        <div className="animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <div className={`${bgClass} min-h-screen p-4`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">深度工作统计</h1>
            <p className={`text-sm ${textColor}`}>
              心流块分析 · 打断统计 · 帮你找到最佳工作节奏
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded transition-colors ${period === 'week' ? buttonActiveClass : buttonInactiveClass}`}
              onClick={() => setPeriod('week')}
            >
              本周
            </button>
            <button
              className={`px-4 py-2 rounded transition-colors ${period === 'month' ? buttonActiveClass : buttonInactiveClass}`}
              onClick={() => setPeriod('month')}
            >
              本月
            </button>
          </div>
        </div>

        {!stats || stats.flow_block_count === 0 ? (
          <div className={`p-8 text-center border ${borderClass} rounded ${cardBgClass}`}>
            <p className={textColor}>暂无深度工作数据，继续保持专注就能生成统计</p>
          </div>
        ) : (
          <>
            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className={`${cardBgClass} border ${borderClass} rounded p-4`}>
                <p className={`text-sm ${textColor} mb-1`}>总心流时长</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatDuration(stats.total_flow_minutes)}
                </p>
              </div>
              <div className={`${cardBgClass} border ${borderClass} rounded p-4`}>
                <p className={`text-sm ${textColor} mb-1`}>心流块数量</p>
                <p className="text-2xl font-bold">{stats.flow_block_count}</p>
              </div>
              <div className={`${cardBgClass} border ${borderClass} rounded p-4`}>
                <p className={`text-sm ${textColor} mb-1`}>平均心流时长</p>
                <p className="text-2xl font-bold">{formatDuration(stats.avg_flow_duration)}</p>
              </div>
              <div className={`${cardBgClass} border ${borderClass} rounded p-4`}>
                <p className={`text-sm ${textColor} mb-1`}>最长单次心流</p>
                <p className="text-2xl font-bold">{formatDuration(stats.max_flow_duration)}</p>
              </div>
            </div>

            {/* Interruption Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className={`${cardBgClass} border ${borderClass} rounded p-4`}>
                <h3 className="text-lg font-semibold mb-4">心流分布按时段</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.flow_by_hour}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={hourFormatter}
                        tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
                      />
                      <YAxis
                        tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
                        unit="m"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                          color: isDark ? '#f9fafb' : '#111827',
                        }}
                        formatter={(value: number) => [formatDuration(value), '心流时长']}
                      />
                      <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className={`mt-3 text-sm ${textColor}`}>
                  💡 看到哪个时段你的心流最多？把重要工作放在那个时段！
                </div>
              </div>

              <div className={`${cardBgClass} border ${borderClass} rounded p-4`}>
                <h3 className="text-lg font-semibold mb-4">打断来源分布</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.interruption_by_source}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${getSourceLabel(name)} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {stats.interruption_by_source.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                        }}
                        formatter={(value: number) => [value, '次数']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {stats.interruption_count > 0 && (
                  <div className={`mt-3 text-sm ${textColor}`}>
                    总计 {stats.interruption_count} 次打断，浪费了 {formatDuration(stats.total_recovery_minutes)}
                  </div>
                )}
              </div>
            </div>

            {/* Insights Card */}
            <div className={`${cardBgClass} border ${borderClass} rounded p-4 mb-6`}>
              <h3 className="text-lg font-semibold mb-3">💡 AI 洞察</h3>
              <ul className={`space-y-2 ${textColor}`}>
                {stats.flow_block_count === 0 && (
                  <li>还没有记录到心流块，试试连续专注 25 分钟不切换任务</li>
                )}
                {stats.flow_block_count > 0 && (
                  <>
                    <li>
                      🎯 你平均每次心流 {formatDuration(stats.avg_flow_duration)}，
                      {stats.avg_flow_duration >= 25 ? ' 很棒，保持这个节奏！' : ' 还可以尝试延长专注时间，更长心流产出更高。'}
                    </li>
                    {stats.interruption_count > 0 && (
                      <li>
                        ⚡ 你被打断 {stats.interruption_count} 次，总共浪费 {formatDuration(stats.total_recovery_minutes)}，
                        试试关闭通知减少打断。
                      </li>
                    )}
                    {stats.total_flow_minutes > 20 * 60 && period === 'week' && (
                      <li>✅ 本周深度工作超过 20 小时，很棒的坚持！</li>
                    )}
                    {stats.total_flow_minutes < 5 * 60 && period === 'week' && (
                      <li>🌱 本周深度工作还不到 5 小时，试试每天固定一个专注时间段。</li>
                    )}
                  </>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DeepWorkStats
