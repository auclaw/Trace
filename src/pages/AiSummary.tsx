import { useState, useEffect, useCallback } from 'react'
import type { Theme } from '../App'
import { apiRequest } from '../utils/api'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DailySummary {
  date: string
  total_minutes: number
  focused_minutes: number
  interruption_count: number
  productivity_score: number
}

interface AiInsight {
  type: 'positive' | 'warning' | 'suggestion'
  content: string
}

interface SummaryData {
  period: 'day' | 'week'
  total_focus_minutes: number
  total_break_minutes: number
  interruption_count: number
  avg_daily_focus: number
  productivity_score: number
  daily_data: DailySummary[]
  insights: AiInsight[]
}

interface AiSummaryProps {
  theme: Theme
}

const AiSummary: React.FC<AiSummaryProps> = ({ theme }) => {
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'day' | 'week'>('day')
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiRequest(`/api/ai-summary?period=${period}`, 'GET')
      if (response.code === 200) {
        setSummary(response.data)
      }
    } catch (error) {
      console.error('加载AI总结失败', error)
    } finally {
      setLoading(false)
    }
  }, [period])

  const regenerateSummary = async () => {
    setRegenerating(true)
    try {
      const response = await apiRequest('/api/ai-summary/regenerate', 'POST', { period })
      if (response.code === 200) {
        setSummary(response.data)
      }
    } catch (error) {
      console.error('重新生成失败', error)
      alert('重新生成失败，请稍后重试')
    } finally {
      setRegenerating(false)
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

  const formatDate = (dateStr: string) => {
    if (period === 'day') {
      return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit' })
    }
    return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  useEffect(() => {
    loadSummary()
  }, [period, loadSummary])

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
  const buttonPrimaryClass = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded'

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
            <h1 className="text-2xl font-bold">AI 效率总结</h1>
            <p className={`text-sm ${textColor}`}>
              基于你的时间数据，AI 自动生成效率洞察和改进建议
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded transition-colors ${period === 'day' ? buttonActiveClass : buttonInactiveClass}`}
                onClick={() => setPeriod('day')}
              >
                今日
              </button>
              <button
                className={`px-4 py-2 rounded transition-colors ${period === 'week' ? buttonActiveClass : buttonInactiveClass}`}
                onClick={() => setPeriod('week')}
              >
                本周
              </button>
            </div>
            <button
              className={buttonPrimaryClass}
              onClick={regenerateSummary}
              disabled={regenerating}
            >
              {regenerating ? '生成中...' : '重新生成'}
            </button>
          </div>
        </div>

        {!summary ? (
          <div className={`p-8 text-center border ${borderClass} rounded ${cardBgClass}`}>
            <p className={textColor}>暂无数据，继续使用一段时间后即可生成AI总结</p>
          </div>
        ) : (
          <>
            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className={`${cardBgClass} border ${borderClass} rounded p-4`}>
                <p className={`text-sm ${textColor} mb-1`}>总专注时长</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatDuration(summary.total_focus_minutes)}
                </p>
              </div>
              <div className={`${cardBgClass} border ${borderClass} rounded p-4`}>
                <p className={`text-sm ${textColor} mb-1`}>打断次数</p>
                <p className="text-2xl font-bold">
                  {summary.interruption_count}
                </p>
              </div>
              <div className={`${cardBgClass} border ${borderClass} rounded p-4`}>
                <p className={`text-sm ${textColor} mb-1`}>平均每日专注</p>
                <p className="text-2xl font-bold">
                  {formatDuration(summary.avg_daily_focus)}
                </p>
              </div>
              <div className={`${cardBgClass} border ${borderClass} rounded p-4`}>
                <p className={`text-sm ${textColor} mb-1`}>生产力得分</p>
                <p className={`text-2xl font-bold ${getScoreColor(summary.productivity_score)}`}>
                  {summary.productivity_score.toFixed(1)}
                </p>
              </div>
            </div>

            {/* Focus Trend Chart */}
            {summary.daily_data.length > 0 && (
              <div className={`mb-6 ${cardBgClass} border ${borderClass} rounded p-4`}>
                <h2 className="text-xl font-semibold mb-4">专注趋势</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={summary.daily_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
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
                        formatter={(value: number) => [formatDuration(value), '专注时长']}
                      />
                      <Line
                        type="monotone"
                        dataKey="focused_minutes"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* AI Insights */}
            <div className={`${cardBgClass} border ${borderClass} rounded p-4 mb-6`}>
              <h2 className="text-xl font-semibold mb-4">💡 AI 洞察</h2>
              {summary.insights.length === 0 ? (
                <p className={`${textColor} italic`}>数据还在积累中，下次生成会有更多洞察...</p>
              ) : (
                <ul className="space-y-3">
                  {summary.insights.map((insight, index) => {
                    const icon = insight.type === 'positive' ? '✅' : insight.type === 'warning' ? '⚠️' : '💡'
                    const textColorClass = insight.type === 'positive'
                      ? (isDark ? 'text-green-400' : 'text-green-700')
                      : insight.type === 'warning'
                      ? (isDark ? 'text-yellow-400' : 'text-yellow-700')
                      : (isDark ? 'text-blue-400' : 'text-blue-700')
                    return (
                      <li key={index} className={`flex items-start space-x-2 ${textColorClass}`}>
                        <span className="text-lg">{icon}</span>
                        <span>{insight.content}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AiSummary
