// 统计卡片 - 可复用组件
// 显示总记录时间、活动数量、分类数量

import React from 'react'
import type { Theme } from '../App'

interface StatsCardProps {
  totalMinutes: number
  activitiesCount: number
  totalCategories: number
  formatDurationMinutes: (minutes: number) => string
  theme?: Theme
}

const StatsCard: React.FC<StatsCardProps> = ({
  totalMinutes,
  activitiesCount,
  totalCategories,
  formatDurationMinutes,
  theme = 'light'
}) => {
  const isDark = theme === 'dark'
  const titleColor = isDark ? 'text-aether-text-dark-primary' : 'text-aether-text-primary'
  const textColor = isDark ? 'text-aether-text-dark-secondary' : 'text-aether-text-secondary'
  const cardBg = isDark ? 'bg-aether-dark-200' : 'bg-aether-200'
  const borderColor = isDark ? 'border-[var(--color-border-subtle)]' : 'border-[var(--color-border-subtle)]'

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-gradient-to-br from-primary to-success rounded-2xl p-6 text-[#fffefb]">
        <div className="text-sm font-medium text-orange-100 mb-1">总记录时间</div>
        <div className="text-2xl font-bold">
          {formatDurationMinutes(totalMinutes)}
        </div>
      </div>
      <div className={`${cardBg} rounded-2xl p-6 border ${borderColor}`}>
        <div className={`text-sm font-medium ${textColor} mb-1`}>活动数量</div>
        <div className={`text-2xl font-bold ${titleColor}`}>
          {activitiesCount}
        </div>
      </div>
      <div className={`${cardBg} rounded-2xl p-6 border ${borderColor}`}>
        <div className={`text-sm font-medium ${textColor} mb-1`}>分类数量</div>
        <div className={`text-2xl font-bold ${titleColor}`}>
          {totalCategories || 0}
        </div>
      </div>
    </div>
  )
}

export default StatsCard
