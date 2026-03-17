import { invoke } from '@tauri-apps/api'

// 获取今日活动
export async function getTodayActivities() {
  const result = await invoke('get_today_activities')
  return result as { data: any[] }
}

// 获取今日统计
export async function getTodayStats() {
  const result = await invoke('get_today_stats')
  return result as { data: any }
}

// 获取周统计
export async function getWeeklyStats() {
  const result = await invoke('get_weekly_stats')
  return result as { data: any[] }
}

// 获取设置
export async function getSettings() {
  const result = await invoke('get_settings')
  return result as { data: any }
}

// 保存设置
export async function saveSettings(settings: any) {
  await invoke('save_settings', { settings })
}

// 切换追踪状态
export async function toggleTracking(enable: boolean) {
  const result = await invoke('toggle_tracking', { enable })
  return result as boolean
}

// 检查追踪状态
export async function checkTrackingStatus() {
  const result = await invoke('check_tracking_status')
  return result as boolean
}

// 调用AI分类
export async function classifyActivity(appName: string, windowTitle: string) {
  const result = await invoke('classify_activity', { appName, windowTitle })
  return result as string
}
