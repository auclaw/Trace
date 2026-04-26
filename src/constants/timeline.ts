/**
 * Timeline 相关常量
 * 在多个组件之间共享，确保一致性
 */

// ====================== 时间网格配置 ======================

/** 每小时高度 (px) - 决定时间线整体密度 */
export const HOUR_HEIGHT = 80

/** 开始时间 - 24小时制 */
export const START_HOUR = 0

/** 结束时间 - 24小时制 */
export const END_HOUR = 24

/** 一天的总高度 */
export const DAY_HEIGHT = HOUR_HEIGHT * (END_HOUR - START_HOUR)

/** 吸附精度（分钟）*/
export const SNAP_MINUTES = 15

/** 拖拽调整大小的热区高度 */
export const DRAG_EDGE_HEIGHT = 12

// ====================== 冲突检测配置 ======================

/** 严重冲突阈值（重叠百分比）*/
export const SEVERE_CONFLICT_THRESHOLD = 0.8

/** 警告冲突阈值（重叠百分比）*/
export const WARNING_CONFLICT_THRESHOLD = 0.5

// ====================== 分类颜色 ======================

import type { ActivityCategory } from '../services/dataService'

/** 分类颜色映射 - 全项目统一使用 */
export const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  '开发': '#79BEEB',
  '工作': '#79BEEB',
  '会议': '#D4C4FB',
  '休息': '#A8E6CF',
  '学习': '#FFD3B6',
  '娱乐': '#FFB3C6',
  '运动': '#FFE5B4',
  '阅读': '#B4D4FF',
  '其他': '#9E9899',
}

/** 分类图标映射 */
export const CATEGORY_ICONS: Record<string, string> = {
  '工作': '💼',
  '学习': '📖',
  '健身': '🏃',
  '会议': '👥',
  '休息': '☕',
  '阅读': '📚',
  '写作': '✍️',
  '编程': '💻',
  '其他': '📌',
}

// ====================== 视觉设计常量 ======================

/** 卡片阴影 - 统一风格 */
export const CARD_SHADOW = '4px 4px 0px #D6D3CD'
export const CARD_BORDER_COLOR = '#D6D3CD'
export const CARD_BG = '#FFFFFF'
