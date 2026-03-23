// 自动追踪工具函数 - Tauri 后端调用
// 已迁移到 api.ts，这里保留导出兼容性

// 类型定义保留在这里
export interface Activity {
  id: string
  name: string
  windowTitle: string
  category: string | null
  taskId: string | null
  startTimeMs: number
  durationMinutes: number
}

export interface DailyStats {
  totalFocusMinutes: number
  totalCategories: number
  topCategory: string
}

export interface WeeklyStatItem {
  category: string
  duration: number
  percentage: number
}

export interface MonthlyDayStat {
  day: number
  total_minutes: number
}

export interface Settings {
  aiApiKey: string
  aiProvider: 'ernie' | 'doubao'
  autoStartOnBoot: boolean
  ignoredApplications: string[]
  // Privacy settings
  privacy_sync_mode?: 'full' | 'summary_only' | 'local_only'
  privacy_cloud_encryption?: boolean
  privacy_retain_raw_local?: boolean
  privacy_auto_delete_days?: number
}

// 所有函数从 api.ts 重导出，保持 API 兼容性
export {
  getTodayActivities,
  getActivitiesByDate,
  getTodayStats,
  getStatsByDate,
  getWeeklyStats,
  getMonthlyStats,
  getSettings,
  saveSettings,
  toggleTracking,
  checkTrackingStatus,
  classifyActivity,
  deleteActivity,
  updateActivityCategory,
  getAllActivitiesExport,
  createActivity,
  updateActivity,
  aiClassify,
  getTodayStats as getTodayStatsApi,
  saveActivities
} from './api'
