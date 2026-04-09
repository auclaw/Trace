// Merize Tracking Service - AI Auto-Tracking Core System (TASK-01)
// Simulates background activity tracking with auto-classification,
// privacy controls, rule-based categorization, and batch operations.

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

// Internal type for simulated app definitions
interface SimulatedApp {
  appName: string;
  titles: string[];
  url?: string;
  summary?: string;
  defaultCategory: ActivityCategory;
  /** Hours of day when this app is likely to appear (inclusive) */
  timeSlots: [number, number][];
  /** Relative weight within its time slot */
  weight: number;
  /** Duration range in minutes [min, max] */
  durationRange: [number, number];
}

// ============================================================
// Constants & Storage Keys
// ============================================================

const STORAGE_KEYS = {
  rules: 'merize-tracking-rules',
  privacyLevel: 'merize-tracking-privacy',
  state: 'merize-tracking-state',
  userOverrides: 'merize-tracking-overrides', // remembers user classification changes
  generatedActivities: 'merize-tracking-generated',
} as const;

const TRACKING_INTERVAL_MS = 30_000; // 30 seconds

// ============================================================
// Simulated App Pool (20+ realistic combinations)
// ============================================================

const SIMULATED_APPS: SimulatedApp[] = [
  // --- Development / 开发 ---
  { appName: 'VS Code', titles: ['trackingService.ts - merize', 'App.tsx - merize', 'dataService.ts - merize', 'package.json - merize'], url: undefined, summary: '编辑TypeScript源码', defaultCategory: '开发', timeSlots: [[9, 12], [14, 18]], weight: 10, durationRange: [15, 90] },
  { appName: 'Terminal', titles: ['npm run dev', 'git log --oneline', 'pnpm install', 'vitest run'], url: undefined, summary: '运行开发命令和构建', defaultCategory: '开发', timeSlots: [[9, 12], [14, 18]], weight: 6, durationRange: [5, 30] },
  { appName: 'GitHub Desktop', titles: ['merize-project - Pull Request #42', 'merize-project - Changes', 'Code Review - feat/tracking'], url: 'https://github.com/merize/merize-project', summary: '代码提交与审查', defaultCategory: '开发', timeSlots: [[9, 12], [14, 18]], weight: 4, durationRange: [10, 40] },
  { appName: 'Docker Desktop', titles: ['Containers - merize-api', 'Images', 'Volumes'], url: undefined, summary: '管理容器化开发环境', defaultCategory: '开发', timeSlots: [[10, 12], [14, 17]], weight: 2, durationRange: [5, 20] },

  // --- Work / 工作 ---
  { appName: '飞书', titles: ['项目群 - 前端重构进度', '周报模板', '消息 - 产品需求讨论', 'OKR看板'], url: 'https://feishu.cn', summary: '团队协作与沟通', defaultCategory: '工作', timeSlots: [[9, 12], [14, 18]], weight: 7, durationRange: [5, 45] },
  { appName: 'Notion', titles: ['技术文档 - API设计', '会议纪要 - 2026/04', '项目排期表', '知识库 - 前端架构'], url: 'https://notion.so/merize', summary: '文档编辑与项目管理', defaultCategory: '工作', timeSlots: [[9, 12], [14, 17]], weight: 5, durationRange: [10, 50] },
  { appName: 'Figma', titles: ['Merize v2 - 仪表盘设计稿', '组件库 - Design System', '追踪页面改版'], url: 'https://figma.com/file/merize-v2', summary: '查看和标注UI设计稿', defaultCategory: '工作', timeSlots: [[10, 12], [14, 16]], weight: 3, durationRange: [10, 35] },

  // --- Meeting / 会议 ---
  { appName: '腾讯会议', titles: ['每日站会', '前端周例会', '产品需求评审', '技术方案评审'], url: undefined, summary: '参加视频会议', defaultCategory: '会议', timeSlots: [[9, 10], [14, 15]], weight: 5, durationRange: [15, 60] },
  { appName: '飞书会议', titles: ['1:1 周会 - 主管', 'Sprint回顾', 'All Hands 全体会'], url: undefined, summary: '团队同步会议', defaultCategory: '会议', timeSlots: [[10, 11], [15, 16]], weight: 3, durationRange: [20, 60] },

  // --- Learning / 学习 ---
  { appName: 'Chrome', titles: ['MDN Web Docs - Intersection Observer', 'React 19 新特性 - 掘金', 'TypeScript 5.x 指南', 'Stack Overflow - React hooks'], url: 'https://developer.mozilla.org', summary: '查阅技术文档和博客', defaultCategory: '学习', timeSlots: [[9, 12], [14, 17], [19, 22]], weight: 6, durationRange: [10, 40] },
  { appName: 'Bilibili', titles: ['【前端】React性能优化实战', '函数式编程入门', '系统设计面试讲解', 'Rust入门到放弃'], url: 'https://bilibili.com', summary: '观看技术教程视频', defaultCategory: '学习', timeSlots: [[12, 13], [19, 22]], weight: 4, durationRange: [15, 45] },

  // --- Break / 休息 ---
  { appName: '系统锁屏', titles: ['锁屏中'], url: undefined, summary: '离开电脑休息', defaultCategory: '休息', timeSlots: [[12, 13]], weight: 10, durationRange: [30, 60] },
  { appName: '系统设置', titles: ['显示设置', '声音设置', '网络设置'], url: undefined, summary: '调整系统设置', defaultCategory: '休息', timeSlots: [[12, 13], [15, 16]], weight: 2, durationRange: [3, 10] },

  // --- Entertainment / 娱乐 ---
  { appName: 'Chrome', titles: ['YouTube - Lofi Beats', 'YouTube - 数码评测', 'B站 - 搞笑视频合集', '微博热搜'], url: 'https://youtube.com', summary: '浏览视频和社交媒体', defaultCategory: '娱乐', timeSlots: [[12, 13], [18, 22]], weight: 5, durationRange: [10, 40] },
  { appName: '网易云音乐', titles: ['每日推荐 - 播放中', '我喜欢的音乐', '私人FM'], url: undefined, summary: '听音乐', defaultCategory: '娱乐', timeSlots: [[9, 22]], weight: 2, durationRange: [15, 60] },
  { appName: 'Steam', titles: ['Stardew Valley', 'Celeste', 'Hades', 'Factorio'], url: undefined, summary: '玩游戏放松', defaultCategory: '娱乐', timeSlots: [[19, 23]], weight: 4, durationRange: [30, 90] },

  // --- Exercise / 运动 ---
  { appName: 'Keep', titles: ['HIIT 20分钟', '腹肌训练计划', '跑步记录', '今日已完成'], url: undefined, summary: '运动健身', defaultCategory: '运动', timeSlots: [[6, 8], [18, 20]], weight: 4, durationRange: [20, 50] },

  // --- Reading / 阅读 ---
  { appName: '微信读书', titles: ['《代码整洁之道》', '《深入理解TypeScript》', '《人月神话》', '《重构》'], url: undefined, summary: '阅读技术书籍', defaultCategory: '阅读', timeSlots: [[12, 13], [21, 23]], weight: 5, durationRange: [15, 45] },
  { appName: 'Kindle', titles: ['《三体》', '《基地》', '《黑客与画家》', '《思考，快与慢》'], url: undefined, summary: '阅读书籍', defaultCategory: '阅读', timeSlots: [[21, 23]], weight: 3, durationRange: [20, 50] },

  // --- Other / 其他 ---
  { appName: 'Finder', titles: ['Downloads', '项目文件夹', '文档'], url: undefined, summary: '文件管理', defaultCategory: '其他', timeSlots: [[9, 22]], weight: 1, durationRange: [2, 10] },
  { appName: 'Chrome', titles: ['淘宝 - 机械键盘', '京东 - 显示器', '外卖 - 美团', '天气预报'], url: 'https://taobao.com', summary: '在线购物和生活服务', defaultCategory: '其他', timeSlots: [[12, 13], [18, 22]], weight: 2, durationRange: [5, 25] },
];

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
// Time-of-day Classification Rules
// ============================================================

/**
 * Determine the default category based on time of day.
 * 9-12: work-heavy, 12-13: break, 13-18: mixed, 18+: personal
 */
function classifyByTimeOfDay(hour: number): ActivityCategory[] {
  if (hour >= 9 && hour < 12) {
    return ['开发', '工作', '会议', '学习'];
  } else if (hour >= 12 && hour < 13) {
    return ['休息', '娱乐', '阅读'];
  } else if (hour >= 13 && hour < 18) {
    return ['开发', '工作', '会议', '学习', '阅读', '其他'];
  } else if (hour >= 18 && hour < 22) {
    return ['娱乐', '运动', '阅读', '学习', '其他'];
  } else {
    // early morning or late night
    return ['阅读', '娱乐', '其他'];
  }
}

/**
 * Apply user-defined rules to determine category.
 * Returns the matched rule's category, or null if no rule matches.
 */
function applyRules(appName: string, title: string, url: string | undefined): ActivityCategory | null {
  const rules = loadJSON<TrackingRule[]>(STORAGE_KEYS.rules, getDefaultRules());
  // Sort by priority descending
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    const appMatch = appName.toLowerCase().includes(rule.appName.toLowerCase());
    if (!appMatch) continue;

    if (rule.titleKeyword) {
      const titleMatch = title.toLowerCase().includes(rule.titleKeyword.toLowerCase());
      if (!titleMatch) continue;
    }

    if (rule.urlPattern && url) {
      const urlMatch = url.toLowerCase().includes(rule.urlPattern.toLowerCase());
      if (!urlMatch) continue;
    }

    return rule.targetCategory;
  }

  return null;
}

/**
 * Check user overrides: if user previously reclassified an app+title combo,
 * remember that preference.
 */
function getUserOverride(appName: string, title: string): ActivityCategory | null {
  const overrides = loadJSON<Record<string, ActivityCategory>>(STORAGE_KEYS.userOverrides, {});
  const key = `${appName}|||${title}`;
  return overrides[key] ?? null;
}

function setUserOverride(appName: string, title: string, category: ActivityCategory): void {
  const overrides = loadJSON<Record<string, ActivityCategory>>(STORAGE_KEYS.userOverrides, {});
  overrides[`${appName}|||${title}`] = category;
  saveJSON(STORAGE_KEYS.userOverrides, overrides);
}

/**
 * Full classification pipeline: user override > rules > time-of-day default
 */
function classifyActivity(app: SimulatedApp, title: string, hour: number): ActivityCategory {
  // 1. Check user overrides (learned preferences)
  const override = getUserOverride(app.appName, title);
  if (override) return override;

  // 2. Check tracking rules
  const ruleResult = applyRules(app.appName, title, app.url);
  if (ruleResult) return ruleResult;

  // 3. Check if the app's default category fits current time slot
  const timeCategories = classifyByTimeOfDay(hour);
  if (timeCategories.includes(app.defaultCategory)) {
    return app.defaultCategory;
  }

  // 4. Fallback: use app default anyway (user is doing whatever they want)
  return app.defaultCategory;
}

// ============================================================
// Activity Generation Engine
// ============================================================

/**
 * Pick a weighted random app appropriate for the current hour.
 */
function pickAppForHour(hour: number): { app: SimulatedApp; title: string } {
  // Filter apps whose time slots include the current hour
  const candidates = SIMULATED_APPS.filter(app =>
    app.timeSlots.some(([start, end]) => hour >= start && hour < end)
  );

  if (candidates.length === 0) {
    // Fallback: pick from all apps
    const fallback = SIMULATED_APPS[Math.floor(Math.random() * SIMULATED_APPS.length)];
    const title = fallback.titles[Math.floor(Math.random() * fallback.titles.length)];
    return { app: fallback, title };
  }

  // Weighted random selection
  const totalWeight = candidates.reduce((sum, app) => sum + app.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const app of candidates) {
    roll -= app.weight;
    if (roll <= 0) {
      const title = app.titles[Math.floor(Math.random() * app.titles.length)];
      return { app, title };
    }
  }

  // Shouldn't reach here, but just in case
  const last = candidates[candidates.length - 1];
  return { app: last, title: last.titles[0] };
}

/**
 * Build the activity name based on current privacy level.
 */
function buildActivityName(app: SimulatedApp, title: string, privacyLevel: PrivacyLevel): string {
  switch (privacyLevel) {
    case 'basic':
      return app.appName;
    case 'standard':
      return `${app.appName} - ${title}`;
    case 'detailed': {
      let name = `${app.appName} - ${title}`;
      if (app.url) name += ` (${app.url})`;
      if (app.summary) name += ` | ${app.summary}`;
      return name;
    }
  }
}

/**
 * Generate a single simulated activity for the current moment.
 */
function generateActivity(privacyLevel: PrivacyLevel): Activity {
  const now = new Date();
  const hour = now.getHours();
  const { app, title } = pickAppForHour(hour);

  const category = classifyActivity(app, title, hour);
  const [minDur, maxDur] = app.durationRange;
  const duration = Math.floor(Math.random() * (maxDur - minDur + 1)) + minDur;

  const startTime = new Date(now.getTime() - duration * 60_000);

  return {
    id: uid(),
    name: buildActivityName(app, title, privacyLevel),
    category,
    startTime: toISOLocal(startTime),
    endTime: toISOLocal(now),
    duration,
    isManual: false,
  };
}

// ============================================================
// Activity Merging
// ============================================================

/**
 * Merge consecutive activities with the same category.
 * Two activities are considered consecutive if the gap between them is < 2 minutes.
 */
function mergeConsecutiveActivities(activities: Activity[]): Activity[] {
  if (activities.length <= 1) return activities;

  // Sort by start time
  const sorted = [...activities].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const merged: Activity[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = sorted[i];

    const prevEnd = new Date(prev.endTime).getTime();
    const currStart = new Date(curr.startTime).getTime();
    const gapMinutes = (currStart - prevEnd) / 60_000;

    if (curr.category === prev.category && gapMinutes < 2) {
      // Merge: extend prev to cover curr
      const newEnd = new Date(Math.max(
        new Date(prev.endTime).getTime(),
        new Date(curr.endTime).getTime()
      ));
      prev.endTime = toISOLocal(newEnd);
      prev.duration = Math.round(
        (newEnd.getTime() - new Date(prev.startTime).getTime()) / 60_000
      );
      // Keep the longer/more descriptive name
      if (curr.name.length > prev.name.length) {
        prev.name = curr.name;
      }
    } else {
      merged.push(curr);
    }
  }

  return merged;
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

// ============================================================
// Batch Operations
// ============================================================

/**
 * Batch categorize: set the category for multiple activities at once.
 * Also records user overrides so the system learns the preference.
 */
function batchCategorize(
  activityIds: string[],
  category: ActivityCategory,
  allActivities: Activity[]
): Activity[] {
  const idSet = new Set(activityIds);
  return allActivities.map(a => {
    if (!idSet.has(a.id)) return a;
    // Learn this preference for future auto-classification
    // Extract app name from activity name (first segment before " - ")
    const appName = a.name.split(' - ')[0].trim();
    const title = a.name.split(' - ').slice(1).join(' - ').trim();
    if (appName && title) {
      setUserOverride(appName, title, category);
    }
    return { ...a, category };
  });
}

/**
 * Batch delete: remove multiple activities by ID.
 */
function batchDelete(activityIds: string[], allActivities: Activity[]): Activity[] {
  const idSet = new Set(activityIds);
  return allActivities.filter(a => !idSet.has(a.id));
}

// ============================================================
// Core Tracking Service
// ============================================================

class TrackingService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
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

  start(): void {
    if (this.intervalId !== null) return; // already running

    this.state.isTracking = true;
    this.state.startedAt = toISOLocal(new Date());
    this.persistState();
    this.notify();

    // Generate an initial activity immediately
    this.tick();

    // Then generate every TRACKING_INTERVAL_MS
    this.intervalId = setInterval(() => this.tick(), TRACKING_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.state.isTracking = false;
    this.state.currentActivity = null;
    this.state.startedAt = null;
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

  // ------ Tick: generate + merge + persist ------

  private tick(): void {
    const newActivity = generateActivity(this.state.privacyLevel);

    // Load existing generated activities for today
    const todayKey = toISOLocal(new Date()).slice(0, 10);
    let generated = loadJSON<Activity[]>(STORAGE_KEYS.generatedActivities, []);

    // Filter to today only to keep storage bounded
    generated = generated.filter(a => a.startTime.slice(0, 10) === todayKey);

    generated.push(newActivity);

    // Merge consecutive same-category activities
    generated = mergeConsecutiveActivities(generated);

    saveJSON(STORAGE_KEYS.generatedActivities, generated);

    // Also add to the main dataService activities store so dashboard sees them
    this.syncToDataService(newActivity);

    this.state.currentActivity = newActivity;
    this.state.activitiesGenerated++;
    this.persistState();
    this.notify();
  }

  /**
   * Push the generated activity into the main merize-activities store
   * used by dataService, enabling dashboard/timeline integration.
   */
  private syncToDataService(activity: Activity): void {
    const KEY = 'merize-activities';
    const all = loadJSON<Activity[]>(KEY, []);
    all.push(activity);
    saveJSON(KEY, all);
  }

  // ------ Generated activities (today) ------

  getGeneratedActivities(): Activity[] {
    const todayKey = toISOLocal(new Date()).slice(0, 10);
    const all = loadJSON<Activity[]>(STORAGE_KEYS.generatedActivities, []);
    return all.filter(a => a.startTime.slice(0, 10) === todayKey);
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
  recordUserClassification(activityId: string, newCategory: ActivityCategory): void {
    // Find the activity to extract app+title
    const generated = loadJSON<Activity[]>(STORAGE_KEYS.generatedActivities, []);
    const activity = generated.find(a => a.id === activityId);
    if (activity) {
      const appName = activity.name.split(' - ')[0].trim();
      const title = activity.name.split(' - ').slice(1).join(' - ').split(' (')[0].trim();
      if (appName && title) {
        setUserOverride(appName, title, newCategory);
      }
    }

    // Also update the activity in storage
    const allGenerated = generated.map(a =>
      a.id === activityId ? { ...a, category: newCategory } : a
    );
    saveJSON(STORAGE_KEYS.generatedActivities, allGenerated);

    // Update in main store too
    const KEY = 'merize-activities';
    const mainAll = loadJSON<Activity[]>(KEY, []);
    const updated = mainAll.map(a =>
      a.id === activityId ? { ...a, category: newCategory } : a
    );
    saveJSON(KEY, updated);
  }

  // ------ Batch operations ------

  batchCategorize(activityIds: string[], category: ActivityCategory): void {
    // Update in generated activities store
    let generated = loadJSON<Activity[]>(STORAGE_KEYS.generatedActivities, []);
    generated = batchCategorize(activityIds, category, generated);
    saveJSON(STORAGE_KEYS.generatedActivities, generated);

    // Update in main activities store
    const KEY = 'merize-activities';
    let main = loadJSON<Activity[]>(KEY, []);
    main = batchCategorize(activityIds, category, main);
    saveJSON(KEY, main);
  }

  batchDelete(activityIds: string[]): void {
    // Remove from generated activities store
    let generated = loadJSON<Activity[]>(STORAGE_KEYS.generatedActivities, []);
    generated = batchDelete(activityIds, generated);
    saveJSON(STORAGE_KEYS.generatedActivities, generated);

    // Remove from main activities store
    const KEY = 'merize-activities';
    let main = loadJSON<Activity[]>(KEY, []);
    main = batchDelete(activityIds, main);
    saveJSON(KEY, main);
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
    this.stop();
    localStorage.removeItem(STORAGE_KEYS.rules);
    localStorage.removeItem(STORAGE_KEYS.privacyLevel);
    localStorage.removeItem(STORAGE_KEYS.state);
    localStorage.removeItem(STORAGE_KEYS.userOverrides);
    localStorage.removeItem(STORAGE_KEYS.generatedActivities);
    this.state = {
      isTracking: false,
      privacyLevel: 'standard',
      currentActivity: null,
      activitiesGenerated: 0,
      startedAt: null,
    };
    ensureRulesInitialized();
    this.notify();
  }
}

// ============================================================
// Singleton Export
// ============================================================

export const trackingService = new TrackingService();
