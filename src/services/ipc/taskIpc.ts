// Tauri IPC invocations for tasks
// 任务数据 - Tauri 桥接层

import { invoke } from '@tauri-apps/api/core';
import type { Task } from '../dataService';
import { isDesktop } from './activityIpc';

/**
 * Get all tasks (filtered by date if provided)
 */
export async function getTasks(date?: string): Promise<Task[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  if (date) {
    return invoke<Task[]>('get_today_tasks', { date });
  }
  return invoke<Task[]>('get_all_tasks');
}

/**
 * Create a new task
 */
export async function createTask(task: Omit<Task, 'id'>): Promise<Task> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<Task>('create_task', { task });
}

/**
 * Update an existing task
 */
export async function updateTask(id: string, task: Partial<Task>): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('update_task', { id, task });
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('delete_task', { id });
}
