// 自动追踪工具函数 - Tauri 后端调用
// 已迁移到 api.ts，这里保留导出兼容性

import type { ActivityCategory } from '../services/dataService';

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

// Pomodoro timer types (backend-driven)
export type PomodoroState = 'Idle' | 'Running' | 'Paused' | 'Break' | 'LongBreak'

export interface PomodoroData {
  state: PomodoroState
  remaining_seconds: number
  total_seconds: number
  completed_sessions: number
  progress_percent: number
}

import type { FeatureFlagKey } from './feature-flags'

export interface Settings {
  aiApiKey: string
  aiProvider: 'ernie' | 'doubao' | 'qwen' | 'glm' | 'openai' | 'claude' | 'gemini' | 'deepseek' | 'xai'
  autoStartOnBoot: boolean
  ignoredApplications: string[]
  // Feature flags
  featureFlags?: Record<FeatureFlagKey, boolean>
  // Privacy settings
  privacy_sync_mode?: 'full' | 'summary_only' | 'local_only'
  privacy_cloud_encryption?: boolean
  privacy_retain_raw_local?: boolean
  privacy_auto_delete_days?: number
  // Custom AI classification rules
  customAiClassificationRules?: string
  // Calendar sync
  calendarSyncEnabled?: boolean
  calendarSyncAutoCreateActivities?: boolean
  calendarSyncDefaultCategory?: ActivityCategory
  calendarSyncKeywordFilter?: string
  // AI personalized break reminders based on work patterns
  adaptiveBreakReminders?: boolean
  adaptiveBreakMinInterval?: number
  adaptiveBreakMaxInterval?: number
  adaptiveBreakUrgentThreshold?: number
}

// All functions re-exported from dataService for compatibility
import dataService from '../services/dataService';

// Compatibility re-exports - map old api.ts names to current dataService names
export const {
  getWeeklyStats,
  getSettings,
  deleteActivity,
  updateActivity,
} = dataService;

// Aliases for compatibility
export const getTodayActivities = dataService.getActivities;
export const getActivitiesByDate = dataService.getActivities;
export const getTodayStats = dataService.getDailyStats;
export const getStatsByDate = dataService.getDailyStats;
export const createActivity = dataService.addActivity;
export const saveSettings = dataService.updateSettings;

// Missing functions - placeholders for compatibility (should be removed eventually)
export const toggleTracking = () => Promise.resolve(false);
export const checkTrackingStatus = () => Promise.resolve(false);
export const classifyActivity = () => Promise.resolve({});
export const updateActivityCategory = () => Promise.resolve({});
export const getAllActivitiesExport = () => Promise.resolve([]);
export const aiClassify = () => Promise.resolve([]);
export const saveActivities = () => Promise.resolve([]);
export const getMonthlyStats = () => Promise.resolve([]);

export const getTodayStatsApi = dataService.getDailyStats;
