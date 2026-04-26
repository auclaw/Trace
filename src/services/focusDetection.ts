import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ==================== 类型定义 ====================

export type UserChoice = 'work' | 'break' | 'distraction' | 'dismissed'

export interface DistractionEvent {
  id: string
  timestamp: string
  appName: string
  windowTitle: string
  durationMinutes: number
  category: string
  userChoice?: UserChoice
  autoDismissed: boolean
  handled: boolean
}

export interface DetectionSettings {
  idleThresholdMinutes: number
  distractionThresholdMinutes: number
  meetingThresholdMinutes: number
  breakAutoReturnMinutes: number
  enableNotification: boolean
  enableSound: boolean
  focusReminderThresholdMinutes: number  // 连续专注多久后开始提醒
  focusReminderIntervalMinutes: number   // 每隔多久提醒一次
}

export interface AppRule {
  appName: string
  type: 'always-work' | 'always-distraction' | 'always-ask'
  createdAt: string
}

interface FocusDetectionState {
  // 配置
  settings: DetectionSettings
  appRules: AppRule[]

  // 运行时状态
  isDetecting: boolean
  currentActivity: { appName: string; windowTitle: string; category: string; startTime: number } | null
  lastActivityTime: number
  isOnBreak: boolean
  breakEndTime: number | null

  // 连续专注计时
  focusStartTime: number | null

  // 待处理事件
  pendingEvent: DistractionEvent | null

  // 历史记录
  history: DistractionEvent[]

  // 动作
  startDetection: () => void
  stopDetection: () => void
  updateActivity: (appName: string, windowTitle: string, category: string) => void
  reportIdle: () => void
  handleUserChoice: (choice: UserChoice, eventId: string) => void
  startBreak: (minutes?: number) => void
  endBreak: () => void
  dismissEvent: (eventId: string) => void
  addAppRule: (appName: string, type: AppRule['type']) => void
  getContinuousFocusMinutes: () => number
}

// ==================== 核心检测逻辑 ====================

const DEFAULT_SETTINGS: DetectionSettings = {
  idleThresholdMinutes: 5,
  distractionThresholdMinutes: 3,
  meetingThresholdMinutes: 15,
  breakAutoReturnMinutes: 15,
  enableNotification: true,
  enableSound: false,
  focusReminderThresholdMinutes: 30,  // 连续专注 30 分钟后开始提醒
  focusReminderIntervalMinutes: 30,   // 每隔 30 分钟提醒一次
}

// 会议/学习类应用 - 阈值更长
const MEETING_CATEGORIES = ['会议', 'Meeting', '学习', 'Learning', '电话']
const WORK_CATEGORIES = ['工作', '开发', '代码', '设计', '写作', '研究']

export const useFocusStore = create<FocusDetectionState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      appRules: [],
      isDetecting: false,
      currentActivity: null,
      lastActivityTime: Date.now(),
      isOnBreak: false,
      breakEndTime: null,
      focusStartTime: null,
      pendingEvent: null,
      history: [],

      startDetection: () => {
        set({ isDetecting: true, lastActivityTime: Date.now() })
        console.log('🎯 Focus detection started')
      },

      stopDetection: () => {
        set({ isDetecting: false, focusStartTime: null })
        console.log('🛑 Focus detection stopped')
      },

      updateActivity: (appName, windowTitle, category) => {
        const state = get()
        const now = Date.now()

        // 如果正在休息，什么都不做
        if (state.isOnBreak) {
          if (state.breakEndTime && now > state.breakEndTime) {
            get().endBreak()
          }
          return
        }

        // 检查这个应用是否有自定义规则
        const rule = state.appRules.find(r =>
          appName.toLowerCase().includes(r.appName.toLowerCase())
        )

        if (rule) {
          if (rule.type === 'always-work') {
            // 永远是工作，延续专注计时
            if (!state.focusStartTime) {
              set({ focusStartTime: now })
            }
            set({ lastActivityTime: now, currentActivity: { appName, windowTitle, category, startTime: now } })
            return
          }
          if (rule.type === 'always-distraction') {
            // 永远是分心，打断专注计时
            set({ focusStartTime: null })
            setTimeout(() => get().reportIdle(), 1000)
            return
          }
        }

        // 工作/会议类应用，更新活动时间，延续专注计时
        const isWorkActivity = WORK_CATEGORIES.includes(category) || MEETING_CATEGORIES.includes(category)
        if (isWorkActivity) {
          set(state => ({
            lastActivityTime: now,
            currentActivity: { appName, windowTitle, category, startTime: now },
            focusStartTime: state.focusStartTime || now,  // 第一次进入工作状态，开始计时
          }))
          return
        }

        // 非工作类应用，不打断专注计时（直到超过阈值才触发弹窗）
        const threshold = state.settings.distractionThresholdMinutes * 60 * 1000
        const elapsed = now - state.lastActivityTime

        // 如果切换了应用，重置当前活动计时器，但不重置连续专注计时
        if (state.currentActivity?.appName !== appName) {
          set({ lastActivityTime: now, currentActivity: { appName, windowTitle, category, startTime: now } })
          return
        }

        // 超过阈值 -> 触发分心检测，同时打断专注计时
        if (elapsed > threshold && !state.pendingEvent) {
          const event: DistractionEvent = {
            id: `distraction_${now}`,
            timestamp: new Date().toISOString(),
            appName,
            windowTitle,
            durationMinutes: Math.round(elapsed / 60 / 1000),
            category,
            autoDismissed: false,
            handled: false,
          }

          set({ pendingEvent: event, focusStartTime: null })
          showNotification(event)
        }
      },

      // 计算连续专注时长（分钟）
      // 逻辑：只要中间没有休息、没有分心、没有长时间空闲，就算连续
      // 不管是在做工作A还是工作B，只要是工作状态，计时就不会中断
      getContinuousFocusMinutes: () => {
        const state = get()
        if (!state.focusStartTime || state.isOnBreak) {
          return 0
        }
        const now = Date.now()
        return Math.floor((now - state.focusStartTime) / 60 / 1000)
      },

      reportIdle: () => {
        // 空闲检测逻辑
        const state = get()
        if (state.isOnBreak || state.pendingEvent) return

        const now = Date.now()
        const elapsed = now - state.lastActivityTime
        const threshold = state.settings.idleThresholdMinutes * 60 * 1000

        if (elapsed > threshold) {
          const event: DistractionEvent = {
            id: `idle_${now}`,
            timestamp: new Date().toISOString(),
            appName: '系统空闲',
            windowTitle: '',
            durationMinutes: Math.round(elapsed / 60 / 1000),
            category: '空闲',
            autoDismissed: false,
            handled: false,
          }
          // 空闲超时，重置连续专注计时
          set({ pendingEvent: event, focusStartTime: null })
          showNotification(event)
        }
      },

      handleUserChoice: (choice, eventId) => {
        const state = get()
        const event = state.pendingEvent?.id === eventId ? state.pendingEvent : state.history.find(e => e.id === eventId)
        if (!event) return

        const updatedEvent = { ...event, userChoice: choice, handled: true }

        // 根据选择执行动作
        switch (choice) {
          case 'work':
            // 用户说这是工作 - 恢复连续专注计时
            set({ focusStartTime: Date.now() })
            console.log('✅ Marked as work:', event.appName)
            break

          case 'break':
            // 用户选择休息 - 开始休息计时
            get().startBreak()
            break

          case 'distraction':
            // 用户承认分心了 - 重置专注计时
            set({ focusStartTime: null })
            console.log('❌ Marked as distraction:', event.appName)
            break

          case 'dismissed':
            // 用户只是关掉了弹窗，什么都不做
            break
        }

        set(state => ({
          ...state,
          pendingEvent: null,
          history: [updatedEvent, ...state.history].slice(0, 100),
          lastActivityTime: Date.now(),
        }))
      },

      startBreak: (minutes) => {
        const duration = minutes || get().settings.breakAutoReturnMinutes
        const endTime = Date.now() + duration * 60 * 1000

        // 开始休息时重置连续专注计时和提醒时间
        set({ isOnBreak: true, breakEndTime: endTime, pendingEvent: null, focusStartTime: null })
        lastFocusReminderTime = 0

        // 注册休息结束提醒
        setTimeout(() => {
          if (get().isOnBreak) {
            showBreakEndNotification()
            get().endBreak()
          }
        }, duration * 60 * 1000)

        console.log(`☕ Break started for ${duration} minutes`)
      },

      endBreak: () => {
        set({ isOnBreak: false, breakEndTime: null, lastActivityTime: Date.now() })
        console.log('⏰ Break ended, back to work!')
      },

      dismissEvent: (eventId) => {
        const state = get()
        if (state.pendingEvent?.id === eventId) {
          const dismissedEvent = { ...state.pendingEvent, autoDismissed: true, handled: true }
          set(state => ({
            ...state,
            pendingEvent: null,
            history: [dismissedEvent, ...state.history].slice(0, 100),
            lastActivityTime: Date.now(),
          }))
        }
      },

      addAppRule: (appName, type) => {
        const rule: AppRule = {
          appName,
          type,
          createdAt: new Date().toISOString(),
        }
        set(state => ({
          appRules: [...state.appRules.filter(r => r.appName !== appName), rule]
        }))
      },
    }),
    {
      name: 'trace-focus-detection',
      partialize: (state) => ({
        settings: state.settings,
        appRules: state.appRules,
        history: state.history.slice(0, 50),
      }),
    }
  )
)

// ==================== 系统通知 ====================

function showNotification(event: DistractionEvent) {
  if (!useFocusStore.getState().settings.enableNotification) return

  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      const n = new Notification('👋 你在做什么？', {
        body: `刚才 ${event.durationMinutes} 分钟你一直在使用「${event.appName}」，点击查看详情`,
        icon: '/favicon.svg',
        tag: event.id,
      })

      n.onclick = () => {
        window.focus()
        n.close()
      }

      // 15 秒后自动关闭并标记为已忽略
      setTimeout(() => {
        n.close()
        if (useFocusStore.getState().pendingEvent?.id === event.id) {
          useFocusStore.getState().dismissEvent(event.id)
        }
      }, 15000)
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission()
    }
  }
}

function showBreakEndNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('⏰ 休息结束啦！', {
      body: '该回到工作状态了，加油 💪',
      icon: '/favicon.svg',
    })
  }
}

// 专注时长提醒通知
function showFocusReminder(focusMinutes: number) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('🎯 专注提醒', {
      body: `你已经连续专注 ${focusMinutes} 分钟了，要不要休息一下？`,
      icon: '/favicon.svg',
    })
  }
}

// 上次发送专注提醒的时间
let lastFocusReminderTime = 0

// 导出全局检测循环
export function startGlobalDetectionLoop() {
  const store = useFocusStore.getState()
  store.startDetection()

  // 每秒检查一次
  setInterval(() => {
    const state = useFocusStore.getState()
    if (!state.isDetecting) return

    // 检查空闲状态
    state.reportIdle()

    // 检查连续专注时长，发送休息提醒
    const focusMinutes = state.getContinuousFocusMinutes()
    const now = Date.now()

    if (focusMinutes >= state.settings.focusReminderThresholdMinutes) {
      const minutesSinceLastReminder = (now - lastFocusReminderTime) / 60 / 1000

      // 达到提醒阈值，且超过提醒间隔
      if (minutesSinceLastReminder >= state.settings.focusReminderIntervalMinutes) {
        showFocusReminder(focusMinutes)
        lastFocusReminderTime = now
      }
    }
  }, 1000)
}

// 空闲检测器应该调用这个函数
export function reportNewActivity(appName: string, windowTitle: string, category: string) {
  useFocusStore.getState().updateActivity(appName, windowTitle, category)
}
