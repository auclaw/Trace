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
  theme: _theme = 'light'
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-gradient-to-br from-primary to-success rounded-2xl p-6 text-[#fffefb]">
        <div className="text-sm font-medium text-orange-100 mb-1">总记录时间</div>
        <div className="text-2xl font-bold">
          {formatDurationMinutes(totalMinutes)}
        </div>
      </div>
      <div className="rounded-2xl p-6 border" style={{ background: 'var(--color-bg-surface-2)', borderColor: 'var(--color-border-subtle)' }}>
        <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>活动数量</div>
        <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {activitiesCount}
        </div>
      </div>
      <div className="rounded-2xl p-6 border" style={{ background: 'var(--color-bg-surface-2)', borderColor: 'var(--color-border-subtle)' }}>
        <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>分类数量</div>
        <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {totalCategories || 0}
        </div>
      </div>
    </div>
  )
}

export default StatsCard
