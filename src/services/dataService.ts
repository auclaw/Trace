// Merize Data Service - localStorage-based data layer for web demo
// All localStorage keys prefixed with 'merize-'

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

export interface AppSettings {
  theme: string;
  colorTheme: string;
  backgroundSkin: string;
  featureFlags: Record<string, boolean>;
  dailyGoalMinutes: number;
  language: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
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
// Storage helpers
// ============================================================

const KEYS = {
  activities: 'merize-activities',
  tasks: 'merize-tasks',
  habits: 'merize-habits',
  focusSessions: 'merize-focus-sessions',
  pet: 'merize-pet',
  settings: 'merize-settings',
  timeBlocks: 'merize-time-blocks',
  seeded: 'merize-seeded',
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
  };
}

// SEED:TIME_BLOCKS
function seedTimeBlocks(): TimeBlock[] {
  const now = new Date();
  const blocks: TimeBlock[] = [];
  const today = toDateStr(now);
  const tomorrow = toDateStr(new Date(now.getTime() + 86400000));

  const todayBlocks: Omit<TimeBlock, 'id'>[] = [
    { title: '晨间代码审查', startTime: `${today}T09:00:00`, endTime: `${today}T09:45:00`, category: '工作', date: today, completed: true },
    { title: '前端开发 - 新功能', startTime: `${today}T10:00:00`, endTime: `${today}T12:00:00`, category: '开发', date: today, completed: true },
    { title: '午休', startTime: `${today}T12:00:00`, endTime: `${today}T13:00:00`, category: '休息', date: today, completed: true },
    { title: '产品需求评审', startTime: `${today}T14:00:00`, endTime: `${today}T15:00:00`, category: '会议', date: today, completed: false },
    { title: '接口联调', startTime: `${today}T15:00:00`, endTime: `${today}T17:00:00`, category: '开发', date: today, completed: false },
    { title: '英语学习', startTime: `${today}T19:00:00`, endTime: `${today}T19:30:00`, category: '学习', date: today, completed: false },
    { title: '阅读时间', startTime: `${today}T21:00:00`, endTime: `${today}T21:45:00`, category: '阅读', date: today, completed: false },
  ];

  const tomorrowBlocks: Omit<TimeBlock, 'id'>[] = [
    { title: '站会', startTime: `${tomorrow}T09:30:00`, endTime: `${tomorrow}T09:45:00`, category: '会议', date: tomorrow, completed: false },
    { title: '性能优化', startTime: `${tomorrow}T10:00:00`, endTime: `${tomorrow}T12:00:00`, category: '开发', date: tomorrow, completed: false },
    { title: '午休', startTime: `${tomorrow}T12:00:00`, endTime: `${tomorrow}T13:00:00`, category: '休息', date: tomorrow, completed: false },
    { title: '技术分享准备', startTime: `${tomorrow}T14:00:00`, endTime: `${tomorrow}T16:00:00`, category: '学习', date: tomorrow, completed: false },
    { title: '健身', startTime: `${tomorrow}T18:00:00`, endTime: `${tomorrow}T19:00:00`, category: '运动', date: tomorrow, completed: false },
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

// ============================================================
// Data service
// ============================================================

const dataService = {
  // --- Activities ---
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
  getTasks(date?: string): Task[] {
    ensureSeeded();
    const all = load<Task[]>(KEYS.tasks, []);
    if (!date) return all;
    return all.filter(t => t.dueDate === date);
  },

  addTask(task: Omit<Task, 'id'>): Task {
    const all = load<Task[]>(KEYS.tasks, []);
    const entry: Task = { ...task, id: uid() };
    all.push(entry);
    save(KEYS.tasks, all);
    return entry;
  },

  updateTask(id: string, updates: Partial<Task>): Task {
    const all = load<Task[]>(KEYS.tasks, []);
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) throw new Error(`Task not found: ${id}`);
    all[idx] = { ...all[idx], ...updates, id };
    save(KEYS.tasks, all);
    return all[idx];
  },

  deleteTask(id: string): void {
    const all = load<Task[]>(KEYS.tasks, []);
    save(KEYS.tasks, all.filter(t => t.id !== id));
  },

  saveTasks(tasks: Task[]): void {
    ensureSeeded();
    save(KEYS.tasks, tasks);
  },

  // --- Habits ---
  getHabits(): Habit[] {
    ensureSeeded();
    return load<Habit[]>(KEYS.habits, []);
  },

  addHabit(habit: Omit<Habit, 'id'>): Habit {
    const all = load<Habit[]>(KEYS.habits, []);
    const entry: Habit = { ...habit, id: uid() };
    all.push(entry);
    save(KEYS.habits, all);
    return entry;
  },

  updateHabit(id: string, updates: Partial<Habit>): Habit {
    const all = load<Habit[]>(KEYS.habits, []);
    const idx = all.findIndex(h => h.id === id);
    if (idx === -1) throw new Error(`Habit not found: ${id}`);
    all[idx] = { ...all[idx], ...updates, id };
    save(KEYS.habits, all);
    return all[idx];
  },

  deleteHabit(id: string): void {
    const all = load<Habit[]>(KEYS.habits, []);
    save(KEYS.habits, all.filter(h => h.id !== id));
  },

  checkinHabit(id: string, date: string, minutes: number): Habit {
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
  getFocusSessions(date?: string): FocusSession[] {
    ensureSeeded();
    const all = load<FocusSession[]>(KEYS.focusSessions, []);
    if (!date) return all;
    return all.filter(s => s.startTime.startsWith(date));
  },

  addFocusSession(session: Omit<FocusSession, 'id'>): FocusSession {
    const all = load<FocusSession[]>(KEYS.focusSessions, []);
    const entry: FocusSession = { ...session, id: uid() };
    all.push(entry);
    save(KEYS.focusSessions, all);
    return entry;
  },

  // --- Pet ---
  getPet(): Pet {
    ensureSeeded();
    let pet = load<Pet>(KEYS.pet, seedPet());

    // Natural decay: hunger and mood decrease over time
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

    return pet;
  },

  updatePet(updates: Partial<Pet>): Pet {
    const pet = load<Pet>(KEYS.pet, seedPet());
    const updated = {
      ...pet,
      ...updates,
      // Update timestamps when changing hunger or mood
      lastFed: 'hunger' in updates ? new Date().toISOString() : pet.lastFed,
      lastInteracted: 'mood' in updates ? new Date().toISOString() : pet.lastInteracted,
    };
    save(KEYS.pet, updated);
    return updated;
  },

  // --- Time Blocks ---
  getTimeBlocks(date: string): TimeBlock[] {
    ensureSeeded();
    const all = load<TimeBlock[]>(KEYS.timeBlocks, []);
    return all.filter(b => b.date === date);
  },

  addTimeBlock(block: Omit<TimeBlock, 'id'>): TimeBlock {
    const all = load<TimeBlock[]>(KEYS.timeBlocks, []);
    const entry: TimeBlock = { ...block, id: uid() };
    all.push(entry);
    save(KEYS.timeBlocks, all);
    return entry;
  },

  updateTimeBlock(id: string, updates: Partial<TimeBlock>): TimeBlock {
    const all = load<TimeBlock[]>(KEYS.timeBlocks, []);
    const idx = all.findIndex(b => b.id === id);
    if (idx === -1) throw new Error(`TimeBlock not found: ${id}`);
    all[idx] = { ...all[idx], ...updates, id };
    save(KEYS.timeBlocks, all);
    return all[idx];
  },

  deleteTimeBlock(id: string): void {
    const all = load<TimeBlock[]>(KEYS.timeBlocks, []);
    save(KEYS.timeBlocks, all.filter(b => b.id !== id));
  },

  // --- Settings ---
  getSettings(): AppSettings {
    ensureSeeded();
    return load<AppSettings>(KEYS.settings, seedSettings());
  },

  updateSettings(updates: Partial<AppSettings>): AppSettings {
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
