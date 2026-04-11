// Tauri IPC invocations for habits
// 习惯数据 - Tauri 桥接层

import { invoke } from '@tauri-apps/api/core';
import type { Habit } from '../dataService';
import { isDesktop } from './activityIpc';

/**
 * Get all habits
 */
export async function getAllHabits(): Promise<Habit[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<Habit[]>('get_all_habits');
}

/**
 * Create a new habit
 */
export async function createHabit(habit: Omit<Habit, 'id' | 'streak' | 'checkins' | 'createdAt'>): Promise<Habit> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<Habit>('create_habit', { habit });
}

/**
 * Update an existing habit
 */
export async function updateHabit(id: string, habit: Partial<Habit>): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('update_habit', { id, habit });
}

/**
 * Delete a habit
 */
export async function deleteHabit(id: string): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('delete_habit', { id });
}

/**
 * Record a habit checkin
 */
export async function recordCheckin(habitId: string, date: string, value: number): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('record_habit_checkin', { habitId, date, value });
}

/**
 * Get checkins for a date range
 */
export async function getCheckins(startDate: string, endDate: string): Promise<
  Array<{ habit_id: string; date: string; value: number }>
> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke('get_checkins_range', { startDate, endDate });
}
