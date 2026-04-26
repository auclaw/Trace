// Tauri IPC invocations for focus sessions
// 专注会话数据 - Tauri 桥接层

import { invoke } from '@tauri-apps/api/core';
import type { FocusSession, FocusType } from '../dataService';
import { isDesktop } from './activityIpc';

// Backend DbFocusSession structure
interface BackendDbFocusSession {
  id: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  type: string;
  completed: number;
}

// Convert backend format to frontend format
function toFrontendFocusSession(backend: BackendDbFocusSession): FocusSession {
  const typeMap: Record<string, FocusType> = {
    work: 'work',
    break: 'break',
    longBreak: 'longBreak',
  };

  return {
    id: backend.id,
    startTime: backend.start_time,
    endTime: backend.end_time || null,
    duration: backend.duration,
    type: typeMap[backend.type] || 'work',
    completed: backend.completed === 1,
  };
}

/**
 * Get all focus sessions
 */
export async function getAllFocusSessions(): Promise<FocusSession[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const result = await invoke<BackendDbFocusSession[]>('get_all_focus_sessions');
  return result.map(toFrontendFocusSession);
}

/**
 * Get focus sessions for a specific date
 */
export async function getFocusSessions(date: string): Promise<FocusSession[]> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const result = await invoke<BackendDbFocusSession[]>('get_focus_sessions_by_date', { date_prefix: date });
  return result.map(toFrontendFocusSession);
}

/**
 * Create a new focus session
 */
export async function createFocusSession(session: Omit<FocusSession, 'id'>): Promise<FocusSession> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const backendSession = {
    id: crypto.randomUUID(),
    start_time: session.startTime,
    end_time: session.endTime,
    duration: session.duration,
    type: session.type,
    completed: session.completed ? 1 : 0,
  };
  await invoke('create_focus_session', { session: backendSession });
  return { ...session, id: backendSession.id } as FocusSession;
}

/**
 * Pomodoro timer commands (from Rust backend)
 */
export async function getPomodoroState(): Promise<{
  state: string;
  remaining_seconds: number;
  sessions_completed: number;
}> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke('get_pomodoro_state');
}

export async function startPomodoro(durationMinutes: number, type: string): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('start_pomodoro', { duration_minutes: durationMinutes, type });
}

export async function pausePomodoro(): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('pause_pomodoro');
}

export async function resetPomodoro(): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('reset_pomodoro');
}

export async function stopPomodoro(): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('stop_pomodoro');
}

/**
 * Update an existing focus session
 */
export async function updateFocusSession(id: string, updates: Partial<FocusSession>): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  // This would call an actual IPC command in production
  console.warn('updateFocusSession IPC not implemented yet', { id, updates });
}

/**
 * Delete a focus session
 */
export async function deleteFocusSession(id: string): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  // This would call an actual IPC command in production
  console.warn('deleteFocusSession IPC not implemented yet', { id });
}
