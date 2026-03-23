// 今日计划工具函数 - Tauri 后端调用
import { invoke } from '@tauri-apps/api/core'

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly'

export interface PlannedTask {
  id: string
  title: string
  priority: number  // 1-5, 1 highest
  estimatedMinutes: number
  actualMinutes: number
  completed: boolean
  created_at: string
  project?: string  // 项目分类
  repeat_type?: RepeatType
  subtasks?: SubTask[]
  due_date?: string  // 截止日期 YYYY-MM-DD
}

// 获取今日所有计划任务
export async function getTodayPlannedTasks(): Promise<PlannedTask[]> {
  return await invoke('get_today_planned_tasks')
}

// 添加计划任务
export async function addPlannedTask(
  title: string,
  priority: number,
  estimatedMinutes: number,
  project?: string,
  repeatType?: RepeatType
): Promise<PlannedTask> {
  return await invoke('add_planned_task', {
    title,
    priority,
    estimated_minutes: estimatedMinutes,
    project,
    repeat_type: repeatType
  })
}

// 更新计划任务
export async function updatePlannedTask(
  id: string,
  updates: {
    title?: string
    priority?: number
    estimated_minutes?: number
    completed?: boolean
    project?: string | null
    repeat_type?: RepeatType | null
    subtasks?: SubTask[]
  }
): Promise<void> {
  return await invoke('update_planned_task', {
    id,
    title: updates.title,
    priority: updates.priority,
    estimated_minutes: updates.estimated_minutes,
    completed: updates.completed,
    project: updates.project,
    repeat_type: updates.repeat_type,
    subtasks: updates.subtasks
  })
}

// 删除计划任务
export async function deletePlannedTask(id: string): Promise<void> {
  return await invoke('delete_planned_task', { id })
}

// 获取任务实际用时
export async function getTaskActualTime(id: string): Promise<number> {
  return await invoke('get_task_actual_time', { id })
}

// 匹配活动到任务
export async function matchActivityToTask(activityId: string, taskId: string): Promise<void> {
  return await invoke('match_activity_to_task', { activity_id: activityId, task_id: taskId })
}

// AI 重排计划（调用后端 Tauri）
export async function aiRescheduleTasks(
  tasks: PlannedTask[],
  currentTime: Date
): Promise<PlannedTask[]> {
  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60
  return await invoke('ai_reschedule_tasks', {
    tasks,
    current_hour: currentHour
  })
}
