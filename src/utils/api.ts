import { invoke } from '@tauri-apps/api'
import { getToken } from './auth'

const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000'

// 获取今日活动统计
export async function getTodayStats() {
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
// 获取今日活动
export async function getTodayActivities() {
  const result = await invoke('get_today_activities')
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
