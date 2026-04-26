// Tauri IPC invocations for tasks
// 任务数据 - Tauri 桥接层

import { invoke } from '@tauri-apps/api/core';
import type { Task, TaskStatus, Subtask, RepeatType } from '../dataService';
import { isDesktop } from './activityIpc';

// Backend DbTask structure (from SQLite)
interface BackendDbTask {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: number;
  estimated_minutes: number;
  actual_minutes: number;
  status: string;
  due_date: string | null;
}

// Backend PlannedTask structure (from JSON file)
interface BackendPlannedTask {
  id: string;
  title: string;
  priority: number;
  estimated_minutes: number;
  actual_minutes: number;
  completed: boolean;
  created_at: string;
  project: string | null;
  repeat_type: string | null;
  subtasks: Array<{ id: string; title: string; completed: boolean }> | null;
  due_date: string | null;
}

// Convert backend DbTask to frontend Task format
function dbTaskToFrontend(backend: BackendDbTask): Task {
  const statusMap: Record<string, TaskStatus> = {
    todo: 'todo',
    pending: 'todo', // Backward compatibility
    in_progress: 'in_progress',
    paused: 'paused',
    completed: 'completed',
    archived: 'archived',
  };

  return {
    id: backend.id,
    title: backend.title,
    priority: Math.max(1, Math.min(5, backend.priority)) as 1 | 2 | 3 | 4 | 5,
    status: statusMap[backend.status] || 'todo',
    estimatedMinutes: backend.estimated_minutes,
    actualMinutes: backend.actual_minutes,
    project: backend.category || '',
    subtasks: [], // DbTask doesn't have subtasks field
    dueDate: backend.due_date || '',
    repeatType: 'none', // DbTask doesn't have repeat_type
    createdAt: new Date().toISOString(), // Default, not in DbTask
    timeLoggedMinutes: 0, // Initialize with 0
  };
}

// Convert backend PlannedTask to frontend Task format
function plannedTaskToFrontend(backend: BackendPlannedTask): Task {
  const repeatMap: Record<string, RepeatType> = {
    none: 'none',
    daily: 'daily',
    weekly: 'weekly',
    monthly: 'monthly',
  };

  return {
    id: backend.id,
    title: backend.title,
    priority: Math.max(1, Math.min(5, backend.priority)) as 1 | 2 | 3 | 4 | 5,
    status: backend.completed ? 'completed' as TaskStatus : 'pending' as TaskStatus,
    estimatedMinutes: backend.estimated_minutes,
    actualMinutes: backend.actual_minutes,
    project: backend.project || '',
    subtasks: (backend.subtasks || []).map(s => ({
      id: s.id,
      title: s.title,
      completed: s.completed,
    })),
    dueDate: backend.due_date || '',
    repeatType: repeatMap[backend.repeat_type || 'none'] || 'none',
    createdAt: backend.created_at,
  };
}

// Convert frontend Task to backend format for create/update
function toBackendTask(task: Partial<Task>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (task.title !== undefined) result.title = task.title;
  if (task.priority !== undefined) result.priority = task.priority;
  if (task.estimatedMinutes !== undefined) result.estimated_minutes = task.estimatedMinutes;
  if (task.actualMinutes !== undefined) result.actual_minutes = task.actualMinutes;
  if (task.status !== undefined) {
    result.completed = task.status === 'completed';
    result.status = task.status;
  }
  if (task.project !== undefined) result.project = task.project;
  if (task.repeatType !== undefined) result.repeat_type = task.repeatType;
  if (task.subtasks !== undefined) {
    result.subtasks = task.subtasks.map((s: Subtask) => ({
      id: s.id,
      title: s.title,
      completed: s.completed,
    }));
  }
  if (task.dueDate !== undefined) result.due_date = task.dueDate;
  return result;
}

/**
 * Get all tasks (filtered by date if provided)
 * Uses SQLite backend
 */
export async function getTasks(date?: string): Promise<Task[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  if (date) {
    const result = await invoke<BackendDbTask[]>('get_today_tasks', { date });
    return result.map(dbTaskToFrontend);
  }
  const result = await invoke<BackendDbTask[]>('get_all_tasks');
  return result.map(dbTaskToFrontend);
}

/**
 * Get today's planned tasks from JSON file
 */
export async function getTodayPlannedTasks(): Promise<Task[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const result = await invoke<BackendPlannedTask[]>('get_today_planned_tasks');
  return result.map(plannedTaskToFrontend);
}

/**
 * Create a new task
 * Uses SQLite backend
 */
export async function createTask(task: Omit<Task, 'id'>): Promise<Task> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  // Convert to backend DbTask format
  const backendTask = {
    id: crypto.randomUUID(),
    title: task.title,
    description: null,
    category: task.project || null,
    priority: task.priority,
    estimated_minutes: task.estimatedMinutes,
    actual_minutes: task.actualMinutes,
    status: task.status,
    due_date: task.dueDate || null,
  };
  await invoke('create_task', { task: backendTask });
  return { ...task, id: backendTask.id } as Task;
}

/**
 * Add a planned task (JSON file)
 */
export async function addPlannedTask(
  title: string,
  priority: number,
  estimatedMinutes: number,
  project?: string,
  repeatType?: string
): Promise<Task> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const result = await invoke<BackendPlannedTask>('add_planned_task', {
    title,
    priority,
    estimated_minutes: estimatedMinutes,
    project,
    repeat_type: repeatType,
  });
  return plannedTaskToFrontend(result);
}

/**
 * Update an existing task
 * Uses SQLite backend
 */
export async function updateTask(id: string, update: Partial<Task>): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  // Build the backend update object
  const backendUpdate: Record<string, unknown> = { id };
  if (update.title !== undefined) backendUpdate.title = update.title;
  if (update.priority !== undefined) backendUpdate.priority = update.priority;
  if (update.estimatedMinutes !== undefined) backendUpdate.estimated_minutes = update.estimatedMinutes;
  if (update.actualMinutes !== undefined) backendUpdate.actual_minutes = update.actualMinutes;
  if (update.status !== undefined) backendUpdate.status = update.status;
  if (update.project !== undefined) backendUpdate.category = update.project;
  if (update.dueDate !== undefined) backendUpdate.due_date = update.dueDate;

  await invoke('update_task', { task: backendUpdate });
}

/**
 * Update a planned task (JSON file)
 */
export async function updatePlannedTask(
  id: string,
  update: Partial<Task>
): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const backendUpdate = toBackendTask(update);
  await invoke('update_planned_task', { id, ...backendUpdate });
}

/**
 * Delete a task
 * Uses SQLite backend
 */
export async function deleteTask(id: string): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('delete_task', { id });
}

/**
 * Delete a planned task (JSON file)
 */
export async function deletePlannedTask(id: string): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('delete_planned_task', { id });
}

/**
 * Get task actual time by matching activities
 */
export async function getTaskActualTime(taskId: string): Promise<number> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<number>('get_task_actual_time', { task_id: taskId });
}

/**
 * Match activity to task
 */
export async function matchActivityToTask(activityId: string, taskId: string): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('match_activity_to_task', { activity_id: activityId, task_id: taskId });
}

/**
 * AI reschedule tasks
 */
export async function aiRescheduleTasks(
  tasks: Task[],
  currentHour: number
): Promise<Task[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  // Convert tasks to backend format
  const backendTasks = tasks.map(t => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    estimated_minutes: t.estimatedMinutes,
    actual_minutes: t.actualMinutes,
    completed: t.status === 'completed',
    created_at: t.createdAt,
    project: t.project || null,
    repeat_type: t.repeatType,
    subtasks: t.subtasks.map(s => ({ id: s.id, title: s.title, completed: s.completed })),
    due_date: t.dueDate || null,
  }));
  const result = await invoke<BackendPlannedTask[]>('ai_reschedule_tasks', {
    tasks: backendTasks,
    current_hour: currentHour,
  });
  return result.map(plannedTaskToFrontend);
}
