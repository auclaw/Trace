import { create } from 'zustand'
import dataService from '../services/dataService'
import type { Activity, Task, Habit, Pet, FocusSession } from '../services/dataService'
import type { ColorTheme, BackgroundSkin } from '../config/themes'
import { colorThemeConfigs, DEFAULT_MODULES } from '../config/themes'

// Re-export types for convenience
export type { Activity, Task, Habit, Pet, FocusSession }

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
  THEME: 'merize-theme',
  COLOR_THEME: 'merize-color-theme',
  BG_SKIN: 'merize-background-skin',
  SIDEBAR: 'merize-sidebar-collapsed',
  MODULES: 'merize-active-modules',
  FIRST_LAUNCH: 'merize-first-launch-done',
  FOCUS_SETTINGS: 'merize-focus-settings',
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
}

const DEFAULT_FOCUS: FocusSettings = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
}

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

  // Activities
  activities: Activity[]
  loadActivities: (date?: string) => void
  addActivity: (activity: Omit<Activity, 'id'>) => Activity
  updateActivity: (id: string, updates: Partial<Activity>) => void
  deleteActivity: (id: string) => void

  // Tasks
  tasks: Task[]
  loadTasks: (date?: string) => void
  addTask: (task: Omit<Task, 'id'>) => Task
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void

  // Habits
  habits: Habit[]
  loadHabits: () => void
  addHabit: (habit: Omit<Habit, 'id'>) => Habit
  updateHabit: (id: string, updates: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  checkinHabit: (id: string, date: string, minutes: number) => void

  // Focus
  focusState: 'idle' | 'working' | 'break' | 'longBreak'
  focusTimeLeft: number
  focusSessions: number
  focusSettings: FocusSettings
  startFocus: () => void
  pauseFocus: () => void
  resetFocus: () => void
  tickFocus: () => void
  skipBreak: () => void
  updateFocusSettings: (settings: Partial<FocusSettings>) => void

  // Pet
  pet: Pet
  loadPet: () => void
  feedPet: () => void
  interactPet: () => void
  renamePet: (name: string) => void

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
  initialize: () => void

  // Daily stats helpers
  dailyGoalMinutes: number
  setDailyGoalMinutes: (minutes: number) => void
}

// ─── Store ───
export const useAppStore = create<AppState>()((set, get) => ({
  // ── Theme ──
  theme: (localStorage.getItem(LS.THEME) as 'light' | 'dark') || 'light',
  colorTheme: (localStorage.getItem(LS.COLOR_THEME) as ColorTheme) || 'orange',
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

  // ── Activities (localStorage via dataService) ──
  activities: [],

  loadActivities: (date) => {
    const data = date
      ? dataService.getActivities(date)
      : dataService.getActivities(todayStr())
    set({ activities: data })
  },

  addActivity: (activity) => {
    const created = dataService.addActivity(activity)
    set((s) => ({ activities: [...s.activities, created] }))
    get().addToast('success', '活动已添加')
    return created
  },

  updateActivity: (id, updates) => {
    dataService.updateActivity(id, updates)
    set((s) => ({
      activities: s.activities.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }))
  },

  deleteActivity: (id) => {
    dataService.deleteActivity(id)
    set((s) => ({ activities: s.activities.filter((a) => a.id !== id) }))
    get().addToast('info', '活动已删除')
  },

  // ── Tasks ──
  tasks: [],

  loadTasks: (date) => {
    const data = date ? dataService.getTasks(date) : dataService.getTasks()
    set({ tasks: data })
  },

  addTask: (task) => {
    const created = dataService.addTask(task)
    set((s) => ({ tasks: [...s.tasks, created] }))
    get().addToast('success', '任务已创建')
    return created
  },

  updateTask: (id, updates) => {
    dataService.updateTask(id, updates)
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },

  deleteTask: (id) => {
    dataService.deleteTask(id)
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    get().addToast('info', '任务已删除')
  },

  // ── Habits ──
  habits: [],

  loadHabits: () => {
    const data = dataService.getHabits()
    set({ habits: data })
  },

  addHabit: (habit) => {
    const created = dataService.addHabit(habit)
    set((s) => ({ habits: [...s.habits, created] }))
    get().addToast('success', '习惯已创建')
    return created
  },

  updateHabit: (id, updates) => {
    dataService.updateHabit(id, updates)
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    }))
  },

  deleteHabit: (id) => {
    dataService.deleteHabit(id)
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }))
    get().addToast('info', '习惯已删除')
  },

  checkinHabit: (id, date, minutes) => {
    const updated = dataService.checkinHabit(id, date, minutes)
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? updated : h)),
    }))
    get().addToast('success', '打卡成功！')
  },

  // ── Focus ──
  focusState: 'idle',
  focusTimeLeft: DEFAULT_FOCUS.workMinutes * 60,
  focusSessions: 0,
  focusSettings: loadJSON<FocusSettings>(LS.FOCUS_SETTINGS, DEFAULT_FOCUS),

  startFocus: () => {
    const { focusState, focusSettings } = get()
    if (focusState === 'idle' || focusState === 'break' || focusState === 'longBreak') {
      set({
        focusState: 'working',
        focusTimeLeft: focusSettings.workMinutes * 60,
      })
    }
  },

  pauseFocus: () => {
    set({ focusState: 'idle' })
  },

  resetFocus: () => {
    const { focusSettings } = get()
    set({
      focusState: 'idle',
      focusTimeLeft: focusSettings.workMinutes * 60,
      focusSessions: 0,
    })
  },

  skipBreak: () => {
    const { focusSettings } = get()
    set({
      focusState: 'idle',
      focusTimeLeft: focusSettings.workMinutes * 60,
    })
    get().addToast('info', '休息已跳过，准备开始新一轮！')
  },

  tickFocus: () => {
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
        dataService.addFocusSession({
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
        dataService.updatePet({ xp: remainingXp, level: newLevel, coins: newCoins })
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

  loadPet: () => {
    const data = dataService.getPet()
    set({ pet: data })
  },

  feedPet: () => {
    const { pet } = get()
    if (pet.hunger >= 100) {
      get().addToast('warning', '宠物已经吃饱了！')
      return
    }
    if (pet.coins < 5) {
      get().addToast('warning', '金币不足（需要5枚）')
      return
    }
    const updated = dataService.updatePet({
      hunger: Math.min(100, pet.hunger + 15),
      mood: Math.min(100, pet.mood + 5),
      coins: pet.coins - 5,
      lastFed: new Date().toISOString(),
    })
    set({ pet: updated })
    get().addToast('success', '喂食成功！')
  },

  interactPet: () => {
    const { pet } = get()
    if (pet.mood >= 100) {
      get().addToast('warning', '宠物已经很开心了！')
      return
    }
    const updated = dataService.updatePet({
      mood: Math.min(100, pet.mood + 10),
      lastInteracted: new Date().toISOString(),
    })
    set({ pet: updated })
    get().addToast('success', '互动成功！')
  },

  renamePet: (name) => {
    const updated = dataService.updatePet({ name })
    set({ pet: updated })
    get().addToast('success', '重命名成功！')
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
  dailyGoalMinutes: loadJSON<number>('merize-daily-goal', 480),
  setDailyGoalMinutes: (minutes) => {
    localStorage.setItem('merize-daily-goal', JSON.stringify(minutes))
    set({ dailyGoalMinutes: minutes })
  },

  // ── Init ──
  initialized: false,
  initialize: () => {
    if (get().initialized) return
    const state = get()
    // Apply theme to DOM
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
    const config = colorThemeConfigs[state.colorTheme]
    document.documentElement.style.setProperty('--color-accent', config.accent)
    document.documentElement.style.setProperty('--color-accent-soft', config.accentSoft)
    // Load data
    state.loadActivities()
    state.loadTasks()
    state.loadHabits()
    state.loadPet()
    set({ initialized: true })
  },
}))

export default useAppStore
