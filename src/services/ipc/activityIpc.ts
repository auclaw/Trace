// Tauri IPC invocations for activities
// 活动数据 - Tauri 桥接层

import { invoke } from '@tauri-apps/api/core';
import type { Activity } from '../dataService';

/**
 * Check if we're running in Tauri desktop environment
 */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Get all activities for a specific date
 */
export async function getActivities(date: string): Promise<Activity[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<Activity[]>('get_activities_by_date', { date });
}

/**
 * Get activities in date range
 */
export async function getActivitiesRange(startDate: string, endDate: string): Promise<Activity[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<Activity[]>('get_activities_range', { startDate, endDate });
}

/**
 * Add a new activity
 */
export async function addActivity(activity: Activity): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('add_activity', { activity });
}

/**
 * Update an existing activity
 */
export async function updateActivity(id: string, activity: Partial<Activity>): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('update_activity', { id, activity });
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
  await invoke('delete_activities', { ids });
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
  return invoke('get_daily_stats', { date });
}

/**
 * Get weekly statistics
 */
export async function getWeeklyStats(startDate: string, endDate: string): Promise<
  Record<string, { totalMinutes: number; days: number }>
> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke('get_weekly_stats', { startDate, endDate });
}

/**
 * Get monthly statistics by category
 */
export async function getMonthlyStats(year: number, month: number): Promise<
  Record<string, number>
> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke('get_monthly_stats', { year, month });
}
