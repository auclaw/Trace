// Tauri IPC invocations for activities
// 活动数据 - Tauri 桥接层

import { invoke } from '@tauri-apps/api/core';
import type { Activity, ActivityCategory } from '../dataService';

/**
 * Check if we're running in Tauri desktop environment
 */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

// Backend Activity structure (from Rust)
interface BackendActivity {
  id: string;
  name: string;
  window_title: string;
  category: string | null;
  task_id: string | null;
  start_time_ms: number;
  duration_minutes: number;
}

// Convert backend format to frontend format
function toFrontendActivity(backend: BackendActivity): Activity {
  const startDate = new Date(backend.start_time_ms);
  const endDate = new Date(backend.start_time_ms + backend.duration_minutes * 60 * 1000);

  return {
    id: backend.id,
    name: backend.name,
    category: (backend.category || '其他') as ActivityCategory,
    startTime: startDate.toISOString().replace('Z', '').split('.')[0],
    endTime: endDate.toISOString().replace('Z', '').split('.')[0],
    duration: backend.duration_minutes,
    isManual: false,
    isAiClassified: !!backend.category,
    aiApproved: backend.category ? null : null,
  };
}

// Convert frontend format to backend format
function toBackendActivity(frontend: Activity): BackendActivity {
  const startTimeMs = new Date(frontend.startTime).getTime();

  return {
    id: frontend.id,
    name: frontend.name,
    window_title: frontend.name,
    category: frontend.category || null,
    task_id: null,
    start_time_ms: startTimeMs,
    duration_minutes: frontend.duration,
  };
}

/**
 * Get today's activities
 */
export async function getTodayActivities(): Promise<Activity[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const result = await invoke<BackendActivity[]>('get_today_activities');
  return result.map(toFrontendActivity);
}

/**
 * Get all activities for a specific date
 */
export async function getActivities(date: string): Promise<Activity[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const result = await invoke<BackendActivity[]>('get_activities_by_date', { date });
  return result.map(toFrontendActivity);
}

/**
 * Get activities in date range
 */
export async function getActivitiesRange(startDate: string, _endDate: string): Promise<Activity[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  // Backend doesn't have this command, fetch by date for now
  // In a real implementation, we would add this command to the backend
  const result = await getActivities(startDate);
  return result;
}

/**
 * Add a new activity
 */
export async function addActivity(activity: Omit<Activity, 'id'>): Promise<Activity> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const backend = toBackendActivity({ ...activity, id: '' } as Activity);
  const result = await invoke<BackendActivity>('create_activity', {
    name: backend.name,
    window_title: backend.window_title,
    category: backend.category,
    start_time_ms: backend.start_time_ms,
    duration_minutes: backend.duration_minutes,
  });
  return toFrontendActivity(result);
}

/**
 * Update an existing activity
 */
export async function updateActivity(id: string, update: Partial<Activity>): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  // Map frontend fields to backend command parameters
  const params: Record<string, unknown> = { id };
  if (update.name !== undefined) params.name = update.name;
  if (update.category !== undefined) params.category = update.category;
  if (update.duration !== undefined) params.duration_minutes = update.duration;
  if (update.startTime !== undefined) {
    params.start_time_ms = new Date(update.startTime).getTime();
  }

  await invoke('update_activity', params);
}

/**
 * Delete an activity
 */
export async function deleteActivity(id: string): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('delete_activity', { id });
}

/**
 * Delete multiple activities
 */
export async function deleteActivities(ids: string[]): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  // Backend doesn't have bulk delete, delete one by one
  for (const id of ids) {
    await deleteActivity(id);
  }
}

/**
 * Update activity category
 */
export async function updateActivityCategory(id: string, category: string): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('update_activity_category', { id, category });
}

/**
 * Get daily statistics
 */
export async function getDailyStats(date: string): Promise<{
  totalMinutes: number;
  categories: Record<string, number>;
}> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const stats = await invoke<{
    total_focus_minutes: number;
    total_categories: number;
    top_category: string;
  }>('get_daily_stats_by_date', { date });

  // Backend DailyStats doesn't have category breakdown, return simplified version
  // In a real implementation, we would fetch activities and calculate categories
  return {
    totalMinutes: stats.total_focus_minutes,
    categories: {},
  };
}

/**
 * Get monthly statistics
 */
export async function getMonthlyStats(year: number, month: number): Promise<
  Array<{ day: number; total_minutes: number }>
> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke('get_monthly_stats', { year, month });
}

/**
 * Get weekly statistics
 */
export async function getWeeklyStats(): Promise<
  Array<{ category: string; duration: number; percentage: number }>
> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke('get_weekly_stats');
}

/**
 * Get all activities for export
 */
export async function getAllActivitiesExport(): Promise<Activity[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const result = await invoke<BackendActivity[]>('get_all_activities_export');
  return result.map(toFrontendActivity);
}

/**
 * Classify activity using AI
 */
export async function classifyActivity(
  appName: string,
  windowTitle: string
): Promise<string> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<string>('classify_activity', { appName, windowTitle });
}
