// Trace Data Service
// - Desktop: All data stored in native SQLite database via Tauri
// - Web demo: Falls back to localStorage for demo mode
// All localStorage keys prefixed with 'trace-'

// ============================================================
// Imports
// ============================================================

import { invoke } from '@tauri-apps/api/core';

// ============================================================
// Types
// ============================================================

export type ActivityCategory = '开发' | '工作' | '学习' | '会议' | '休息' | '娱乐' | '运动' | '阅读' | '其他';

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  isManual: boolean;
  isAiClassified?: boolean; // Whether this activity was classified by AI
  aiApproved?: boolean | null; // User approval status: true = approved, false = rejected, null = not reviewed
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  priority: 1 | 2 | 3 | 4 | 5;
  status: TaskStatus;
  estimatedMinutes: number;
  actualMinutes: number;
  project: string;
  subtasks: Subtask[];
  dueDate: string;
  repeatType: RepeatType;
  createdAt: string;
}

export type HabitCategory = 'health' | 'learning' | 'fitness' | 'mindfulness' | 'other';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  targetMinutes: number;
  targetCount: number; // daily target check-in count (default 1)
  color: string;
  streak: number;
  reminders: string[]; // array of HH:mm times
  category: HabitCategory;
  checkins: Record<string, number>; // date string -> count (multi-check) or minutes
  createdAt: string;
}

export type FocusType = 'work' | 'break' | 'longBreak';

export interface FocusSession {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: FocusType;
  completed: boolean;
}

export interface Pet {
  name: string;
  type: string;
  level: number;
  xp: number;
  hunger: number;
  mood: number;
  coins: number;
  lastFed: string;
  lastInteracted: string;
  decoration: string;
}

export interface BlockedPattern {
  id: string;
  pattern: string; // domain or app name pattern to match
  type: 'domain' | 'app';
  enabled: boolean;
}

export interface AppSettings {
  theme: string;
  colorTheme: string;
  backgroundSkin: string;
  featureFlags: Record<string, boolean>;
  dailyGoalMinutes: number;
  language: string;
  // AI provider settings
  aiApiKey?: string;
  aiProvider?: 'ernie' | 'doubao' | 'qwen' | 'glm' | 'openai' | 'claude' | 'gemini' | 'deepseek' | 'xai';
  autoStartOnBoot?: boolean;
  ignoredApplications?: string[];
  // Privacy settings
  privacy_sync_mode?: 'full' | 'summary_only' | 'local_only';
  privacy_cloud_encryption?: boolean;
  privacy_retain_raw_local?: boolean;
  privacy_auto_delete_days?: number;
  // Distraction blocking
  blockedPatterns?: BlockedPattern[];
  blockingScheduleMode?: 'focusOnly' | 'always' | 'custom';
  blockingScheduleStart?: string; // HH:mm
  blockingScheduleEnd?: string; // HH:mm
  // Custom AI classification rules
  customAiClassificationRules?: string;
  // Calendar sync
  calendarSyncEnabled?: boolean;
  calendarSyncAutoCreateActivities?: boolean;
  calendarSyncDefaultCategory?: ActivityCategory;
  // Only sync events containing certain keywords (optional)
  calendarSyncKeywordFilter?: string;
  // AI personalized break reminders based on work patterns
  adaptiveBreakReminders?: boolean;
  adaptiveBreakMinInterval?: number;
  adaptiveBreakMaxInterval?: number;
  adaptiveBreakUrgentThreshold?: number;
}

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  category: ActivityCategory;
  date: string;
  completed: boolean;
}

export interface DailyStat {
  date: string;
  totalMinutes: number;
  activityCount: number;
  categories: Record<string, number>;
}

// ============================================================
// Storage helpers (fallback for web demo mode)
// ============================================================

const KEYS = {
  activities: 'trace-activities',
  tasks: 'trace-tasks',
  habits: 'trace-habits',
  focusSessions: 'trace-focus-sessions',
  pet: 'trace-pet',
  settings: 'trace-settings',
  timeBlocks: 'trace-time-blocks',
  seeded: 'trace-seeded',
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return crypto.randomUUID();
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isDesktop(): boolean {
  return typeof (window as any).__TAURI__ !== 'undefined';
}

// ============================================================
// Demo data generators (placeholder - filled in below)
// ============================================================

// SEED:ACTIVITIES
function seedActivities(): Activity[] {
  const activities: Activity[] = [];
  const now = new Date();
  const activityTemplates: { name: string; category: ActivityCategory; minDur: number; maxDur: number }[] = [
    { name: '前端开发 - React组件', category: '开发', minDur: 40, maxDur: 120 },
    { name: 'API接口开发', category: '开发', minDur: 30, maxDur: 90 },
    { name: 'Bug修复', category: '开发', minDur: 15, maxDur: 60 },
    { name: '代码审查', category: '工作', minDur: 20, maxDur: 45 },
    { name: '需求分析', category: '工作', minDur: 30, maxDur: 60 },
    { name: '文档编写', category: '工作', minDur: 20, maxDur: 50 },
    { name: '在线课程 - TypeScript', category: '学习', minDur: 25, maxDur: 60 },
    { name: '阅读技术博客', category: '学习', minDur: 15, maxDur: 40 },
    { name: '算法练习', category: '学习', minDur: 30, maxDur: 60 },
    { name: '站会', category: '会议', minDur: 10, maxDur: 20 },
    { name: '周例会', category: '会议', minDur: 30, maxDur: 60 },
    { name: '产品评审', category: '会议', minDur: 30, maxDur: 90 },
    { name: '午休', category: '休息', minDur: 30, maxDur: 60 },
    { name: '下午茶歇', category: '休息', minDur: 10, maxDur: 20 },
    { name: '看视频', category: '娱乐', minDur: 20, maxDur: 45 },
    { name: '打游戏', category: '娱乐', minDur: 30, maxDur: 60 },
    { name: '跑步', category: '运动', minDur: 20, maxDur: 45 },
    { name: '健身', category: '运动', minDur: 30, maxDur: 60 },
    { name: '阅读 - 《代码整洁之道》', category: '阅读', minDur: 20, maxDur: 50 },
    { name: '阅读 - 技术周刊', category: '阅读', minDur: 10, maxDur: 30 },
  ];

  // Seeded pseudo-random for deterministic data
  let seed = 42;
  function rand(): number {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  function randInt(min: number, max: number): number {
    return Math.floor(rand() * (max - min + 1)) + min;
  }
  function pick<T>(arr: T[]): T {
    return arr[Math.floor(rand() * arr.length)];
  }

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const day = new Date(now);
    day.setDate(day.getDate() - dayOffset);
    const dateStr = toDateStr(day);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

    // Build a day schedule
    const count = randInt(6, 10);
    let currentHour = isWeekend ? randInt(9, 10) : randInt(8, 9);
    let currentMin = randInt(0, 3) * 15;

    for (let i = 0; i < count; i++) {
      // Pick a template weighted by time of day & weekend
      let template: typeof activityTemplates[number];
      if (currentHour >= 12 && currentHour < 13 && !isWeekend) {
        template = activityTemplates.find(t => t.name === '午休')!;
      } else if (currentHour >= 15 && currentHour < 16 && rand() > 0.6 && !isWeekend) {
        template = activityTemplates.find(t => t.name === '下午茶歇')!;
      } else if (isWeekend) {
        const weekendPool = activityTemplates.filter(t =>
          ['学习', '娱乐', '运动', '阅读', '休息', '开发'].includes(t.category)
        );
        template = pick(weekendPool);
      } else if (currentHour < 10) {
        const morningPool = activityTemplates.filter(t =>
          ['开发', '工作', '会议', '学习'].includes(t.category)
        );
        template = pick(morningPool);
      } else if (currentHour >= 18) {
        const eveningPool = activityTemplates.filter(t =>
          ['学习', '娱乐', '运动', '阅读', '休息'].includes(t.category)
        );
        template = pick(eveningPool);
      } else {
        template = pick(activityTemplates);
      }

      const duration = randInt(template.minDur, template.maxDur);
      const startTime = `${dateStr}T${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}:00`;
      const endDate = new Date(startTime);
      endDate.setMinutes(endDate.getMinutes() + duration);
      const endTime = endDate.toISOString().replace('Z', '').split('.')[0];

      activities.push({
        id: uid(),
        name: template.name,
        category: template.category,
        startTime,
        endTime,
        duration,
        isManual: rand() > 0.7,
      });

      // Advance clock
      currentMin += duration + randInt(5, 20);
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;

      if (currentHour >= 22) break;
    }
  }

  return activities;
}

// SEED:TASKS
function seedTasks(): Task[] {
  const now = new Date();
  const templates: Omit<Task, 'id' | 'createdAt'>[] = [
    { title: '完成用户登录页面重构', priority: 4, status: 'in_progress', estimatedMinutes: 180, actualMinutes: 95, project: '前端重构', subtasks: [{ id: uid(), title: '设计新UI', completed: true }, { id: uid(), title: '实现表单验证', completed: true }, { id: uid(), title: '接入OAuth', completed: false }], dueDate: toDateStr(new Date(now.getTime() + 2 * 86400000)), repeatType: 'none' },
    { title: '编写单元测试 - 数据服务', priority: 3, status: 'pending', estimatedMinutes: 120, actualMinutes: 0, project: '前端重构', subtasks: [{ id: uid(), title: '测试CRUD操作', completed: false }, { id: uid(), title: '测试边界条件', completed: false }], dueDate: toDateStr(new Date(now.getTime() + 5 * 86400000)), repeatType: 'none' },
    { title: '每日站会', priority: 2, status: 'completed', estimatedMinutes: 15, actualMinutes: 12, project: '团队管理', subtasks: [], dueDate: toDateStr(now), repeatType: 'daily' },
    { title: '准备周五技术分享', priority: 3, status: 'in_progress', estimatedMinutes: 240, actualMinutes: 60, project: '个人成长', subtasks: [{ id: uid(), title: '选定主题', completed: true }, { id: uid(), title: '制作PPT', completed: false }, { id: uid(), title: '准备Demo', completed: false }], dueDate: toDateStr(new Date(now.getTime() + 4 * 86400000)), repeatType: 'none' },
    { title: '优化首页加载性能', priority: 5, status: 'pending', estimatedMinutes: 300, actualMinutes: 0, project: '前端重构', subtasks: [{ id: uid(), title: '分析性能瓶颈', completed: false }, { id: uid(), title: '实现代码分割', completed: false }, { id: uid(), title: '图片懒加载', completed: false }, { id: uid(), title: '性能测试', completed: false }], dueDate: toDateStr(new Date(now.getTime() + 7 * 86400000)), repeatType: 'none' },
    { title: '阅读《设计模式》第5章', priority: 2, status: 'pending', estimatedMinutes: 60, actualMinutes: 0, project: '个人成长', subtasks: [], dueDate: toDateStr(new Date(now.getTime() + 1 * 86400000)), repeatType: 'none' },
    { title: '整理Jira看板', priority: 1, status: 'completed', estimatedMinutes: 30, actualMinutes: 25, project: '团队管理', subtasks: [], dueDate: toDateStr(now), repeatType: 'weekly' },
    { title: '修复移动端样式问题', priority: 4, status: 'in_progress', estimatedMinutes: 90, actualMinutes: 40, project: '前端重构', subtasks: [{ id: uid(), title: '导航栏适配', completed: true }, { id: uid(), title: '表格响应式', completed: false }], dueDate: toDateStr(new Date(now.getTime() + 1 * 86400000)), repeatType: 'none' },
    { title: '更新项目文档', priority: 2, status: 'pending', estimatedMinutes: 60, actualMinutes: 0, project: '前端重构', subtasks: [], dueDate: toDateStr(new Date(now.getTime() + 3 * 86400000)), repeatType: 'none' },
    { title: '复习英语单词', priority: 2, status: 'pending', estimatedMinutes: 30, actualMinutes: 0, project: '个人成长', subtasks: [], dueDate: toDateStr(now), repeatType: 'daily' },
  ];

  const createdBase = new Date(now.getTime() - 14 * 86400000);
  return templates.map((t, i) => ({
    ...t,
    id: uid(),
    createdAt: new Date(createdBase.getTime() + i * 86400000).toISOString(),
  }));
}

// SEED:HABITS
function seedHabits(): Habit[] {
  const now = new Date();
  const definitions: { name: string; icon: string; targetMinutes: number; targetCount: number; color: string; reminders: string[]; category: HabitCategory }[] = [
    { name: '读书', icon: '📚', targetMinutes: 30, targetCount: 1, color: '#6366f1', reminders: ['21:00'], category: 'learning' },
    { name: '运动', icon: '🏃', targetMinutes: 45, targetCount: 1, color: '#ef4444', reminders: ['07:00', '18:00'], category: 'fitness' },
    { name: '冥想', icon: '🧘', targetMinutes: 15, targetCount: 1, color: '#8b5cf6', reminders: ['06:30'], category: 'mindfulness' },
    { name: '编程练习', icon: '💻', targetMinutes: 60, targetCount: 1, color: '#3b82f6', reminders: [], category: 'learning' },
    { name: '喝水', icon: '💧', targetMinutes: 0, targetCount: 8, color: '#06b6d4', reminders: ['09:00', '11:00', '14:00', '16:00'], category: 'health' },
    { name: '做俯卧撑', icon: '💪', targetMinutes: 0, targetCount: 3, color: '#10b981', reminders: ['08:00', '13:00', '19:00'], category: 'fitness' },
    { name: '早起', icon: '🌅', targetMinutes: 0, targetCount: 1, color: '#f59e0b', reminders: ['06:00'], category: 'health' },
  ];

  let seed = 99;
  function rand(): number {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  return definitions.map((def) => {
    const checkins: Record<string, number> = {};
    let streak = 0;
    let currentStreak = 0;

    for (let d = 30; d >= 0; d--) {
      const day = new Date(now);
      day.setDate(day.getDate() - d);
      const ds = toDateStr(day);

      if (rand() < 0.78) {
        let val: number;
        if (def.targetCount > 1) {
          // Multi-check: random count up to targetCount
          val = Math.max(1, Math.round(def.targetCount * (0.4 + rand() * 0.7)));
        } else if (def.targetMinutes === 0) {
          val = 1; // boolean-like
        } else {
          val = Math.round(def.targetMinutes * (0.5 + rand()));
        }
        checkins[ds] = val;
        currentStreak++;
      } else {
        currentStreak = 0;
      }
    }
    streak = currentStreak;

    return {
      id: uid(),
      name: def.name,
      icon: def.icon,
      targetMinutes: def.targetMinutes,
      targetCount: def.targetCount,
      color: def.color,
      reminders: def.reminders,
      category: def.category,
      streak,
      checkins,
      createdAt: new Date(now.getTime() - 45 * 86400000).toISOString(),
    };
  });
}

// SEED:FOCUS_SESSIONS
function seedFocusSessions(): FocusSession[] {
  const sessions: FocusSession[] = [];
  const now = new Date();

  let seed = 77;
  function rand(): number {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const day = new Date(now);
    day.setDate(day.getDate() - dayOffset);
    const dateStr = toDateStr(day);

    // 2-5 focus blocks per day
    const count = Math.floor(rand() * 4) + 2;
    let hour = 9 + Math.floor(rand() * 2);

    for (let i = 0; i < count; i++) {
      // work session
      const workDur = 25;
      const startW = `${dateStr}T${String(hour).padStart(2, '0')}:${String(Math.floor(rand() * 4) * 15).padStart(2, '0')}:00`;
      const endW = new Date(new Date(startW).getTime() + workDur * 60000);
      sessions.push({
        id: uid(),
        startTime: startW,
        endTime: endW.toISOString().split('.')[0],
        duration: workDur,
        type: 'work',
        completed: rand() > 0.1,
      });

      // break
      const isLong = i > 0 && i % 4 === 3;
      const breakDur = isLong ? 15 : 5;
      const startB = endW.toISOString().split('.')[0];
      const endB = new Date(endW.getTime() + breakDur * 60000);
      sessions.push({
        id: uid(),
        startTime: startB,
        endTime: endB.toISOString().split('.')[0],
        duration: breakDur,
        type: isLong ? 'longBreak' : 'break',
        completed: rand() > 0.05,
      });

      hour += 1 + Math.floor(rand() * 2);
      if (hour >= 20) break;
    }
  }

  return sessions;
}

// SEED:PET
function seedPet(): Pet {
  const now = new Date();
  return {
    name: '小橘',
    type: 'cat',
    level: 3,
    xp: 450,
    hunger: 72,
    mood: 85,
    coins: 320,
    lastFed: new Date(now.getTime() - 3 * 3600000).toISOString(),
    lastInteracted: new Date(now.getTime() - 1 * 3600000).toISOString(),
    decoration: '',
  };
}

// SEED:SETTINGS
function seedSettings(): AppSettings {
  return {
    theme: 'light',
    colorTheme: 'blue',
    backgroundSkin: 'default',
    featureFlags: {
      pet: true,
      focus: true,
      habits: true,
      timeBlocks: true,
    },
    dailyGoalMinutes: 480,
    language: 'zh-CN',
    blockedPatterns: [],
    blockingScheduleMode: 'focusOnly',
    blockingScheduleStart: '09:00',
    blockingScheduleEnd: '18:00',
    customAiClassificationRules: '',
    calendarSyncEnabled: false,
    calendarSyncAutoCreateActivities: true,
    calendarSyncDefaultCategory: '会议',
    calendarSyncKeywordFilter: '',
    adaptiveBreakReminders: true,
    adaptiveBreakMinInterval: 20,
    adaptiveBreakMaxInterval: 60,
    adaptiveBreakUrgentThreshold: 90,
  };
}

// SEED:TIME_BLOCKS
function seedTimeBlocks(): TimeBlock[] {
  const now = new Date();
  const blocks: TimeBlock[] = [];
  const today = toDateStr(now);
  const tomorrow = toDateStr(new Date(now.getTime() + 86400000));

  const todayBlocks: Omit<TimeBlock, 'id'>[] = [
    { title: '晨间代码审查', startTime: `${today}T09:00:00`, endTime: `${today}T09:45:00`, durationMinutes: 45, category: '工作', date: today, completed: true },
    { title: '前端开发 - 新功能', startTime: `${today}T10:00:00`, endTime: `${today}T12:00:00`, durationMinutes: 120, category: '开发', date: today, completed: true },
    { title: '午休', startTime: `${today}T12:00:00`, endTime: `${today}T13:00:00`, durationMinutes: 60, category: '休息', date: today, completed: true },
    { title: '产品需求评审', startTime: `${today}T14:00:00`, endTime: `${today}T15:00:00`, durationMinutes: 60, category: '会议', date: today, completed: false },
    { title: '接口联调', startTime: `${today}T15:00:00`, endTime: `${today}T17:00:00`, durationMinutes: 120, category: '开发', date: today, completed: false },
    { title: '英语学习', startTime: `${today}T19:00:00`, endTime: `${today}T19:30:00`, durationMinutes: 30, category: '学习', date: today, completed: false },
    { title: '阅读时间', startTime: `${today}T21:00:00`, endTime: `${today}T21:45:00`, durationMinutes: 45, category: '阅读', date: today, completed: false },
  ];

  const tomorrowBlocks: Omit<TimeBlock, 'id'>[] = [
    { title: '站会', startTime: `${tomorrow}T09:30:00`, endTime: `${tomorrow}T09:45:00`, durationMinutes: 15, category: '会议', date: tomorrow, completed: false },
    { title: '性能优化', startTime: `${tomorrow}T10:00:00`, endTime: `${tomorrow}T12:00:00`, durationMinutes: 120, category: '开发', date: tomorrow, completed: false },
    { title: '午休', startTime: `${tomorrow}T12:00:00`, endTime: `${tomorrow}T13:00:00`, durationMinutes: 60, category: '休息', date: tomorrow, completed: false },
    { title: '技术分享准备', startTime: `${tomorrow}T14:00:00`, endTime: `${tomorrow}T16:00:00`, durationMinutes: 120, category: '学习', date: tomorrow, completed: false },
    { title: '健身', startTime: `${tomorrow}T18:00:00`, endTime: `${tomorrow}T19:00:00`, durationMinutes: 60, category: '运动', date: tomorrow, completed: false },
  ];

  [...todayBlocks, ...tomorrowBlocks].forEach(b => {
    blocks.push({ ...b, id: uid() });
  });

  return blocks;
}

// ============================================================
// Seed orchestrator
// ============================================================

function ensureSeeded(): void {
  if (localStorage.getItem(KEYS.seeded)) return;

  save(KEYS.activities, seedActivities());
  save(KEYS.tasks, seedTasks());
  save(KEYS.habits, seedHabits());
  save(KEYS.focusSessions, seedFocusSessions());
  save(KEYS.pet, seedPet());
  save(KEYS.settings, seedSettings());
  save(KEYS.timeBlocks, seedTimeBlocks());

  localStorage.setItem(KEYS.seeded, 'true');
}

// Rust database types that match the backend
interface DbTask {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: number;
  estimated_minutes: number;
  actual_minutes: number;
  status: string;
  due_date: string | null;
}

interface DbHabit {
  id: string;
  name: string;
  icon: string | null;
  target_minutes: number;
  target_count: number;
  color: string | null;
  streak: number;
  category: string | null;
  reminders: string | null; // JSON
}

interface DbHabitCheckin {
  id: number;
  habit_id: string;
  checkin_date: string;
  value: number;
}

interface DbFocusSession {
  id: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  type: string;
  completed: number;
}

interface DbPet {
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

interface DbSettings {
  theme: string;
  color_theme: string;
  background_skin: string;
  daily_goal_minutes: number;
  language: string;
  ai_api_key: string | null;
  ai_provider: string | null;
  auto_start_on_boot: number;
  blocked_patterns: string | null; // JSON
  feature_flags: string | null; // JSON
}

interface DbTimeBlock {
  id: string;
  task_id: string | null;
  title: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  category: string | null;
  notes: string | null;
  date: string;
  is_completed: number;
}

// ============================================================
// Data service
// ============================================================

// In-memory cache for pet to avoid decay on every read
let cachedPet: Pet | null = null;

const dataService = {
  // --- Activities --- (still uses file-based storage in backend for now)
  getActivities(date?: string): Activity[] {
    ensureSeeded();
    const all = load<Activity[]>(KEYS.activities, []);
    if (!date) return all;
    return all.filter(a => a.startTime.startsWith(date));
  },

  getActivitiesRange(startDate: string, endDate: string): Activity[] {
    ensureSeeded();
    const all = load<Activity[]>(KEYS.activities, []);
    return all.filter(a => {
      const d = a.startTime.slice(0, 10);
      return d >= startDate && d <= endDate;
    });
  },

  addActivity(activity: Omit<Activity, 'id'>): Activity {
    const all = load<Activity[]>(KEYS.activities, []);
    const entry: Activity = { ...activity, id: uid() };
    all.push(entry);
    save(KEYS.activities, all);
    return entry;
  },

  updateActivity(id: string, updates: Partial<Activity>): Activity {
    const all = load<Activity[]>(KEYS.activities, []);
    const idx = all.findIndex(a => a.id === id);
    if (idx === -1) throw new Error(`Activity not found: ${id}`);
    all[idx] = { ...all[idx], ...updates, id };
    save(KEYS.activities, all);
    return all[idx];
  },

  deleteActivity(id: string): void {
    const all = load<Activity[]>(KEYS.activities, []);
    save(KEYS.activities, all.filter(a => a.id !== id));
  },

  // --- Tasks ---
  async getTasks(date?: string): Promise<Task[]> {
    if (isDesktop()) {
      try {
        let tasks: DbTask[];
        if (date) {
          tasks = await invoke<DbTask[]>('get_today_tasks', { date });
        } else {
          tasks = await invoke<DbTask[]>('get_all_tasks');
        }

        // Convert DbTask to frontend Task type
        return tasks.map(dbTask => ({
          id: dbTask.id,
          title: dbTask.title,
          priority: dbTask.priority as 1 | 2 | 3 | 4 | 5,
          status: dbTask.status as TaskStatus,
          estimatedMinutes: dbTask.estimated_minutes,
          actualMinutes: dbTask.actual_minutes,
          project: dbTask.category || '',
          subtasks: [],
          dueDate: dbTask.due_date || '',
          repeatType: 'none',
          createdAt: new Date().toISOString(),
        }));
      } catch (e) {
        console.error('SQLite getTasks failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    ensureSeeded();
    const all = load<Task[]>(KEYS.tasks, []);
    if (!date) return all;
    return all.filter(t => t.dueDate === date);
  },

  async addTask(task: Omit<Task, 'id'>): Promise<Task> {
    const entry: Task = { ...task, id: uid() };

    if (isDesktop()) {
      try {
        const dbTask: DbTask = {
          id: entry.id,
          title: entry.title,
          description: null,
          category: entry.project || null,
          priority: entry.priority,
          estimated_minutes: entry.estimatedMinutes,
          actual_minutes: entry.actualMinutes,
          status: entry.status,
          due_date: entry.dueDate || null,
        };
        await invoke('create_task', { task: dbTask });
        return entry;
      } catch (e) {
        console.error('SQLite createTask failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    const all = load<Task[]>(KEYS.tasks, []);
    all.push(entry);
    save(KEYS.tasks, all);
    return entry;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    if (isDesktop()) {
      try {
        // Get current task first
        const allTasks = await this.getTasks();
        const current = allTasks.find(t => t.id === id);
        if (!current) throw new Error(`Task not found: ${id}`);

        const updated = { ...current, ...updates };
        const dbTask: DbTask = {
          id: updated.id,
          title: updated.title,
          description: null,
          category: updated.project || null,
          priority: updated.priority,
          estimated_minutes: updated.estimatedMinutes,
          actual_minutes: updated.actualMinutes,
          status: updated.status,
          due_date: updated.dueDate || null,
        };
        await invoke('update_task', { task: dbTask });
        return updated;
      } catch (e) {
        console.error('SQLite updateTask failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    const all = load<Task[]>(KEYS.tasks, []);
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) throw new Error(`Task not found: ${id}`);
    all[idx] = { ...all[idx], ...updates, id };
    save(KEYS.tasks, all);
    return all[idx];
  },

  async deleteTask(id: string): Promise<void> {
    if (isDesktop()) {
      try {
        await invoke('delete_task', { id });
        return;
      } catch (e) {
        console.error('SQLite deleteTask failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    const all = load<Task[]>(KEYS.tasks, []);
    save(KEYS.tasks, all.filter(t => t.id !== id));
  },

  saveTasks(tasks: Task[]): void {
    ensureSeeded();
    save(KEYS.tasks, tasks);
  },

  // --- Habits ---
  async getHabits(): Promise<Habit[]> {
    if (isDesktop()) {
      try {
        const habits = await invoke<DbHabit[]>('get_all_habits');

        // Get all checkins for all habits
        const result: Habit[] = [];
        for (const dbHabit of habits) {
          const checkins = await invoke<DbHabitCheckin[]>('get_habit_checkins', { habitId: dbHabit.id });
          const checkinMap: Record<string, number> = {};
          for (const c of checkins) {
            checkinMap[c.checkin_date] = c.value;
          }

          result.push({
            id: dbHabit.id,
            name: dbHabit.name,
            icon: dbHabit.icon || '📝',
            targetMinutes: dbHabit.target_minutes,
            targetCount: dbHabit.target_count,
            color: dbHabit.color || '#6366f1',
            streak: dbHabit.streak,
            reminders: dbHabit.reminders ? JSON.parse(dbHabit.reminders) : [],
            category: (dbHabit.category as HabitCategory) || 'other',
            checkins: checkinMap,
            createdAt: new Date().toISOString(),
          });
        }
        return result;
      } catch (e) {
        console.error('SQLite getHabits failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    ensureSeeded();
    return load<Habit[]>(KEYS.habits, []);
  },

  async addHabit(habit: Omit<Habit, 'id'>): Promise<Habit> {
    const entry: Habit = { ...habit, id: uid() };

    if (isDesktop()) {
      try {
        const dbHabit: DbHabit = {
          id: entry.id,
          name: entry.name,
          icon: entry.icon,
          target_minutes: entry.targetMinutes,
          target_count: entry.targetCount,
          color: entry.color,
          streak: entry.streak,
          category: entry.category,
          reminders: JSON.stringify(entry.reminders),
        };
        await invoke('create_habit', { habit: dbHabit });

        // Add initial checkins
        for (const [date, value] of Object.entries(entry.checkins)) {
          await invoke('add_habit_checkin', {
            checkin: {
              habit_id: entry.id,
              checkin_date: date,
              value: value,
            },
          });
        }
        return entry;
      } catch (e) {
        console.error('SQLite createHabit failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    const all = load<Habit[]>(KEYS.habits, []);
    all.push(entry);
    save(KEYS.habits, all);
    return entry;
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    if (isDesktop()) {
      try {
        const allHabits = await this.getHabits();
        const current = allHabits.find(h => h.id === id);
        if (!current) throw new Error(`Habit not found: ${id}`);

        const updated = { ...current, ...updates };
        const dbHabit: DbHabit = {
          id: updated.id,
          name: updated.name,
          icon: updated.icon,
          target_minutes: updated.targetMinutes,
          target_count: updated.targetCount,
          color: updated.color,
          streak: updated.streak,
          category: updated.category,
          reminders: JSON.stringify(updated.reminders),
        };
        await invoke('update_habit', { habit: dbHabit });

        // Update checkins if they changed
        if (updates.checkins) {
          for (const [date, value] of Object.entries(updates.checkins)) {
            await invoke('add_habit_checkin', {
              checkin: {
                habit_id: id,
                checkin_date: date,
                value: value,
              },
            });
          }
        }
        return updated;
      } catch (e) {
        console.error('SQLite updateHabit failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    const all = load<Habit[]>(KEYS.habits, []);
    const idx = all.findIndex(h => h.id === id);
    if (idx === -1) throw new Error(`Habit not found: ${id}`);
    all[idx] = { ...all[idx], ...updates, id };
    save(KEYS.habits, all);
    return all[idx];
  },

  async deleteHabit(id: string): Promise<void> {
    if (isDesktop()) {
      try {
        await invoke('delete_habit', { id });
        return;
      } catch (e) {
        console.error('SQLite deleteHabit failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    const all = load<Habit[]>(KEYS.habits, []);
    save(KEYS.habits, all.filter(h => h.id !== id));
  },

  async checkinHabit(id: string, date: string, minutes: number): Promise<Habit> {
    if (isDesktop()) {
      try {
        const allHabits = await this.getHabits();
        const current = allHabits.find(h => h.id === id);
        if (!current) throw new Error(`Habit not found: ${id}`);

        const habit = { ...current };
        habit.checkins[date] = (habit.checkins[date] || 0) + minutes;

        // Recalculate streak from today going backwards
        let streak = 0;
        const d = new Date();
        while (true) {
          const ds = toDateStr(d);
          if (habit.checkins[ds] && habit.checkins[ds] > 0) {
            streak++;
            d.setDate(d.getDate() - 1);
          } else {
            break;
          }
        }
        habit.streak = streak;

        await this.updateHabit(id, { streak });
        await invoke('add_habit_checkin', {
          checkin: {
            habit_id: id,
            checkin_date: date,
            value: habit.checkins[date],
          },
        });
        return habit;
      } catch (e) {
        console.error('SQLite checkinHabit failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    const all = load<Habit[]>(KEYS.habits, []);
    const idx = all.findIndex(h => h.id === id);
    if (idx === -1) throw new Error(`Habit not found: ${id}`);
    const habit = all[idx];
    habit.checkins[date] = (habit.checkins[date] || 0) + minutes;

    // Recalculate streak from today going backwards
    let streak = 0;
    const d = new Date();
    while (true) {
      const ds = toDateStr(d);
      if (habit.checkins[ds] && habit.checkins[ds] > 0) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    habit.streak = streak;

    all[idx] = habit;
    save(KEYS.habits, all);
    return habit;
  },

  // --- Focus Sessions ---
  async getFocusSessions(date?: string): Promise<FocusSession[]> {
    if (isDesktop()) {
      try {
        let sessions: DbFocusSession[];
        if (date) {
          sessions = await invoke<DbFocusSession[]>('get_focus_sessions_by_date', { datePrefix: date });
        } else {
          sessions = await invoke<DbFocusSession[]>('get_all_focus_sessions');
        }

        return sessions.map(dbSession => ({
          id: dbSession.id,
          startTime: dbSession.start_time,
          endTime: dbSession.end_time || '',
          duration: dbSession.duration,
          type: dbSession.type as FocusType,
          completed: dbSession.completed === 1,
        }));
      } catch (e) {
        console.error('SQLite getFocusSessions failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    ensureSeeded();
    const all = load<FocusSession[]>(KEYS.focusSessions, []);
    if (!date) return all;
    return all.filter(s => s.startTime.startsWith(date));
  },

  async addFocusSession(session: Omit<FocusSession, 'id'>): Promise<FocusSession> {
    const entry: FocusSession = { ...session, id: uid() };

    if (isDesktop()) {
      try {
        const dbSession: DbFocusSession = {
          id: entry.id,
          start_time: entry.startTime,
          end_time: entry.endTime || null,
          duration: entry.duration,
          type: entry.type,
          completed: entry.completed ? 1 : 0,
        };
        await invoke('create_focus_session', { session: dbSession });
        return entry;
      } catch (e) {
        console.error('SQLite createFocusSession failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    const all = load<FocusSession[]>(KEYS.focusSessions, []);
    all.push(entry);
    save(KEYS.focusSessions, all);
    return entry;
  },

  // --- Pet ---
  async getPet(): Promise<Pet> {
    // Return cached version if available - no side effect on repeated reads
    if (cachedPet) {
      return cachedPet;
    }

    if (isDesktop()) {
      try {
        const dbPet = await invoke<DbPet>('get_pet');

        let pet: Pet = {
          name: dbPet.name,
          type: dbPet.pet_type,
          level: dbPet.level,
          xp: dbPet.experience,
          hunger: dbPet.hunger,
          mood: dbPet.mood,
          coins: dbPet.coins,
          lastFed: dbPet.last_fed,
          lastInteracted: dbPet.last_interacted,
          decoration: dbPet.decoration || '',
        };

        // Natural decay: hunger and mood decrease over time
        // Only apply once when first loaded from storage
        const now = new Date();
        const lastFedDate = new Date(pet.lastFed);
        const hoursSinceFed = (now.getTime() - lastFedDate.getTime()) / (1000 * 60 * 60);
        const hungerDecay = Math.floor(hoursSinceFed * 2); // ~2 hunger points per hour

        const lastInteractedDate = new Date(pet.lastInteracted);
        const hoursSinceInteracted = (now.getTime() - lastInteractedDate.getTime()) / (1000 * 60 * 60);
        const moodDecay = Math.floor(hoursSinceInteracted * 1); // ~1 mood point per hour

        if (hungerDecay > 0 || moodDecay > 0) {
          pet = {
            ...pet,
            hunger: Math.max(0, pet.hunger - hungerDecay),
            mood: Math.max(0, pet.mood - moodDecay),
          };
          await this.updatePet(pet);
        }

        cachedPet = pet;
        return pet;
      } catch (e) {
        console.error('SQLite getPet failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    ensureSeeded();
    let pet = load<Pet>(KEYS.pet, seedPet());

    // Natural decay: hunger and mood decrease over time
    // Only apply once when first loaded from storage
    const now = new Date();
    const lastFedDate = new Date(pet.lastFed);
    const hoursSinceFed = (now.getTime() - lastFedDate.getTime()) / (1000 * 60 * 60);
    const hungerDecay = Math.floor(hoursSinceFed * 2); // ~2 hunger points per hour

    const lastInteractedDate = new Date(pet.lastInteracted);
    const hoursSinceInteracted = (now.getTime() - lastInteractedDate.getTime()) / (1000 * 60 * 60);
    const moodDecay = Math.floor(hoursSinceInteracted * 1); // ~1 mood point per hour

    if (hungerDecay > 0 || moodDecay > 0) {
      pet = {
        ...pet,
        hunger: Math.max(0, pet.hunger - hungerDecay),
        mood: Math.max(0, pet.mood - moodDecay),
      };
      save(KEYS.pet, pet);
    }

    cachedPet = pet;
    return pet;
  },

  async updatePet(updates: Partial<Pet>): Promise<Pet> {
    if (isDesktop()) {
      try {
        const current = await this.getPet();
        const updated: Pet = {
          ...current,
          ...updates,
          // Update timestamps when changing hunger or mood
          lastFed: 'hunger' in updates ? new Date().toISOString() : current.lastFed,
          lastInteracted: 'mood' in updates ? new Date().toISOString() : current.lastInteracted,
        };

        const dbPet: DbPet = {
          pet_type: updated.type,
          name: updated.name,
          level: updated.level,
          experience: updated.xp,
          hunger: updated.hunger,
          mood: updated.mood,
          coins: updated.coins,
          last_fed: updated.lastFed,
          last_interacted: updated.lastInteracted,
          decoration: updated.decoration || null,
        };
        await invoke('update_pet', { pet: dbPet });
        cachedPet = updated;
        return updated;
      } catch (e) {
        console.error('SQLite updatePet failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    const pet = load<Pet>(KEYS.pet, seedPet());
    const updated = {
      ...pet,
      ...updates,
      // Update timestamps when changing hunger or mood
      lastFed: 'hunger' in updates ? new Date().toISOString() : pet.lastFed,
      lastInteracted: 'mood' in updates ? new Date().toISOString() : pet.lastInteracted,
    };
    save(KEYS.pet, updated);
    cachedPet = updated;
    return updated;
  },

  // --- Time Blocks ---
  async getTimeBlocks(date: string): Promise<TimeBlock[]> {
    if (isDesktop()) {
      try {
        const blocks = await invoke<DbTimeBlock[]>('get_time_blocks_by_date', { date });
        return blocks.map(dbBlock => ({
          id: dbBlock.id,
          title: dbBlock.title,
          startTime: dbBlock.start_time,
          endTime: dbBlock.end_time,
          durationMinutes: dbBlock.duration_minutes,
          category: (dbBlock.category as ActivityCategory) || '其他',
          date: dbBlock.date,
          completed: dbBlock.is_completed === 1,
        }));
      } catch (e) {
        console.error('SQLite getTimeBlocks failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    ensureSeeded();
    const all = load<TimeBlock[]>(KEYS.timeBlocks, []);
    return all.filter(b => b.date === date);
  },

  async addTimeBlock(block: Omit<TimeBlock, 'id'>): Promise<TimeBlock> {
    const entry: TimeBlock = { ...block, id: uid() };

    if (isDesktop()) {
      try {
        const dbBlock: DbTimeBlock = {
          id: entry.id,
          task_id: null,
          title: entry.title,
          start_time: entry.startTime,
          end_time: entry.endTime,
          duration_minutes: entry.durationMinutes,
          category: entry.category,
          notes: null,
          date: entry.date,
          is_completed: entry.completed ? 1 : 0,
        };
        await invoke('create_time_block', { block: dbBlock });
        return entry;
      } catch (e) {
        console.error('SQLite createTimeBlock failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    const all = load<TimeBlock[]>(KEYS.timeBlocks, []);
    all.push(entry);
    save(KEYS.timeBlocks, all);
    return entry;
  },

  async updateTimeBlock(id: string, updates: Partial<TimeBlock>): Promise<TimeBlock> {
    if (isDesktop()) {
      try {
        const blocks = await this.getTimeBlocks(updates.date || '');
        const current = blocks.find(b => b.id === id);
        if (!current) throw new Error(`TimeBlock not found: ${id}`);

        const updated = { ...current, ...updates };
        const dbBlock: DbTimeBlock = {
          id: updated.id,
          task_id: null,
          title: updated.title,
          start_time: updated.startTime,
          end_time: updated.endTime,
          duration_minutes: updated.durationMinutes,
          category: updated.category,
          notes: null,
          date: updated.date,
          is_completed: updated.completed ? 1 : 0,
        };
        await invoke('update_time_block', { block: dbBlock });
        return updated;
      } catch (e) {
        console.error('SQLite updateTimeBlock failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    const all = load<TimeBlock[]>(KEYS.timeBlocks, []);
    const idx = all.findIndex(b => b.id === id);
    if (idx === -1) throw new Error(`TimeBlock not found: ${id}`);
    all[idx] = { ...all[idx], ...updates, id };
    save(KEYS.timeBlocks, all);
    return all[idx];
  },

  async deleteTimeBlock(id: string): Promise<void> {
    if (isDesktop()) {
      try {
        await invoke('delete_time_block', { id });
        return;
      } catch (e) {
        console.error('SQLite deleteTimeBlock failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    const all = load<TimeBlock[]>(KEYS.timeBlocks, []);
    save(KEYS.timeBlocks, all.filter(b => b.id !== id));
  },

  // --- Settings ---
  async getSettings(): Promise<AppSettings> {
    if (isDesktop()) {
      try {
        const dbSettings = await invoke<DbSettings>('get_app_settings');

        const settings: AppSettings = {
          theme: dbSettings.theme,
          colorTheme: dbSettings.color_theme,
          backgroundSkin: dbSettings.background_skin,
          dailyGoalMinutes: dbSettings.daily_goal_minutes,
          language: dbSettings.language,
          aiApiKey: dbSettings.ai_api_key || undefined,
          aiProvider: (dbSettings.ai_provider as AppSettings['aiProvider']) || 'ernie',
          autoStartOnBoot: dbSettings.auto_start_on_boot === 1,
          blockedPatterns: dbSettings.blocked_patterns ? JSON.parse(dbSettings.blocked_patterns) : [],
          featureFlags: dbSettings.feature_flags ? JSON.parse(dbSettings.feature_flags) : {
            pet: true,
            focus: true,
            habits: true,
            timeBlocks: true,
          },
        };
        return settings;
      } catch (e) {
        console.error('SQLite getSettings failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    ensureSeeded();
    return load<AppSettings>(KEYS.settings, seedSettings());
  },

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    if (isDesktop()) {
      try {
        const current = await this.getSettings();
        const updated = { ...current, ...updates };

        const dbSettings: DbSettings = {
          theme: updated.theme,
          color_theme: updated.colorTheme,
          background_skin: updated.backgroundSkin,
          daily_goal_minutes: updated.dailyGoalMinutes,
          language: updated.language,
          ai_api_key: updated.aiApiKey || null,
          ai_provider: updated.aiProvider || null,
          auto_start_on_boot: updated.autoStartOnBoot ? 1 : 0,
          blocked_patterns: updated.blockedPatterns ? JSON.stringify(updated.blockedPatterns) : null,
          feature_flags: updated.featureFlags ? JSON.stringify(updated.featureFlags) : null,
        };
        await invoke('update_app_settings', { settings: dbSettings });
        return updated;
      } catch (e) {
        console.error('SQLite updateSettings failed, falling back to localStorage', e);
      }
    }

    // Fallback for web demo
    const settings = load<AppSettings>(KEYS.settings, seedSettings());
    const updated = { ...settings, ...updates };
    save(KEYS.settings, updated);
    return updated;
  },

  // --- Stats Helpers ---
  getDailyStats(date: string): { totalMinutes: number; activityCount: number; categories: Record<string, number> } {
    ensureSeeded();
    const activities = this.getActivities(date);
    const categories: Record<string, number> = {};
    let totalMinutes = 0;

    // Calculate start and end of the target date in minutes
    const [year, month, day] = date.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day + 1, 0, 0, 0);
    const startMs = startOfDay.getTime();
    const endMs = endOfDay.getTime();

    for (const a of activities) {
      // Calculate when activity start time
      const activityStart = new Date(a.startTime).getTime();
      const activityEnd = activityStart + a.duration * 60 * 1000;

      // Clip to day boundary
      const clippedStart = Math.max(activityStart, startMs);
      const clippedEnd = Math.min(activityEnd, endMs);

      // Calculate actual minutes on this day
      const actualMinutes = Math.max(0, (clippedEnd - clippedStart) / (60 * 1000));

      totalMinutes += actualMinutes;
      categories[a.category] = (categories[a.category] || 0) + actualMinutes;
    }

    // Cap total at 24h = 1440 minutes
    totalMinutes = Math.min(totalMinutes, 24 * 60);

    return { totalMinutes, activityCount: activities.length, categories };
  },

  getWeeklyStats(): { daily: DailyStat[]; categories: Record<string, number> } {
    ensureSeeded();
    const daily: DailyStat[] = [];
    const categories: Record<string, number> = {};
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = toDateStr(d);
      const stats = this.getDailyStats(ds);
      daily.push({ date: ds, ...stats });
      for (const [cat, mins] of Object.entries(stats.categories)) {
        categories[cat] = (categories[cat] || 0) + mins;
      }
    }

    return { daily, categories };
  },

  getMonthlyHeatmap(year: number, month: number): Record<string, number> {
    ensureSeeded();
    const heatmap: Record<string, number> = {};
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStr = String(month).padStart(2, '0');

    for (let day = 1; day <= daysInMonth; day++) {
      const ds = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
      const activities = this.getActivities(ds);
      const total = activities.reduce((sum, a) => sum + a.duration, 0);
      if (total > 0) heatmap[ds] = total;
    }

    return heatmap;
  },
};

export default dataService;
