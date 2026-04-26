import { create } from 'zustand'
import dataService, { isDesktop } from '../services/dataService'
import type { Activity, Task, Habit, Pet, FocusSession, HabitCategory, EmotionalTag } from '../services/dataService'
import type { ColorTheme, BackgroundSkin } from '../config/themes'
import { colorThemeConfigs, DEFAULT_MODULES } from '../config/themes'
import type { RecommendationWeights, RecommendationMode } from '../services/taskRecommendation'
import { DEFAULT_WEIGHTS, getTopRecommendations } from '../services/taskRecommendation'
import { useFocusStore } from '../services/focusDetection'

// Re-export types for convenience
export type { Activity, Task, Habit, Pet, FocusSession, HabitCategory, EmotionalTag }

// ─── Focus settings ───
export interface FocusSettings {
  workMinutes: number
  breakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number
}

// ─── Toast ───
export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

// ─── Helpers ───
const LS = {
  THEME: 'trace-theme',
  COLOR_THEME: 'trace-color-theme',
  BG_SKIN: 'trace-background-skin',
  SIDEBAR: 'trace-sidebar-collapsed',
  MODULES: 'trace-active-modules',
  FIRST_LAUNCH: 'trace-first-launch-done',
  FOCUS_SETTINGS: 'trace-focus-settings',
  DASHBOARD_WIDGETS: 'trace-dashboard-widget-order',
  CATEGORIES: 'trace-categories',
  // Guardian Beta localStorage keys
  GUARDIAN_LAST_MORNING: 'trace-guardian-last-morning',
  GUARDIAN_LAST_REVIEW: 'trace-guardian-last-review',
  GUARDIAN_TOMORROW_TOP: 'trace-guardian-tomorrow-top',
  GUARDIAN_SETTINGS: 'trace-guardian-settings',
  // Task Recommendation
  RECOMMENDATION_WEIGHTS: 'trace-recommendation-weights',
  RECOMMENDATION_MODE: 'trace-recommendation-mode',
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const DEFAULT_PET: Pet = {
  name: '小橘',
  type: 'cat',
  level: 1,
  xp: 0,
  hunger: 80,
  mood: 80,
  coins: 50,
  lastFed: new Date().toISOString(),
  lastInteracted: new Date().toISOString(),
  decoration: '',
}

const DEFAULT_FOCUS: FocusSettings = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
}

// ─── Categories ───
export interface Category {
  id: string
  name: string
  color: string
  enabled: boolean
  isDefault: boolean
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: '工作', color: '#79BEEB', enabled: true, isDefault: true },
  { id: 'meeting', name: '会议', color: '#D4C4FB', enabled: true, isDefault: true },
  { id: 'break', name: '休息', color: '#A8E6CF', enabled: true, isDefault: true },
  { id: 'study', name: '学习', color: '#FFD3B6', enabled: true, isDefault: true },
  { id: 'other', name: '其他', color: '#9E9899', enabled: true, isDefault: true },
]

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Store Interface ───
export interface AppState {
  // Theme
  theme: 'light' | 'dark'
  colorTheme: ColorTheme
  backgroundSkin: BackgroundSkin
  setTheme: (theme: 'light' | 'dark') => void
  setColorTheme: (theme: ColorTheme) => void
  setBackgroundSkin: (skin: BackgroundSkin) => void

  // Categories
  categories: Category[]
  toggleCategory: (id: string) => void
  addCategory: (name: string, color: string) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string, migrateToId: string) => void

  // Activities
  activities: Activity[]
  loadActivities: (date?: string) => Promise<void>
  addActivity: (activity: Omit<Activity, 'id'>) => Promise<Activity>
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>
  deleteActivity: (id: string) => Promise<void>

  // Tasks
  tasks: Task[]
  loadTasks: (date?: string) => Promise<void>
  addTask: (task: Omit<Task, 'id'>) => Promise<Task>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  reorderTasks: (newOrder: Task[]) => void

  // Habits
  habits: Habit[]
  loadHabits: () => Promise<void>
  addHabit: (habit: Omit<Habit, 'id'>) => Promise<Habit>
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  checkinHabit: (id: string, date: string, minutes: number) => Promise<void>

  // Focus
  focusState: 'idle' | 'working' | 'break' | 'longBreak'
  focusTimeLeft: number
  focusSessions: number
  focusSettings: FocusSettings
  startFocus: () => void
  pauseFocus: () => void
  resetFocus: () => void
  tickFocus: () => Promise<void>
  skipBreak: () => void
  updateFocusSettings: (settings: Partial<FocusSettings>) => void

  // Pet
  pet: Pet
  loadPet: () => Promise<void>
  feedPet: () => Promise<void>
  interactPet: () => Promise<void>
  renamePet: (name: string) => Promise<void>
  setPetType: (type: string) => Promise<void>
  setPetDecoration: (decoration: string) => Promise<void>
  updatePetStats: (updates: Partial<Pet>) => Promise<void>

  // UI State
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  activeModules: string[]
  setActiveModules: (modules: string[]) => void

  // Toast
  toasts: Toast[]
  addToast: (type: Toast['type'], message: string) => void
  removeToast: (id: string) => void

  // First launch
  isFirstLaunch: boolean
  completeFirstLaunch: () => void

  // Initialization
  initialized: boolean
  initialize: () => Promise<void>

  // Daily stats helpers
  dailyGoalMinutes: number
  setDailyGoalMinutes: (minutes: number) => void

  // Dashboard customizable widget order
  dashboardWidgetOrder: string[]
  setDashboardWidgetOrder: (order: string[]) => void

  // Guardian Beta state
  isFocusModeOpen: boolean
  currentFocusTaskId: string | null
  currentRecommendedTaskId: string | null
  lastMorningRitualDate: string | null
  lastDailyReviewDate: string | null
  tomorrowTopTaskId: string | null
  guardianSettings: {
    morningRitualEnabled: boolean
    dailyReviewEnabled: boolean
    launchBoostEnabled: boolean
  }

  // Guardian Beta actions
  setIsFocusModeOpen: (open: boolean) => void
  setCurrentFocusTaskId: (id: string | null) => void
  setCurrentRecommendedTaskId: (id: string | null) => void
  setLastMorningRitualDate: (date: string) => void
  setLastDailyReviewDate: (date: string) => void
  setTomorrowTopTaskId: (id: string | null) => void
  updateGuardianSettings: (settings: Partial<AppState['guardianSettings']>) => void
  getRecommendedTask: () => Task | null

  // Task Recommendation
  recommendationMode: RecommendationMode
  recommendationWeights: RecommendationWeights
  setRecommendationMode: (mode: RecommendationMode) => void
  setRecommendationWeights: (weights: Partial<RecommendationWeights>) => void
  resetRecommendationWeights: () => void
  getRecommendedTasks: (count?: number) => Task[]
}

// ─── Store ───
export const useAppStore = create<AppState>()((set, get) => ({
  // ── Theme ──
  theme: (localStorage.getItem(LS.THEME) as 'light' | 'dark') || 'light',
  colorTheme: (localStorage.getItem(LS.COLOR_THEME) as ColorTheme) || 'blue',
  backgroundSkin: (localStorage.getItem(LS.BG_SKIN) as BackgroundSkin) || 'gradient',

  setTheme: (theme) => {
    localStorage.setItem(LS.THEME, theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },

  setColorTheme: (colorTheme) => {
    localStorage.setItem(LS.COLOR_THEME, colorTheme)
    const config = colorThemeConfigs[colorTheme]
    document.documentElement.style.setProperty('--color-accent', config.accent)
    document.documentElement.style.setProperty('--color-accent-soft', config.accentSoft)
    set({ colorTheme })
  },

  setBackgroundSkin: (backgroundSkin) => {
    localStorage.setItem(LS.BG_SKIN, backgroundSkin)
    set({ backgroundSkin })
  },

  // ── Categories ──
  categories: loadJSON(LS.CATEGORIES, DEFAULT_CATEGORIES),

  toggleCategory: (id) => {
    const newCategories = get().categories.map((c) =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    )
    localStorage.setItem(LS.CATEGORIES, JSON.stringify(newCategories))
    set({ categories: newCategories })
  },

  addCategory: (name, color) => {
    const newCategory: Category = {
      id: `custom_${Date.now()}`,
      name,
      color,
      enabled: true,
      isDefault: false,
    }
    const newCategories = [...get().categories, newCategory]
    localStorage.setItem(LS.CATEGORIES, JSON.stringify(newCategories))
    set({ categories: newCategories })
    get().addToast('success', `分类 "${name}" 已添加`)
  },

  updateCategory: (id, updates) => {
    const newCategories = get().categories.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    )
    localStorage.setItem(LS.CATEGORIES, JSON.stringify(newCategories))
    set({ categories: newCategories })
  },

  deleteCategory: (id, migrateToId) => {
    const category = get().categories.find((c) => c.id === id)
    if (!category || category.isDefault) {
      get().addToast('error', '默认分类无法删除')
      return
    }
    // Migrate activities to new category
    const activitiesToUpdate = get().activities.filter((a) => a.category === category.name)
    const migrateToCategory = get().categories.find((c) => c.id === migrateToId)
    if (migrateToCategory) {
      activitiesToUpdate.forEach((a) => {
        dataService.updateActivity(a.id, { category: migrateToCategory.name as any })
      })
    }
    const newCategories = get().categories.filter((c) => c.id !== id)
    localStorage.setItem(LS.CATEGORIES, JSON.stringify(newCategories))
    set({ categories: newCategories })
    get().addToast('success', `分类 "${category.name}" 已删除`)
  },

  // ── Activities (still uses localStorage via dataService for now) ──
  activities: [],

  loadActivities: async (date) => {
    const data = date
      ? await dataService.getActivities(date)
      : await dataService.getActivities(todayStr())
    set({ activities: data })
  },

  addActivity: async (activity) => {
    const created = await dataService.addActivity(activity)
    set((s) => ({ activities: [...s.activities, created] }))
    get().addToast('success', '活动已添加')
    return created
  },

  updateActivity: async (id, updates) => {
    await dataService.updateActivity(id, updates)
    set((s) => ({
      activities: s.activities.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }))
  },

  deleteActivity: async (id) => {
    await dataService.deleteActivity(id)
    set((s) => ({ activities: s.activities.filter((a) => a.id !== id) }))
    get().addToast('info', '活动已删除')
  },

  // ── Tasks ──
  tasks: [],

  loadTasks: async (date) => {
    const data = date ? await dataService.getTasks(date) : await dataService.getTasks()
    set({ tasks: data })
  },

  addTask: async (task) => {
    const created = await dataService.addTask(task)
    set((s) => ({ tasks: [...s.tasks, created] }))
    get().addToast('success', '任务已创建')
    return created
  },

  updateTask: async (id, updates) => {
    await dataService.updateTask(id, updates)
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },

  deleteTask: async (id) => {
    await dataService.deleteTask(id)
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    get().addToast('info', '任务已删除')
  },

  reorderTasks: (newOrder) => {
    // Tasks are already updated in state, dataService doesn't need saveTasks
    set({ tasks: newOrder })
  },

  // ── Habits ──
  habits: [],

  loadHabits: async () => {
    const data = await dataService.getAllHabits()
    set({ habits: data })
  },

  addHabit: async (habit) => {
    const created = await dataService.createHabit(habit)
    set((s) => ({ habits: [...s.habits, created] }))
    get().addToast('success', '习惯已创建')
    return created
  },

  updateHabit: async (id, updates) => {
    await dataService.updateHabit(id, updates)
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    }))
  },

  deleteHabit: async (id) => {
    await dataService.deleteHabit(id)
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }))
    get().addToast('info', '习惯已删除')
  },

  checkinHabit: async (id, date, minutes) => {
    await dataService.recordCheckin(id, date, minutes)
    await get().loadHabits()
    get().addToast('success', '打卡成功！')
  },

  // ── Focus ──
  focusState: 'idle',
  focusTimeLeft: DEFAULT_FOCUS.workMinutes * 60,
  focusSessions: 0,
  focusSettings: loadJSON<FocusSettings>(LS.FOCUS_SETTINGS, DEFAULT_FOCUS),

  startFocus: (taskId?: string, durationMinutes?: number) => {
    const { focusState, focusSettings } = get()
    if (focusState === 'idle' || focusState === 'break' || focusState === 'longBreak') {
      // 同步启动后台专注检测
      const focusDetection = useFocusStore.getState()
      if (!focusDetection.isDetecting) {
        focusDetection.startDetection()
      }

      // 使用传入的自定义时长，或默认配置时长
      const minutes = durationMinutes || focusSettings.workMinutes

      set({
        focusState: 'working',
        focusTimeLeft: minutes * 60,
        currentFocusTaskId: taskId || null,
      })
    } else if (taskId) {
      // 如果已经在专注中，只更新当前任务
      set({ currentFocusTaskId: taskId })
    }
  },

  pauseFocus: () => {
    // 暂停时停止后台专注检测
    const focusDetection = useFocusStore.getState()
    if (focusDetection.isDetecting) {
      focusDetection.stopDetection()
    }
    set({ focusState: 'idle', currentFocusTaskId: null })
  },

  resetFocus: () => {
    const { focusSettings } = get()
    // 重置时停止后台专注检测
    const focusDetection = useFocusStore.getState()
    if (focusDetection.isDetecting) {
      focusDetection.stopDetection()
    }
    set({
      focusState: 'idle',
      focusTimeLeft: focusSettings.workMinutes * 60,
      focusSessions: 0,
      currentFocusTaskId: null,
    })
  },

  tickFocus: async () => {
    const { focusState, focusTimeLeft, focusSessions, focusSettings, pet } = get()
    if (focusState === 'idle') return

    const next = focusTimeLeft - 1
    if (next <= 0) {
      if (focusState === 'working') {
        const newSessions = focusSessions + 1
        const isLong = newSessions % focusSettings.longBreakInterval === 0
        const breakTime = isLong
          ? focusSettings.longBreakMinutes * 60
          : focusSettings.breakMinutes * 60

        // Record focus session
        const now = new Date()
        const startTime = new Date(now.getTime() - focusSettings.workMinutes * 60000)
        await dataService.createFocusSession({
          startTime: startTime.toISOString(),
          endTime: now.toISOString(),
          duration: focusSettings.workMinutes,
          type: 'work',
          completed: true,
        })

        // Reward pet XP
        const xpGain = focusSettings.workMinutes
        const newXp = pet.xp + xpGain
        const xpPerLevel = pet.level * 100
        let newLevel = pet.level
        let remainingXp = newXp
        if (newXp >= xpPerLevel) {
          newLevel = pet.level + 1
          remainingXp = newXp - xpPerLevel
          get().addToast('success', `宠物升级到 ${newLevel} 级！`)
        }
        const newCoins = pet.coins + Math.floor(focusSettings.workMinutes / 5)
        await dataService.savePet({ ...pet, xp: remainingXp, level: newLevel, coins: newCoins })
        set({
          pet: { ...pet, xp: remainingXp, level: newLevel, coins: newCoins },
          focusState: isLong ? 'longBreak' : 'break',
          focusTimeLeft: breakTime,
          focusSessions: newSessions,
        })
        get().addToast('info', isLong ? '辛苦了！来一个长休息吧' : '休息一下！')
      } else {
        // Break ended
        const { focusSettings: fs } = get()
        set({
          focusState: 'idle',
          focusTimeLeft: fs.workMinutes * 60,
        })
        get().addToast('info', '休息结束，准备好继续了吗？')
      }
    } else {
      set({ focusTimeLeft: next })
    }
  },

  skipBreak: () => {
    const { focusSettings } = get()
    set({
      focusState: 'idle',
      focusTimeLeft: focusSettings.workMinutes * 60,
    })
    get().addToast('info', '休息已跳过，准备开始新一轮！')
  },

  updateFocusSettings: (updates) => {
    set((s) => {
      const focusSettings = { ...s.focusSettings, ...updates }
      localStorage.setItem(LS.FOCUS_SETTINGS, JSON.stringify(focusSettings))
      if (s.focusState === 'idle' && updates.workMinutes !== undefined) {
        return { focusSettings, focusTimeLeft: updates.workMinutes * 60 }
      }
      return { focusSettings }
    })
  },

  // ── Pet ──
  pet: { ...DEFAULT_PET },

  loadPet: async () => {
    const data = await dataService.getPet()
    set({ pet: data || { ...DEFAULT_PET } })
  },

  feedPet: async () => {
    const { pet } = get()
    if (pet.hunger >= 100) {
      get().addToast('warning', '宠物已经吃饱了！')
      return
    }
    if (pet.coins < 5) {
      get().addToast('warning', '金币不足（需要5枚）')
      return
    }
    const updated: Pet = {
      ...pet,
      hunger: Math.min(100, pet.hunger + 15),
      mood: Math.min(100, pet.mood + 5),
      coins: pet.coins - 5,
      lastFed: new Date().toISOString(),
    }
    await dataService.savePet(updated)
    set({ pet: updated })
    get().addToast('success', '喂食成功！')
  },

  interactPet: async () => {
    const { pet } = get()
    if (pet.mood >= 100) {
      get().addToast('warning', '宠物已经很开心了！')
      return
    }
    const updated: Pet = {
      ...pet,
      mood: Math.min(100, pet.mood + 10),
      lastInteracted: new Date().toISOString(),
    }
    await dataService.savePet(updated)
    set({ pet: updated })
    get().addToast('success', '互动成功！')
  },

  renamePet: async (name) => {
    const updated: Pet = { ...get().pet, name }
    await dataService.savePet(updated)
    set({ pet: updated })
    get().addToast('success', '重命名成功！')
  },

  setPetType: async (type) => {
    const updated: Pet = { ...get().pet, type }
    await dataService.savePet(updated)
    set({ pet: updated })
  },

  setPetDecoration: async (decoration) => {
    const updated: Pet = { ...get().pet, decoration }
    await dataService.savePet(updated)
    set({ pet: updated })
  },

  updatePetStats: async (updates) => {
    const updated: Pet = { ...get().pet, ...updates }
    await dataService.savePet(updated)
    set({ pet: updated })
  },

  // ── UI ──
  sidebarCollapsed: loadJSON<boolean>(LS.SIDEBAR, false),
  toggleSidebar: () => {
    set((s) => {
      const collapsed = !s.sidebarCollapsed
      localStorage.setItem(LS.SIDEBAR, JSON.stringify(collapsed))
      return { sidebarCollapsed: collapsed }
    })
  },

  activeModules: loadJSON<string[]>(LS.MODULES, DEFAULT_MODULES),
  setActiveModules: (modules) => {
    localStorage.setItem(LS.MODULES, JSON.stringify(modules))
    set({ activeModules: modules })
  },

  // ── Toasts ──
  toasts: [],
  addToast: (type, message) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => get().removeToast(id), 3500)
  },
  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },

  // ── First Launch ──
  isFirstLaunch: !localStorage.getItem(LS.FIRST_LAUNCH),
  completeFirstLaunch: () => {
    localStorage.setItem(LS.FIRST_LAUNCH, 'true')
    set({ isFirstLaunch: false })
  },

  // ── Daily Goal ──
  dailyGoalMinutes: loadJSON<number>('trace-daily-goal', 480),
  setDailyGoalMinutes: (minutes) => {
    localStorage.setItem('trace-daily-goal', JSON.stringify(minutes))
    set({ dailyGoalMinutes: minutes })
  },

  // ── Dashboard customizable widget order ──
  dashboardWidgetOrder: loadJSON<string[]>(LS.DASHBOARD_WIDGETS, [
    'nowEngine',
    'trackingBanner',
    'quickActions',
    'statsRow',
    'planComparison',
    'mainTimeline',
    'sidebarWidgets',
    'categoryBreakdown',
  ]),
  setDashboardWidgetOrder: (order) => {
    localStorage.setItem(LS.DASHBOARD_WIDGETS, JSON.stringify(order))
    set({ dashboardWidgetOrder: order })
  },

  // ── Guardian Beta State ──
  isFocusModeOpen: false,
  currentFocusTaskId: null,
  currentRecommendedTaskId: null,
  lastMorningRitualDate: localStorage.getItem(LS.GUARDIAN_LAST_MORNING),
  lastDailyReviewDate: localStorage.getItem(LS.GUARDIAN_LAST_REVIEW),
  tomorrowTopTaskId: localStorage.getItem(LS.GUARDIAN_TOMORROW_TOP),
  guardianSettings: loadJSON(LS.GUARDIAN_SETTINGS, {
    morningRitualEnabled: true,
    dailyReviewEnabled: true,
    launchBoostEnabled: true,
  }),

  setIsFocusModeOpen: (open) => set({ isFocusModeOpen: open }),
  setCurrentFocusTaskId: (id) => set({ currentFocusTaskId: id }),
  setCurrentRecommendedTaskId: (id) => set({ currentRecommendedTaskId: id }),
  setLastMorningRitualDate: (date) => {
    localStorage.setItem(LS.GUARDIAN_LAST_MORNING, date)
    set({ lastMorningRitualDate: date })
  },
  setLastDailyReviewDate: (date) => {
    localStorage.setItem(LS.GUARDIAN_LAST_REVIEW, date)
    set({ lastDailyReviewDate: date })
  },
  setTomorrowTopTaskId: (id) => {
    if (id) {
      localStorage.setItem(LS.GUARDIAN_TOMORROW_TOP, id)
    } else {
      localStorage.removeItem(LS.GUARDIAN_TOMORROW_TOP)
    }
    set({ tomorrowTopTaskId: id })
  },
  updateGuardianSettings: (settings) => {
    const merged = { ...get().guardianSettings, ...settings }
    localStorage.setItem(LS.GUARDIAN_SETTINGS, JSON.stringify(merged))
    set({ guardianSettings: merged })
  },

  // Task Recommendation State
  recommendationMode: loadJSON<RecommendationMode>(LS.RECOMMENDATION_MODE, 'ai_auto'),
  recommendationWeights: loadJSON<RecommendationWeights>(LS.RECOMMENDATION_WEIGHTS, DEFAULT_WEIGHTS),

  setRecommendationMode: (mode) => {
    localStorage.setItem(LS.RECOMMENDATION_MODE, JSON.stringify(mode))
    set({ recommendationMode: mode })
  },

  setRecommendationWeights: (weights) => {
    const merged = { ...get().recommendationWeights, ...weights }
    localStorage.setItem(LS.RECOMMENDATION_WEIGHTS, JSON.stringify(merged))
    set({ recommendationWeights: merged })
  },

  resetRecommendationWeights: () => {
    localStorage.setItem(LS.RECOMMENDATION_WEIGHTS, JSON.stringify(DEFAULT_WEIGHTS))
    set({ recommendationWeights: DEFAULT_WEIGHTS })
  },

  // Enhanced AI recommendation logic
  getRecommendedTask: () => {
    const { tasks, currentFocusTaskId, tomorrowTopTaskId, recommendationWeights, recommendationMode } = get()

    // 1. If there's an active focus task, return that
    if (currentFocusTaskId) {
      const active = tasks.find((t) => t.id === currentFocusTaskId)
      if (active) return active
    }

    // 2. If tomorrow's top task is being reviewed on a new day, prioritize it
    if (tomorrowTopTaskId) {
      const saved = tasks.find((t) => t.id === tomorrowTopTaskId)
      if (saved) return saved
    }

    // 3. Use AI recommendation system
    // Filter for active tasks (not completed, not archived)
    const active = tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived')
    if (active.length === 0) {
      return null
    }

    // 根据模式选择权重
    const weights = recommendationMode === 'priority_only'
      ? { ...DEFAULT_WEIGHTS, priority: 0.8, urgency: 0.15, durationFit: 0.05, habit: 0, progress: 0, contextMatch: 0, emotionalTag: 0 }
      : recommendationWeights

    const recommended = getTopRecommendations(active, 1, weights)
    return recommended[0]?.task || null
  },

  // Get multiple recommended tasks
  getRecommendedTasks: (count = 3) => {
    const { tasks, recommendationWeights, recommendationMode } = get()
    // Filter for active tasks (not completed, not archived) - ensure we only get valid active status
    const active = tasks.filter((t) =>
      t.status === 'todo' || t.status === 'in_progress' || t.status === 'paused'
    )
    if (active.length === 0) return []

    const weights = recommendationMode === 'priority_only'
      ? { ...DEFAULT_WEIGHTS, priority: 0.8, urgency: 0.15, durationFit: 0.05, habit: 0, progress: 0, contextMatch: 0, emotionalTag: 0 }
      : recommendationWeights

    const scored = getTopRecommendations(active, count, weights)
    return scored.map(s => s.task)
  },

  // ── Init ──
  initialized: false,
  initialize: async () => {
    if (get().initialized) return
    const state = get()
    // Apply theme to DOM
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
    const config = colorThemeConfigs[state.colorTheme]
    document.documentElement.style.setProperty('--color-accent', config.accent)
    document.documentElement.style.setProperty('--color-accent-soft', config.accentSoft)
    // Seed demo data for web mode first
    if (!isDesktop()) {
      dataService.ensureSeeded()
    }
    // Load data
    state.loadActivities()
    await state.loadTasks()
    await state.loadHabits()
    await state.loadPet()
    set({ initialized: true })
  },
}))

export default useAppStore
