import React, { useState, useEffect } from 'react'
import { getTodayStats } from '../utils/api'
import { checkTrackingStatus } from '../utils/tracking'

interface TodayStat {
  category: string
  seconds: number
}

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  const [stats, setStats] = useState<TodayStat[]>([])
  const [loading, setLoading] = useState(true)
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    loadData()
    // 每分钟刷新一次
    const interval = setInterval(() => {
      loadData()
      checkTrackingStatus().then(status => {
        setIsTracking(status)
      })
    }, 60000)
    
    checkTrackingStatus().then(status => {
      setIsTracking(status)
    })
    
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const res = await getTodayStats()
      if (res.code === 200) {
        setStats(res.data)
      }
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const totalMinutes = Math.floor(seconds / 60)
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? ` ${mins}分` : ''}`
    }
    return `${totalMinutes}分钟`
  }

  const getTotalTime = () => {
    return stats.reduce((sum, item) => sum + item.seconds, 0)
  }

  const getTopCategory = () => {
    if (stats.length === 0) return '-'
    return stats.sort((a, b) => b.seconds - a.seconds)[0].category
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
          {isTracking ? ' • 🔍 正在追踪中' : ' • ⏸️ 追踪已暂停'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
          <div className="text-sm font-medium text-blue-100 mb-1">总记录时间</div>
          <div className="text-3xl font-bold">
            {formatDuration(getTotalTime())}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">分类数量</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.length}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">最久分类</div>
          <div className="text-3xl font-bold text-blue-600">
            {getTopCategory()}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">分类统计</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : stats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无活动记录，等待系统追踪...
          </div>
        ) : (
          <div className="space-y-4">
            {stats
              .sort((a, b) => b.seconds - a.seconds)
              .map(stat => (
                <div key={stat.category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-lg font-medium text-gray-900">{stat.category}</span>
                  </div>
                  <span className="text-gray-600 font-medium">{formatDuration(stat.seconds)}</span>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
