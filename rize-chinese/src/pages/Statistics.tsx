import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getWeeklyStats } from '../utils/api'

interface StatItem {
  category: string
  duration: number
  percentage: number
}

const Statistics: React.FC = () => {
  const [data, setData] = useState<StatItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await getWeeklyStats()
      setData(res.data)
    } catch (error) {
      console.error('加载统计失败', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`
    }
    return `${mins}m`
  }

  const chartData = data.map(item => ({
    name: item.category,
    时长: item.duration
  }))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">本周统计</h2>
        <p className="text-gray-500">按分类查看时间分布</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无数据</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatDuration} />
                  <Tooltip formatter={(value) => formatDuration(value as number)} />
                  <Bar dataKey="时长" fill="#1677ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">详细分类统计</h3>
            <div className="space-y-4">
              {data
                .sort((a, b) => b.duration - a.duration)
                .map(item => (
                  <div key={item.category} className="flex items-center">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{item.category}</span>
                        <span className="text-sm text-gray-500">{formatDuration(item.duration)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Statistics
