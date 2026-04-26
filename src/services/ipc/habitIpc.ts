// Tauri IPC invocations for habits
// 习惯数据 - Tauri 桥接层

import { invoke } from '@tauri-apps/api/core';
import type { Habit, HabitCategory } from '../dataService';
import { isDesktop } from './activityIpc';

// Backend DbHabit structure
interface BackendDbHabit {
  id: string;
  name: string;
  icon: string;
  target_minutes: number;
  target_count: number;
  color: string;
  streak: number;
  category: string;
  reminders: string; // JSON array as string
}

// Backend DbHabitCheckin structure
interface BackendDbHabitCheckin {
  habit_id: string;
  checkin_date: string;
  value: number;
}

// Convert backend habit to frontend format
function toFrontendHabit(backend: BackendDbHabit): Habit {
  let reminders: string[] = [];
  try {
    reminders = JSON.parse(backend.reminders || '[]');
  } catch {
    // ignore parse errors
  }

  const categoryMap: Record<string, HabitCategory> = {
    health: 'health',
    learning: 'learning',
    fitness: 'fitness',
    mindfulness: 'mindfulness',
    other: 'other',
  };

  return {
    id: backend.id,
    name: backend.name,
    icon: backend.icon,
    targetMinutes: backend.target_minutes,
    targetCount: backend.target_count,
    color: backend.color,
    streak: backend.streak,
    category: categoryMap[backend.category] || 'other',
    reminders,
    checkins: {}, // Checkins loaded separately
    createdAt: new Date().toISOString(), // Backend doesn't store
  };
}

// Convert frontend habit to backend format
function toBackendHabit(habit: Partial<Habit>): BackendDbHabit {
  return {
    id: habit.id || crypto.randomUUID(),
    name: habit.name || '',
    icon: habit.icon || '✅',
    target_minutes: habit.targetMinutes || 0,
    target_count: habit.targetCount || 1,
    color: habit.color || 'var(--color-blue)',
    streak: habit.streak || 0,
    category: habit.category || 'other',
    reminders: JSON.stringify(habit.reminders || []),
  };
}

/**
 * Get all habits
 */
export async function getAllHabits(): Promise<Habit[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const result = await invoke<BackendDbHabit[]>('get_all_habits');
  return result.map(toFrontendHabit);
}

/**
 * Create a new habit
 */
export async function createHabit(habit: Omit<Habit, 'id' | 'streak' | 'checkins' | 'createdAt'>): Promise<Habit> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const backendHabit = toBackendHabit(habit as Habit);
  // Create returns void, return the habit with generated id
  await invoke('create_habit', { habit: backendHabit });
  return {
    ...habit,
    id: backendHabit.id,
    streak: 0,
    checkins: {},
    createdAt: new Date().toISOString(),
  } as Habit;
}

/**
 * Update an existing habit
 */
export async function updateHabit(id: string, update: Partial<Habit>): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const backendHabit = toBackendHabit({ ...update, id });
  await invoke('update_habit', { habit: backendHabit });
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
 * Get habit checkins
 */
export async function getHabitCheckins(habitId: string): Promise<Record<string, number>> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const result = await invoke<BackendDbHabitCheckin[]>('get_habit_checkins', { habit_id: habitId });
  const checkins: Record<string, number> = {};
  result.forEach(c => {
    checkins[c.checkin_date] = c.value;
  });
  return checkins;
}

/**
 * Record a habit checkin
 */
export async function recordCheckin(habitId: string, date: string, value: number): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const checkin: BackendDbHabitCheckin = {
    habit_id: habitId,
    checkin_date: date,
    value,
  };
  await invoke('add_habit_checkin', { checkin });
}
