// Trace Tracking Service - AI Auto-Tracking Core System
// Tauri 原生后端对接 - 真实窗口活动追踪
// privacy controls, rule-based categorization, and batch operations.

import { invoke } from '@tauri-apps/api/core';
import type { Activity, ActivityCategory } from '../services/dataService';

// ============================================================
// Types
// ============================================================

export type PrivacyLevel = 'basic' | 'standard' | 'detailed';

export interface TrackingRule {
  id: string;
  appName: string;
  titleKeyword?: string;
  urlPattern?: string;
  targetCategory: ActivityCategory;
  priority: number; // higher = evaluated first
  createdAt: string;
}

export interface TrackingState {
  isTracking: boolean;
  privacyLevel: PrivacyLevel;
  currentActivity: Activity | null;
  activitiesGenerated: number;
  startedAt: string | null;
}

// ============================================================
// Constants & Storage Keys
// ============================================================

const STORAGE_KEYS = {
  rules: 'trace-tracking-rules',
  privacyLevel: 'trace-tracking-privacy',
  state: 'trace-tracking-state',
  userOverrides: 'trace-tracking-overrides', // remembers user classification changes
} as const;

// ============================================================
// Storage Helpers
// ============================================================

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return crypto.randomUUID();
}

function toISOLocal(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${mo}-${da}T${h}:${mi}:${s}`;
}

// ============================================================
// Type conversion from Rust Activity to frontend Activity
// ============================================================

interface RustActivity {
  id: string;
  name: string;
  window_title: string;
  category: string | null;
  task_id: string | null;
  start_time_ms: number;
  duration_minutes: number;
}

function convertRustActivity(rust: RustActivity): Activity {
  const startDate = new Date(rust.start_time_ms);
  const endDate = new Date(rust.start_time_ms + rust.duration_minutes * 60 * 1000);

  // Rust category is string, cast to ActivityCategory
  const category = (rust.category as ActivityCategory) || '其他';

  return {
    id: rust.id,
    name: rust.name,
    category,
    startTime: startDate.toISOString().replace('Z', '').split('.')[0],
    endTime: endDate.toISOString().replace('Z', '').split('.')[0],
    duration: rust.duration_minutes,
    isManual: false,
    isAiClassified: !!rust.category,
    aiApproved: null,
  };
}

// ============================================================
// Tracking Rules Management
// ============================================================

/**
 * Default rules that ship with the app.
 */
function getDefaultRules(): TrackingRule[] {
  return [
    { id: 'rule-default-1', appName: 'Chrome', titleKeyword: 'YouTube', targetCategory: '娱乐', priority: 10, createdAt: '2026-01-01T00:00:00' },
    { id: 'rule-default-2', appName: 'Chrome', titleKeyword: 'GitHub', targetCategory: '开发', priority: 10, createdAt: '2026-01-01T00:00:00' },
    { id: 'rule-default-3', appName: 'Chrome', titleKeyword: 'Stack Overflow', targetCategory: '学习', priority: 10, createdAt: '2026-01-01T00:00:00' },
    { id: 'rule-default-4', appName: 'Chrome', titleKeyword: '掘金', targetCategory: '学习', priority: 8, createdAt: '2026-01-01T00:00:00' },
    { id: 'rule-default-5', appName: 'Chrome', titleKeyword: '淘宝', targetCategory: '其他', priority: 5, createdAt: '2026-01-01T00:00:00' },
    { id: 'rule-default-6', appName: 'Chrome', titleKeyword: '京东', targetCategory: '其他', priority: 5, createdAt: '2026-01-01T00:00:00' },
    { id: 'rule-default-7', appName: 'Chrome', titleKeyword: '微博', targetCategory: '娱乐', priority: 6, createdAt: '2026-01-01T00:00:00' },
    { id: 'rule-default-8', appName: 'Bilibili', titleKeyword: undefined, targetCategory: '学习', priority: 3, createdAt: '2026-01-01T00:00:00' },
    { id: 'rule-default-9', appName: 'VS Code', titleKeyword: undefined, targetCategory: '开发', priority: 2, createdAt: '2026-01-01T00:00:00' },
    { id: 'rule-default-10', appName: '腾讯会议', titleKeyword: undefined, targetCategory: '会议', priority: 2, createdAt: '2026-01-01T00:00:00' },
  ];
}

function ensureRulesInitialized(): TrackingRule[] {
  const existing = loadJSON<TrackingRule[] | null>(STORAGE_KEYS.rules, null);
  if (existing !== null) return existing;
  const defaults = getDefaultRules();
  saveJSON(STORAGE_KEYS.rules, defaults);
  return defaults;
}

/**
 * Check user overrides: if user previously reclassified an app+title combo,
 * remember that preference.
 */
export function getUserOverride(appName: string, title: string): ActivityCategory | null {
  const overrides = loadJSON<Record<string, ActivityCategory>>(STORAGE_KEYS.userOverrides, {});
  const key = `${appName}|||${title}`;
  return overrides[key] ?? null;
}

function setUserOverride(appName: string, title: string, category: ActivityCategory): void {
  const overrides = loadJSON<Record<string, ActivityCategory>>(STORAGE_KEYS.userOverrides, {});
  overrides[`${appName}|||${title}`] = category;
  saveJSON(STORAGE_KEYS.userOverrides, overrides);
}

// ============================================================
// Core Tracking Service
// ============================================================

class TrackingService {
  private state: TrackingState;
  private listeners: Array<(state: TrackingState) => void> = [];

  constructor() {
    // Restore persisted state or create fresh
    this.state = loadJSON<TrackingState>(STORAGE_KEYS.state, {
      isTracking: false,
      privacyLevel: loadJSON<PrivacyLevel>(STORAGE_KEYS.privacyLevel, 'standard'),
      currentActivity: null,
      activitiesGenerated: 0,
      startedAt: null,
    });
    // Ensure rules are initialized
    ensureRulesInitialized();
  }

  // ------ State persistence & notification ------

  private persistState(): void {
    saveJSON(STORAGE_KEYS.state, this.state);
  }

  private notify(): void {
    for (const fn of this.listeners) {
      try { fn({ ...this.state }); } catch { /* swallow listener errors */ }
    }
  }

  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe(listener: (state: TrackingState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== listener);
    };
  }

  // ------ Core tracking lifecycle ------

  async start(): Promise<void> {
    // Call Tauri backend to start tracking
    await invoke('toggle_tracking', { enable: true });
    const newStatus = await invoke<boolean>('check_tracking_status');

    this.state.isTracking = newStatus;
    this.state.startedAt = toISOLocal(new Date());
    this.persistState();
    this.notify();
  }

  async stop(): Promise<void> {
    // Call Tauri backend to stop tracking
    await invoke('toggle_tracking', { enable: false });
    const newStatus = await invoke<boolean>('check_tracking_status');

    this.state.isTracking = newStatus;
    this.state.currentActivity = null;
    this.state.startedAt = null;
    this.persistState();
    this.notify();
  }

  async syncTrackingStatus(): Promise<void> {
    // Sync tracking status from backend
    const status = await invoke<boolean>('check_tracking_status');
    this.state.isTracking = status;
    this.persistState();
    this.notify();
  }

  isTracking(): boolean {
    return this.state.isTracking;
  }

  getState(): TrackingState {
    return { ...this.state };
  }

  getCurrentActivity(): Activity | null {
    return this.state.currentActivity ? { ...this.state.currentActivity } : null;
  }

  // ------ Get activities from backend ------

  async getTodayActivities(): Promise<Activity[]> {
    const rustActivities = await invoke<RustActivity[]>('get_today_activities');
    return rustActivities.map(convertRustActivity);
  }

  async getActivitiesByDate(dateStr: string): Promise<Activity[]> {
    const rustActivities = await invoke<RustActivity[]>('get_activities_by_date', { dateStr });
    return rustActivities.map(convertRustActivity);
  }

  // ------ CRUD operations ------

  async createActivity(
    name: string,
    windowTitle: string,
    category: ActivityCategory | null,
    startTimeMs: number,
    durationMinutes: number
  ): Promise<Activity> {
    const rustActivity = await invoke<RustActivity>('create_activity', {
      name,
      windowTitle,
      category,
      startTimeMs,
      durationMinutes,
    });
    return convertRustActivity(rustActivity);
  }

  async updateActivity(
    id: string,
    updates: {
      name?: string;
      windowTitle?: string;
      category?: ActivityCategory | null;
      startTimeMs?: number;
      durationMinutes?: number;
    }
  ): Promise<void> {
    await invoke('update_activity', {
      id,
      name: updates.name,
      windowTitle: updates.windowTitle,
      category: updates.category,
      startTimeMs: updates.startTimeMs,
      durationMinutes: updates.durationMinutes,
    });
  }

  async deleteActivity(id: string): Promise<void> {
    await invoke('delete_activity', { id });
  }

  async updateActivityCategory(id: string, category: string): Promise<void> {
    await invoke('update_activity_category', { id, category });
  }

  async classifyActivity(appName: string, windowTitle: string): Promise<string> {
    return invoke<string>('classify_activity', { appName, windowTitle });
  }

  // ------ Privacy level ------

  getPrivacyLevel(): PrivacyLevel {
    return this.state.privacyLevel;
  }

  setPrivacyLevel(level: PrivacyLevel): void {
    this.state.privacyLevel = level;
    saveJSON(STORAGE_KEYS.privacyLevel, level);
    this.persistState();
    this.notify();
  }

  // ------ Tracking rules ------

  getTrackingRules(): TrackingRule[] {
    return ensureRulesInitialized();
  }

  addRule(rule: Omit<TrackingRule, 'id' | 'createdAt'>): TrackingRule {
    const rules = ensureRulesInitialized();
    const newRule: TrackingRule = {
      ...rule,
      id: uid(),
      createdAt: toISOLocal(new Date()),
    };
    rules.push(newRule);
    saveJSON(STORAGE_KEYS.rules, rules);
    return newRule;
  }

  removeRule(ruleId: string): void {
    const rules = ensureRulesInitialized();
    saveJSON(STORAGE_KEYS.rules, rules.filter(r => r.id !== ruleId));
  }

  updateRule(ruleId: string, updates: Partial<Omit<TrackingRule, 'id' | 'createdAt'>>): TrackingRule {
    const rules = ensureRulesInitialized();
    const idx = rules.findIndex(r => r.id === ruleId);
    if (idx === -1) throw new Error(`Tracking rule not found: ${ruleId}`);
    rules[idx] = { ...rules[idx], ...updates };
    saveJSON(STORAGE_KEYS.rules, rules);
    return rules[idx];
  }

  // ------ User classification overrides (learning) ------

  /**
   * When the user manually changes an activity's category,
   * call this so the system remembers the preference.
   */
  recordUserClassification(activityName: string, newCategory: ActivityCategory): void {
    // Extract app name from activity name (first segment before " - ")
    const appName = activityName.split(' - ')[0].trim();
    const title = activityName.split(' - ').slice(1).join(' - ').split(' (')[0].trim();
    if (appName && title) {
      setUserOverride(appName, title, newCategory);
    }
  }

  // ------ Batch operations ------

  async batchCategorize(activityIds: string[], category: ActivityCategory): Promise<void> {
    // Each activity will get the category from backend update
    for (const id of activityIds) {
      await this.updateActivityCategory(id, category);
    }
  }

  async batchDelete(activityIds: string[]): Promise<void> {
    for (const id of activityIds) {
      await this.deleteActivity(id);
    }
  }

  // ------ Utility ------

  /** Get all user classification overrides (for settings UI). */
  getUserOverrides(): Record<string, ActivityCategory> {
    return loadJSON<Record<string, ActivityCategory>>(STORAGE_KEYS.userOverrides, {});
  }

  /** Clear all user overrides (reset learned preferences). */
  clearUserOverrides(): void {
    saveJSON(STORAGE_KEYS.userOverrides, {});
  }

  /** Reset the tracking service to factory defaults. */
  reset(): void {
    this.state = {
      isTracking: false,
      privacyLevel: 'standard',
      currentActivity: null,
      activitiesGenerated: 0,
      startedAt: null,
    };
    localStorage.removeItem(STORAGE_KEYS.rules);
    localStorage.removeItem(STORAGE_KEYS.privacyLevel);
    localStorage.removeItem(STORAGE_KEYS.state);
    localStorage.removeItem(STORAGE_KEYS.userOverrides);
    ensureRulesInitialized();
    this.notify();
  }
}

// ============================================================
// Singleton Export
// ============================================================

export const trackingService = new TrackingService();
