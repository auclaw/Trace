// Tauri IPC invocations for app settings
// 应用设置 - Tauri 桥接层

import { invoke } from '@tauri-apps/api/core';
import type { AppSettings } from '../dataService';
import { isDesktop } from './activityIpc';

/**
 * Get app settings
 */
export async function getSettings(): Promise<AppSettings> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<AppSettings>('get_settings');
}

/**
 * Update app settings
 */
export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('update_settings', { settings });
}
