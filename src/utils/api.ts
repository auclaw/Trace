import { invoke } from '@tauri-apps/api/core'
import { getToken } from './auth'

export const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000'

// 通用 API 请求函数 (用于后端 Flask API)
export async function apiRequest<T = any>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<{ code: number; data: T; msg?: string }> {
  const token = getToken()
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }
  const res = await fetch(`${API_HOST}${path}`, options)
  return await res.json()
}

// 类型导入
import type { Activity, DailyStats, WeeklyStatItem, Settings } from './tracking'

// 获取今日活动统计 (远程API)
export async function getTodayStatsRemote() {
  const token = getToken()
  const res = await fetch(`${API_HOST}/api/activities/today`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return await res.json() as { code: number, data: any[] }
}

// 保存活动
export async function saveActivities(activities: any[]) {
  const token = getToken()
  const res = await fetch(`${API_HOST}/api/activities/save`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ activities })
  })
  return await res.json() as { code: number, msg: string }
}

// AI分类
export async function aiClassify(windows: [string, string][], provider: 'ernie' | 'doubao' = 'ernie') {
  const token = getToken()
  const res = await fetch(`${API_HOST}/api/ai/classify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ windows, provider })
  })
  const data = await res.json() as { code: number, data: { category: string } }
  return data.data.category
}

// ============= 原生调用保留 =============
// 类型导出
export type { Activity, DailyStats, WeeklyStatItem, Settings } from './tracking'

// 获取今日活动
export async function getTodayActivities() {
  const result = await invoke('get_today_activities')
  return result as Activity[]
}

// 获取指定日期所有活动
export async function getActivitiesByDate(dateStr: string): Promise<Activity[]> {
  return await invoke('get_activities_by_date', { date_str: dateStr })
}

// 获取今日统计
export async function getTodayStats(): Promise<DailyStats> {
  return await invoke('get_today_stats')
}

// 获取指定日期统计
export async function getStatsByDate(dateStr: string): Promise<DailyStats> {
  return await invoke('get_daily_stats_by_date', { date_str: dateStr })
}

// 获取每周统计
export async function getWeeklyStats(): Promise<WeeklyStatItem[]> {
  return await invoke('get_weekly_stats')
}

// 获取月度热力图统计
import type { MonthlyDayStat } from './tracking'

export async function getMonthlyStats(year: number, month: number): Promise<MonthlyDayStat[]> {
  return await invoke('get_monthly_stats', { year, month })
}

// 获取设置
export async function getSettings(): Promise<Settings> {
  return await invoke('get_settings')
}

// 保存设置
export async function saveSettings(settings: Settings): Promise<void> {
  await invoke('save_settings', { new_settings: settings })
}

// 切换追踪状态
export async function toggleTracking(enable: boolean): Promise<boolean> {
  return await invoke('toggle_tracking', { enable })
}

// 检查追踪状态
export async function checkTrackingStatus(): Promise<boolean> {
  return await invoke('check_tracking_status')
}

// AI 分类活动
export async function classifyActivity(appName: string, windowTitle: string): Promise<string> {
  return await invoke('classify_activity', { app_name: appName, window_title: windowTitle })
}

// 删除活动（手动编辑）
export async function deleteActivity(id: string): Promise<void> {
  return await invoke('delete_activity', { id })
}

// 更新活动分类（手动编辑）
export async function updateActivityCategory(id: string, category: string): Promise<void> {
  return await invoke('update_activity_category', { id, category })
}

// 获取所有历史活动用于导出
export async function getAllActivitiesExport(): Promise<Activity[]> {
  return await invoke('get_all_activities_export')
}

// 创建手动活动
export async function createActivity(
  name: string,
  windowTitle: string,
  category: string | null,
  startTimeMs: number,
  durationMinutes: number
): Promise<Activity> {
  return await invoke('create_activity', {
    name,
    window_title: windowTitle,
    category,
    start_time_ms: startTimeMs,
    duration_minutes: durationMinutes
  })
}

// 更新活动
export async function updateActivity(
  id: string,
  name?: string,
  windowTitle?: string,
  category?: string | null,
  startTimeMs?: number,
  durationMinutes?: number
): Promise<void> {
  return await invoke('update_activity', {
    id,
    name,
    window_title: windowTitle,
    category,
    start_time_ms: startTimeMs,
    duration_minutes: durationMinutes
  })
}
