import { invoke } from '@tauri-apps/api/core'
import { getToken } from './auth'

export const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:2345'

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

// ============= 环境检测: Tauri native vs Browser dev =============

function isBrowserDev(): boolean {
  // 浏览器环境中没有 Tauri，使用 HTTP API 读取本地数据
  return typeof window !== 'undefined' && !(window as any).__TAURI__
}

// ============= 原生调用保留 =============
// 类型导出
export type { Activity, DailyStats, WeeklyStatItem, Settings } from './tracking'

// 获取今日活动
export async function getTodayActivities(): Promise<Activity[]> {
  if (isBrowserDev()) {
    // Browser dev mode: use HTTP API
    const res = await apiRequest<Activity[]>('/api/browser/get-today-activities', 'GET')
    if (res.code === 200) {
      return res.data
    }
    return []
  }
  // Tauri native: use invoke
  const result = await invoke('get_today_activities')
  return result as Activity[]
}

// 获取指定日期所有活动
export async function getActivitiesByDate(dateStr: string): Promise<Activity[]> {
  if (isBrowserDev()) {
    // Browser dev mode: use HTTP API
    const res = await apiRequest<Activity[]>(`/api/browser/get-activities-by-date?date=${dateStr}`, 'GET')
    if (res.code === 200) {
      return res.data
    }
    return []
  }
  // Tauri native: use invoke
  return await invoke('get_activities_by_date', { date_str: dateStr })
}

// 获取今日统计
export async function getTodayStats(): Promise<DailyStats> {
  if (isBrowserDev()) {
    // Browser dev mode: use HTTP API
    const res = await apiRequest<DailyStats>('/api/browser/get-today-stats', 'GET')
    if (res.code === 200) {
      return res.data
    }
    return {
      totalFocusMinutes: 0,
      totalCategories: 0,
      topCategory: ''
    }
  }
  // Tauri native: use invoke
  return await invoke('get_today_stats')
}

// 获取指定日期统计
export async function getStatsByDate(dateStr: string): Promise<DailyStats> {
  if (isBrowserDev()) {
    // Browser dev mode: use HTTP API
    const res = await apiRequest<DailyStats>(`/api/browser/get-today-stats?date=${dateStr}`, 'GET')
    if (res.code === 200) {
      return res.data
    }
    return {
      totalFocusMinutes: 0,
      totalCategories: 0,
      topCategory: ''
    }
  }
  // Tauri native: use invoke
  return await invoke('get_daily_stats_by_date', { date_str: dateStr })
}

// 获取每周统计
export async function getWeeklyStats(): Promise<WeeklyStatItem[]> {
  if (isBrowserDev()) {
    // Browser dev mode: not implemented for weekly yet, return empty
    // This is only used for weekly stats which isn't critical in dev
    return []
  }
  // Tauri native: use invoke
  return await invoke('get_weekly_stats')
}

// 获取月度热力图统计
import type { MonthlyDayStat } from './tracking'

export async function getMonthlyStats(year: number, month: number): Promise<MonthlyDayStat[]> {
  if (isBrowserDev()) {
    // Browser dev mode: use HTTP API
    const res = await apiRequest<MonthlyDayStat[]>(`/api/browser/get-monthly-stats?year=${year}&month=${month}`, 'GET')
    if (res.code === 200) {
      return res.data
    }
    return []
  }
  // Tauri native: use invoke
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

// ========== 新增 API: Tasks 任务 ==========

export interface TaskDTO {
  id: number
  user_id: number
  title: string
  description?: string
  category?: string
  estimated_minutes: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date?: string
  completed_at?: string
  created_at?: string
  updated_at?: string
}

// 获取任务列表
export async function getTasks(status?: string): Promise<TaskDTO[]> {
  const res = await apiRequest<TaskDTO[]>(
    `/api/tasks${status ? `?status=${status}` : ''}`,
    'GET'
  )
  return res.code === 200 ? res.data : []
}

// 获取单个任务
export async function getTask(taskId: number): Promise<TaskDTO | null> {
  const res = await apiRequest<TaskDTO>(`/api/tasks/${taskId}`, 'GET')
  return res.code === 200 ? res.data : null
}

// 创建任务
export async function createTask(data: Partial<TaskDTO>): Promise<number> {
  const res = await apiRequest<{ id: number }>('/api/tasks/create', 'POST', data)
  return res.data.id
}

// 更新任务
export async function updateTask(taskId: number, data: Partial<TaskDTO>): Promise<void> {
  await apiRequest(`/api/tasks/${taskId}/update`, 'POST', data)
}

// 删除任务
export async function deleteTask(taskId: number): Promise<void> {
  await apiRequest(`/api/tasks/${taskId}/delete`, 'POST')
}

// 切换任务完成状态
export async function toggleTaskCompleted(taskId: number): Promise<string> {
  const res = await apiRequest<{ status: string }>(`/api/tasks/${taskId}/toggle`, 'POST')
  return res.data.status
}

// ========== 新增 API: Timeblocks 时间块 ==========

export interface TimeBlockDTO {
  id: number
  user_id: number
  task_id?: number
  title: string
  start_time: string  // ISO datetime
  end_time: string
  duration_minutes: number
  category?: string
  notes?: string
  is_completed: number
  created_at?: string
  updated_at?: string
}

// 获取指定日期时间块
export async function getTimeblocks(date: string): Promise<TimeBlockDTO[]> {
  const res = await apiRequest<TimeBlockDTO[]>(`/api/timeblocks?date=${date}`, 'GET')
  return res.code === 200 ? res.data : []
}

// 创建时间块
export async function createTimeblock(data: Partial<TimeBlockDTO>): Promise<number> {
  const res = await apiRequest<{ id: number }>('/api/timeblocks/create', 'POST', data)
  return res.data.id
}

// 更新时间块
export async function updateTimeblock(blockId: number, data: Partial<TimeBlockDTO>): Promise<void> {
  await apiRequest(`/api/timeblocks/${blockId}/update`, 'POST', data)
}

// 删除时间块
export async function deleteTimeblock(blockId: number): Promise<void> {
  await apiRequest(`/api/timeblocks/${blockId}/delete`, 'POST')
}

// 切换时间块完成状态
export async function toggleTimeblockCompleted(blockId: number): Promise<number> {
  const res = await apiRequest<{ is_completed: number }>(`/api/timeblocks/${blockId}/toggle`, 'POST')
  return res.data.is_completed
}

// AI 建议日程安排
export async function aiSuggestSchedule(
  tasks: { title: string; estimated_minutes: number }[],
  totalHoursAvailable: number
): Promise<TimeBlockDTO[]> {
  const res = await apiRequest<TimeBlockDTO[]>(
    '/api/ai/suggest-schedule',
    'POST',
    { tasks, total_hours_available: totalHoursAvailable }
  )
  return res.code === 200 ? res.data : []
}

// ========== 新增 API: Virtual Pet 虚拟宠物 ==========

export interface PetDTO {
  id: number
  user_id: number
  pet_type: 'cat' | 'dog' | 'rabbit'
  name: string
  level: number
  experience: number
  hunger: number
  mood: number
  coins: number
  last_fed?: string
  last_interacted?: string
  created_at?: string
}

// 获取宠物信息
export async function getPet(): Promise<PetDTO> {
  const res = await apiRequest<PetDTO>('/api/pet', 'GET')
  return res.data
}

// 喂食
export async function feedPet(foodType: string = 'normal'): Promise<{
  hunger: number
  mood: number
  coins: number
  leveled_up: boolean
  new_level: number
}> {
  const res = await apiRequest('/api/pet/feed', 'POST', { food_type: foodType })
  return res.data
}

// 互动
export async function interactPet(petId: number): Promise<{
  mood: number
  experience_gained: number
}> {
  const res = await apiRequest('/api/pet/interact', 'POST', { pet_id: petId })
  return res.data
}

// 重命名/更换宠物类型
export async function renamePet(name: string, petType?: 'cat' | 'dog' | 'rabbit'): Promise<PetDTO> {
  const res = await apiRequest<PetDTO>('/api/pet/rename', 'POST', { name, pet_type: petType })
  return res.data
}

// 添加专注经验
export async function addPetFocus(minutes: number): Promise<{
  leveled_up: boolean
  new_level: number
  exp_gained: number
  pet: PetDTO
}> {
  const res = await apiRequest('/api/pet/add-focus', 'POST', { minutes })
  return res.data
}

// ========== 新增 API: AI Analysis AI分析 ==========

export interface WeeklyReportData {
  total_hours: number
  by_category: { category: string; hours: number }[]
  tasks_completed: number
  tasks_total: number
}

// 生成周报告
export async function generateWeeklyReport(data: WeeklyReportData): Promise<string> {
  const res = await apiRequest<{ report: string }>('/api/ai/weekly-report', 'POST', data)
  return res.data.report
}

// AI 分类活动（新火山引擎接口）
export async function aiClassifyActivity(
  appName: string,
  windowTitle: string,
  existingCategories: string[]
): Promise<string> {
  const res = await apiRequest<{ category: string }>(
    '/api/ai/classify-activity',
    'POST',
    { app_name: appName, window_title: windowTitle, existing_categories: existingCategories }
  )
  return res.data.category
}

// 建议任务分类
export async function aiSuggestCategory(title: string, description: string): Promise<string> {
  const res = await apiRequest<{ category: string }>(
    '/api/ai/suggest-category',
    'POST',
    { title, description }
  )
  return res.data.category
}

// ========== 新增 API: HR Gamification HR游戏化 ==========

export interface TeamRankingItem {
  user_id: number
  user_name: string
  level: number
  points: number
  total_hours: number
  experience: number
}

// 获取团队排行榜
export async function getTeamRanking(
  teamId: number,
  startDate: string,
  endDate: string
): Promise<TeamRankingItem[]> {
  const res = await apiRequest<TeamRankingItem[]>(
    `/api/team/ranking?team_id=${teamId}&start_date=${startDate}&end_date=${endDate}`,
    'GET'
  )
  return res.code === 200 ? res.data : []
}

// 获取成员统计
export async function getMemberStat(teamId: number): Promise<{
  id: number
  team_id: number
  user_id: number
  level: number
  experience: number
  points: number
  total_hours: number
  exp_to_next_level: number
}> {
  const res = await apiRequest(`/api/team/member-stat?team_id=${teamId}`, 'GET')
  return res.data
}
