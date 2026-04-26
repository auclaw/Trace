// Tauri IPC invocations for Execution Guardian
// 执行守护者 - Tauri 桥接层

import { invoke } from '@tauri-apps/api/core';
import { isDesktop } from './activityIpc';

// Backend DbGuardianSettings structure
export interface BackendGuardianSettings {
  id: number | null;
  last_morning_ritual_date: string | null;
  last_daily_review_date: string | null;
  tomorrow_top_task_id: string | null;
  daily_review_time: string | null;
  enable_morning_ritual: number | null;
  enable_daily_review: number | null;
  enable_now_engine: number | null;
}

// Backend DbDailyReview structure
export interface BackendDailyReview {
  id: string;
  date: string;
  mood: string | null;
  win_note: string | null;
  improve_note: string | null;
  focus_minutes: number | null;
  completed_tasks: number | null;
}

// Frontend GuardianSettings format
export interface GuardianSettings {
  lastMorningRitualDate: string | null;
  lastDailyReviewDate: string | null;
  tomorrowTopTaskId: string | null;
  dailyReviewTime: string;
  enableMorningRitual: boolean;
  enableDailyReview: boolean;
  enableNowEngine: boolean;
}

// Frontend DailyReview format
export interface DailyReview {
  id: string;
  date: string;
  mood: 'great' | 'good' | 'bad' | null;
  winNote: string | null;
  improveNote: string | null;
  focusMinutes: number;
  completedTasks: number;
}

// Convert backend GuardianSettings to frontend format
function toFrontendGuardianSettings(backend: BackendGuardianSettings): GuardianSettings {
  return {
    lastMorningRitualDate: backend.last_morning_ritual_date || null,
    lastDailyReviewDate: backend.last_daily_review_date || null,
    tomorrowTopTaskId: backend.tomorrow_top_task_id || null,
    dailyReviewTime: backend.daily_review_time || '20:00',
    enableMorningRitual: backend.enable_morning_ritual === 1,
    enableDailyReview: backend.enable_daily_review === 1,
    enableNowEngine: backend.enable_now_engine === 1,
  };
}

// Convert frontend format to backend format
function toBackendGuardianSettings(frontend: Partial<GuardianSettings>): BackendGuardianSettings {
  return {
    id: null,
    last_morning_ritual_date: frontend.lastMorningRitualDate || null,
    last_daily_review_date: frontend.lastDailyReviewDate || null,
    tomorrow_top_task_id: frontend.tomorrowTopTaskId || null,
    daily_review_time: frontend.dailyReviewTime || null,
    enable_morning_ritual: frontend.enableMorningRitual === undefined ? null : frontend.enableMorningRitual ? 1 : 0,
    enable_daily_review: frontend.enableDailyReview === undefined ? null : frontend.enableDailyReview ? 1 : 0,
    enable_now_engine: frontend.enableNowEngine === undefined ? null : frontend.enableNowEngine ? 1 : 0,
  };
}

// Convert backend DailyReview to frontend format
function toFrontendDailyReview(backend: BackendDailyReview): DailyReview {
  return {
    id: backend.id,
    date: backend.date,
    mood: backend.mood as DailyReview['mood'] || null,
    winNote: backend.win_note || null,
    improveNote: backend.improve_note || null,
    focusMinutes: backend.focus_minutes || 0,
    completedTasks: backend.completed_tasks || 0,
  };
}

/**
 * Get guardian settings
 */
export async function getGuardianSettings(): Promise<GuardianSettings> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const result = await invoke<BackendGuardianSettings>('get_guardian_settings');
  return toFrontendGuardianSettings(result);
}

/**
 * Update guardian settings
 */
export async function updateGuardianSettings(settings: Partial<GuardianSettings>): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const backendSettings = toBackendGuardianSettings(settings);
  await invoke('update_guardian_settings', { settings: backendSettings });
}

/**
 * Create or update a daily review
 */
export async function saveDailyReview(review: Omit<DailyReview, 'id'> & { id?: string }): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const backendReview: BackendDailyReview = {
    id: review.id || crypto.randomUUID(),
    date: review.date,
    mood: review.mood,
    win_note: review.winNote,
    improve_note: review.improveNote,
    focus_minutes: review.focusMinutes,
    completed_tasks: review.completedTasks,
  };
  await invoke('create_daily_review', { review: backendReview });
}

/**
 * Get daily review for a specific date
 */
export async function getDailyReview(date: string): Promise<DailyReview | null> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const result = await invoke<BackendDailyReview | null>('get_daily_review', { date });
  return result ? toFrontendDailyReview(result) : null;
}
