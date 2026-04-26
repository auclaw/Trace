// Tauri IPC invocations for time blocks
// 事件数据 - Tauri 桥接层

import { invoke } from '@tauri-apps/api/core';
import type { TimeBlock, ActivityCategory } from '../dataService';
import { isDesktop } from './activityIpc';

// Backend DbTimeBlock structure
interface BackendDbTimeBlock {
  id: string;
  task_id: string | null;
  title: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  category: string | null;
  notes: string | null;
  date: string;
  is_completed: boolean;
}

// Convert backend format to frontend format
function toFrontendTimeBlock(backend: BackendDbTimeBlock): TimeBlock {
  return {
    id: backend.id,
    title: backend.title,
    startTime: backend.start_time,
    endTime: backend.end_time,
    durationMinutes: backend.duration_minutes,
    category: (backend.category || '其他') as ActivityCategory,
    date: backend.date,
    completed: backend.is_completed,
    source: 'auto' as const, // Backend auto-tracked events default to 'auto'
  };
}

// Convert frontend format to backend format
function toBackendTimeBlock(frontend: Partial<TimeBlock>): BackendDbTimeBlock {
  return {
    id: frontend.id || crypto.randomUUID(),
    task_id: null, // Not used in frontend yet
    title: frontend.title || '',
    start_time: frontend.startTime || new Date().toISOString(),
    end_time: frontend.endTime || new Date().toISOString(),
    duration_minutes: frontend.durationMinutes || 0,
    category: frontend.category || null,
    notes: null,
    date: frontend.date || new Date().toISOString().split('T')[0],
    is_completed: frontend.completed || false,
  };
}

/**
 * Get time blocks for a specific date
 */
export async function getTimeBlocks(date: string): Promise<TimeBlock[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const result = await invoke<BackendDbTimeBlock[]>('get_time_blocks_by_date', { date });
  return result.map(toFrontendTimeBlock);
}

/**
 * Create a new time block
 */
export async function addTimeBlock(block: Omit<TimeBlock, 'id'>): Promise<TimeBlock> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const backendBlock = toBackendTimeBlock(block as TimeBlock);
  await invoke('create_time_block', { block: backendBlock });
  return { ...block, id: backendBlock.id } as TimeBlock;
}

/**
 * Update an existing time block
 */
export async function updateTimeBlock(id: string, block: Partial<TimeBlock>): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const backendBlock = toBackendTimeBlock({ ...block, id });
  await invoke('update_time_block', { block: backendBlock });
}

/**
 * Delete a time block
 */
export async function deleteTimeBlock(id: string): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('delete_time_block', { id });
}
