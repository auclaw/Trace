// Tauri IPC invocations for app settings
// 应用设置 - Tauri 桥接层

import { invoke } from '@tauri-apps/api/core';
import type { AppSettings } from '../dataService';
import { isDesktop } from './activityIpc';

// Backend Settings structure (JSON file)
interface BackendSettings {
  ai_api_key: string;
  ai_provider: string;
  auto_start_on_boot: boolean;
  ignored_applications: string[];
}

// Backend DbSettings structure (SQLite)
interface BackendDbSettings {
  theme: string;
  color_theme: string;
  background_skin: string;
  daily_goal_minutes: number;
  language: string;
  ai_api_key: string | null;
  ai_provider: string | null;
  auto_start_on_boot: number;
  blocked_patterns: string | null;
  feature_flags: string | null;
}

// Convert backend DbSettings to frontend format
function dbSettingsToFrontend(backend: BackendDbSettings): AppSettings {
  let blockedPatterns: AppSettings['blockedPatterns'] = [];
  let featureFlags: AppSettings['featureFlags'] = {};

  try {
    if (backend.blocked_patterns) {
      blockedPatterns = JSON.parse(backend.blocked_patterns);
    }
  } catch {
    // ignore parse errors
  }

  try {
    if (backend.feature_flags) {
      featureFlags = JSON.parse(backend.feature_flags);
    }
  } catch {
    // ignore parse errors
  }

  return {
    theme: backend.theme || 'light',
    colorTheme: backend.color_theme || 'blue',
    backgroundSkin: backend.background_skin || 'solid',
    featureFlags,
    dailyGoalMinutes: backend.daily_goal_minutes || 240,
    language: backend.language || 'zh-CN',
    aiApiKey: backend.ai_api_key || undefined,
    aiProvider: (backend.ai_provider as AppSettings['aiProvider']) || 'ernie',
    autoStartOnBoot: !!backend.auto_start_on_boot,
    blockedPatterns,
  };
}

// Convert frontend settings to backend DbSettings format
function toDbSettings(settings: Partial<AppSettings>): Partial<BackendDbSettings> {
  const result: Partial<BackendDbSettings> = {};
  if (settings.theme !== undefined) result.theme = settings.theme;
  if (settings.colorTheme !== undefined) result.color_theme = settings.colorTheme;
  if (settings.backgroundSkin !== undefined) result.background_skin = settings.backgroundSkin;
  if (settings.dailyGoalMinutes !== undefined) result.daily_goal_minutes = settings.dailyGoalMinutes;
  if (settings.language !== undefined) result.language = settings.language;
  if (settings.aiApiKey !== undefined) result.ai_api_key = settings.aiApiKey;
  if (settings.aiProvider !== undefined) result.ai_provider = settings.aiProvider;
  if (settings.autoStartOnBoot !== undefined) result.auto_start_on_boot = settings.autoStartOnBoot ? 1 : 0;
  if (settings.blockedPatterns !== undefined) result.blocked_patterns = JSON.stringify(settings.blockedPatterns);
  if (settings.featureFlags !== undefined) result.feature_flags = JSON.stringify(settings.featureFlags);
  return result;
}

/**
 * Get app settings from SQLite
 */
export async function getSettings(): Promise<AppSettings> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const result = await invoke<BackendDbSettings>('get_app_settings');
  return dbSettingsToFrontend(result);
}

/**
 * Update app settings in SQLite
 */
export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const backendSettings = toDbSettings(settings);
  await invoke('update_app_settings', { settings: backendSettings });
}

/**
 * Get settings from JSON file (legacy)
 */
export async function getLegacySettings(): Promise<BackendSettings> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<BackendSettings>('get_settings');
}

/**
 * Save settings to JSON file (legacy)
 */
export async function saveLegacySettings(settings: BackendSettings): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('save_settings', { new_settings: settings });
}

/**
 * Toggle tracking
 */
export async function toggleTracking(enable: boolean): Promise<boolean> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<boolean>('toggle_tracking', { enable });
}

/**
 * Check tracking status
 */
export async function checkTrackingStatus(): Promise<boolean> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<boolean>('check_tracking_status');
}

/**
 * Get feature flags
 */
export async function getFeatureFlags(): Promise<Array<[string, boolean]>> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<Array<[string, boolean]>>('get_feature_flags');
}

/**
 * Set feature flag
 */
export async function setFeatureFlag(key: string, enabled: boolean): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('set_feature_flag', { key, enabled });
}
