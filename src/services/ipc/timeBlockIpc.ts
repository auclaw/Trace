// Tauri IPC invocations for time blocks
// 时间块数据 - Tauri 桥接层

import { invoke } from '@tauri-apps/api/core';
import type { TimeBlock } from '../dataService';
import { isDesktop } from './activityIpc';

/**
 * Get time blocks for a specific date
 */
export async function getTimeBlocks(date: string): Promise<TimeBlock[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<TimeBlock[]>('get_time_blocks', { date });
}

/**
 * Create a new time block
 */
export async function addTimeBlock(block: Omit<TimeBlock, 'id'>): Promise<TimeBlock> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<TimeBlock>('add_time_block', { block });
}

/**
 * Update an existing time block
 */
export async function updateTimeBlock(id: string, block: Partial<TimeBlock>): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('update_time_block', { id, block });
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
