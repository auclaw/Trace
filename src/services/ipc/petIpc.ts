// Tauri IPC invocations for virtual pet
// 虚拟宠物数据 - Tauri 桥接层

import { invoke } from '@tauri-apps/api/core';
import type { Pet } from '../dataService';
import { isDesktop } from './activityIpc';

/**
 * Get pet data
 */
export async function getPet(): Promise<Pet | null> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  return invoke<Pet | null>('get_pet');
}

/**
 * Save/update pet data
 */
export async function savePet(pet: Pet): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  await invoke('save_pet', { pet });
}
