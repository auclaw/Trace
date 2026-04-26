// Tauri IPC invocations for virtual pet
// 虚拟宠物数据 - Tauri 桥接层

import { invoke } from '@tauri-apps/api/core';
import type { Pet } from '../dataService';
import { isDesktop } from './activityIpc';

// Backend DbPet structure
interface BackendDbPet {
  id: number | null;
  pet_type: string;
  name: string;
  level: number;
  experience: number;
  hunger: number;
  mood: number;
  coins: number;
  last_fed: string;
  last_interacted: string;
  decoration: string | null;
}

// Convert backend format to frontend format
function toFrontendPet(backend: BackendDbPet): Pet {
  return {
    name: backend.name,
    type: backend.pet_type,
    level: backend.level,
    xp: backend.experience,
    hunger: backend.hunger,
    mood: backend.mood,
    coins: backend.coins,
    lastFed: backend.last_fed,
    lastInteracted: backend.last_interacted,
    decoration: backend.decoration || '',
  };
}

// Convert frontend format to backend format
function toBackendPet(frontend: Pet): BackendDbPet {
  return {
    id: null, // Backend handles this
    pet_type: frontend.type,
    name: frontend.name,
    level: frontend.level,
    experience: frontend.xp,
    hunger: frontend.hunger,
    mood: frontend.mood,
    coins: frontend.coins,
    last_fed: frontend.lastFed,
    last_interacted: frontend.lastInteracted,
    decoration: frontend.decoration || null,
  };
}

/**
 * Get pet data
 */
export async function getPet(): Promise<Pet | null> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const result = await invoke<BackendDbPet>('get_pet');
  // Backend always returns a pet (creates default if none)
  return toFrontendPet(result);
}

/**
 * Save/update pet data
 */
export async function savePet(pet: Pet): Promise<void> {
  if (!isDesktop()) {
    throw new Error('Not in desktop environment');
  }
  const backendPet = toBackendPet(pet);
  await invoke('update_pet', { pet: backendPet });
}
