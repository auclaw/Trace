import React, { useState, useEffect } from 'react'
import { getTodayActivities, getTodayStats } from '../utils/api'
import ActivityItem from '../components/ActivityItem'

interface Activity {
  id: string
  name: string
  category: string
  duration: number  // 分钟
  startTime: string
}

interface TodayStats {
  totalFocus: number      // 总专注分钟
  totalCategories: number
  topCategory: string
}

const Dashboard: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState<TodayStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    // 每分钟刷新一次
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [activitiesRes, statsRes] = await Promise.all([
        getTodayActivities(),
        getTodayStats()
      ])
      setActivities(activitiesRes.data)
      setStats(statsRes.data)
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? ` ${mins}分` : ''}`
    }
    return `${mins}分钟`
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">今日概览</h2>
        <p className="text-gray-500">
          {new Date().toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">总专注时间</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatDuration(stats.totalFocus)}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">活动分类</div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalCategories}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">最多分类</div>
            <div className="text-3xl font-bold text-blue-600">
              {stats.topCategory || '-'}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">今日活动记录</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无活动记录，等待系统追踪...
          </div>
        ) : (
          <div className="space-y-3">
            {activities
              .sort((a, b) => b.duration - a.duration)
              .map(activity => (
                <ActivityItem 
                  key={activity.id} 
                  activity={activity}
                  formatDuration={formatDuration}
                />
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
