// Tauri IPC invocations for focus sessions
// 专注会话数据 - Tauri 桥接层

import { invoke } from '@tauri-apps/api/core';
import type { FocusSession } from '../dataService';
import { isDesktop } from './activityIpc';

/**
 * Get all focus sessions
 */
export async function getAllFocusSessions(): Promise<FocusSession[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<FocusSession[]>('get_all_focus_sessions');
}

/**
 * Get focus sessions for a specific date
 */
export async function getFocusSessions(date: string): Promise<FocusSession[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<FocusSession[]>('get_focus_sessions_by_date', { date });
}

/**
 * Create a new focus session
 */
export async function createFocusSession(session: Omit<FocusSession, 'id'>): Promise<FocusSession> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<FocusSession>('create_focus_session', { session });
}

/**
 * Update an existing focus session
 */
export async function updateFocusSession(id: string, session: Partial<FocusSession>): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('update_focus_session', { id, session });
}

/**
 * Delete a focus session
 */
export async function deleteFocusSession(id: string): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('delete_focus_session', { id });
}
