// 专注模式 - 番茄工作法
// 25分钟工作 / 5分钟休息，支持自定义时长
// 浏览器模式前端独立运行，桌面应用使用后端驱动保证准确性
// Aether Design: 呼吸动画 + 零干扰专注体验

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Theme } from '../App'
import type { PomodoroData, PomodoroState } from '../utils/tracking'
import { addPetFocus } from '../utils/api'

interface FocusModeProps {
  theme: Theme
}

const FocusMode: React.FC<FocusModeProps> = ({ theme }) => {
  const isDark = theme === 'dark'
  // FocusMode uses immersive fullscreen with mode-specific gradients
  const [pomodoro, setPomodoro] = useState<PomodoroData>({
    state: 'Idle',
    remaining_seconds: 25 * 60,
    total_seconds: 25 * 60,
    completed_sessions: 0,
    progress_percent: 0,
  })
  const [showSettings, setShowSettings] = useState(false)
  const [showBreakReminder, setShowBreakReminder] = useState(false)
  const [workMinutes, setWorkMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [longBreakMinutes, setLongBreakMinutes] = useState(15)
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(4)
  const [reminderThreshold, setReminderThreshold] = useState(45) // 连续专注提醒阈值 (分钟)
  const [totalContinuousFocus, setTotalContinuousFocus] = useState(0) // 累计连续专注分钟

  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastReminderTime = useRef<number>(0) // 上次提醒时间，防止频繁提醒

  // 播放提示音
  const playNotification = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error('播放提示音失败', e))
    }
  }, [])

  // 初始化
  useEffect(() => {
    // 创建音频元素
    audioRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3')

    // 计时tick
    const tick = () => {
      // 累计连续专注
      if (pomodoro.state === 'Running') {
        setTotalContinuousFocus(prev => prev + 1/60) // 每秒加 1/60 分钟
      }

      setPomodoro(prev => {
        if (prev.state !== 'Running') return prev

        const remaining = prev.remaining_seconds - 1
        const progress = 100 - (remaining / prev.total_seconds) * 100

        if (remaining <= 0) {
          // Session completed
          playNotification()
          const completed = prev.completed_sessions + 1
          const isLongBreak = completed % sessionsBeforeLongBreak === 0

          let newState: PomodoroState = 'Break'
          let newTotal = breakMinutes * 60
          if (isLongBreak) {
            newState = 'LongBreak'
            newTotal = longBreakMinutes * 60
          }

          // 给宠物增加经验，每完成一个番茄钟加 workMinutes 经验
          addPetFocus(workMinutes).catch(err => {
            console.error('添加宠物经验失败', err)
          })

          return {
            ...prev,
            state: newState,
            remaining_seconds: newTotal,
            total_seconds: newTotal,
            completed_sessions: completed,
            progress_percent: 100,
          }
        }

        return {
          ...prev,
          remaining_seconds: remaining,
          progress_percent: progress,
        }
      })

      // 检查是否需要提醒休息
      const now = Date.now()
      if (
        pomodoro.state === 'Running' &&
        totalContinuousFocus >= reminderThreshold &&
        !showBreakReminder &&
        now - lastReminderTime.current > 10 * 60 * 1000 // 至少间隔 10 分钟才能提醒一次
      ) {
        playNotification()
        setShowBreakReminder(true)
        lastReminderTime.current = now
      }
    }

    // 启动定时器
    timerRef.current = window.setInterval(tick, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [playNotification, sessionsBeforeLongBreak, breakMinutes, longBreakMinutes, reminderThreshold, totalContinuousFocus, showBreakReminder])

  // 处理提醒弹窗 - 开始休息
  const handleStartBreak = () => {
    setShowBreakReminder(false)
    // 当前会话立即结束，开始休息
    setPomodoro(prev => {
      const completed = prev.completed_sessions + 1
      const isLongBreak = completed % sessionsBeforeLongBreak === 0
      const newTotal = isLongBreak ? longBreakMinutes * 60 : breakMinutes * 60
      return {
        ...prev,
        state: isLongBreak ? 'LongBreak' : 'Break',
        remaining_seconds: newTotal,
        total_seconds: newTotal,
        completed_sessions: completed,
        progress_percent: 100,
      }
    })
    // 给宠物增加经验
    const completedMinutes = workMinutes - (pomodoro.remaining_seconds / 60)
    if (completedMinutes > 1) {
      addPetFocus(Math.round(completedMinutes)).catch(err => {
        console.error('添加宠物经验失败', err)
      })
    }
    setTotalContinuousFocus(0)
  }

  // 处理提醒弹窗 - 推迟 5 分钟
  const handleSnooze = () => {
    setShowBreakReminder(false)
    // 推迟提醒 5 分钟，重置连续计时从 0 开始
    setTotalContinuousFocus(0)
    lastReminderTime.current = Date.now()
  }

  // 格式化时间为 mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 开始计时器
  const startTimer = () => {
    setPomodoro(prev => ({
      ...prev,
      state: 'Running',
    }))
  }

  // 暂停计时器
  const pauseTimer = () => {
    setPomodoro(prev => ({
      ...prev,
      state: 'Paused',
    }))
  }

  // 重置计时器
  const resetTimer = () => {
    const isBreak = pomodoro.state === 'Break' || pomodoro.state === 'LongBreak'
    const newTotal = isBreak
      ? (pomodoro.completed_sessions % sessionsBeforeLongBreak === 0 && pomodoro.completed_sessions > 0)
        ? longBreakMinutes * 60
        : breakMinutes * 60
      : workMinutes * 60

    setPomodoro(prev => ({
      ...prev,
      state: 'Idle',
      remaining_seconds: newTotal,
      total_seconds: newTotal,
      progress_percent: 0,
    }))
  }

  // Get the current mode display name
  const getModeName = (state: PomodoroState): string => {
    switch (state) {
      case 'Idle': return '准备开始'
      case 'Running': return '深度专注'
      case 'Paused': return '已暂停'
      case 'Break': return '短暂休息'
      case 'LongBreak': return '长休息'
      default: return '未知'
    }
  }

  // Get background gradient based on current state - Aether Design System
  const getBgGradient = (state: PomodoroState): string => {
    switch (state) {
      case 'Running':
        return isDark
          ? 'from-aether-dark-100 to-aether-dark-200'
          : 'from-aether-100 to-aether-200'
      case 'Break':
      case 'LongBreak':
        return isDark
          ? 'from-[#1A2F20] to-aether-dark-100'
          : 'from-[#E6F8F0] to-aether-100'
      case 'Paused':
        return isDark
          ? 'from-[#2A2618] to-aether-dark-100'
          : 'from-[#FFF8E6] to-aether-100'
      case 'Idle':
        return isDark
          ? 'from-aether-dark-200 to-aether-dark-300'
          : 'from-aether-200 to-aether-300'
      default:
        return isDark
          ? 'from-aether-dark-200 to-aether-dark-300'
          : 'from-aether-200 to-aether-300'
    }
  }

  // Get accent color based on current state - Aether Design System
  const getAccentColor = (state: PomodoroState): string => {
    switch (state) {
      case 'Running': return isDark ? 'var(--color-accent)' : '#5aa9e6'
      case 'Break': case 'LongBreak': return isDark ? 'var(--color-success)' : '#34c759'
      case 'Paused': return isDark ? 'var(--color-warning)' : '#ff9500'
      case 'Idle': return isDark ? 'var(--color-text-muted)' : 'var(--color-text-muted)'
      default: return isDark ? 'var(--color-text-muted)' : 'var(--color-text-muted)'
    }
  }

  // Get text color based on current state
  const getTextColor = (state: PomodoroState): string => {
    // Always maintain good contrast in immersive mode
    if (isDark) {
      return 'var(--color-text-primary)'
    }
    return state === 'Running' || state === 'Break' || state === 'LongBreak'
      ? 'var(--color-text-primary)'
      : 'var(--color-text-primary)'
  }

  // Get secondary text opacity
  const getSecondaryOpacity = (): string => {
    return isDark ? 'opacity-70' : 'opacity-60'
  }

  // 当设置改变时，重置当前session
  useEffect(() => {
    // 计算新的总时间基于当前状态
    let newTotal = workMinutes * 60;
    const isBreak = pomodoro.state === 'Break' || pomodoro.state === 'LongBreak';
    if (isBreak) {
      newTotal = (pomodoro.completed_sessions % sessionsBeforeLongBreak === 0 && pomodoro.completed_sessions > 0)
        ? longBreakMinutes * 60
        : breakMinutes * 60;
    }
    // 只有当 idle 时才更新
    if (pomodoro.state === 'Idle') {
      setPomodoro(prev => ({
        ...prev,
        remaining_seconds: newTotal,
        total_seconds: newTotal,
      }));
    }
  }, [workMinutes, breakMinutes, longBreakMinutes, pomodoro.state, pomodoro.completed_sessions, sessionsBeforeLongBreak])

  // 计算今日总专注分钟 - 每个完成的工作session贡献workMinutes
  const totalFocusMinutes = pomodoro.completed_sessions * workMinutes

  // 背景颜色根据模式变化
  const bgGradient = getBgGradient(pomodoro.state)
  const accentColor = getAccentColor(pomodoro.state)
  const textColor = getTextColor(pomodoro.state)
  const secondaryOpacity = getSecondaryOpacity()

  const isIdleOrPaused = pomodoro.state === 'Idle' || pomodoro.state === 'Paused'
  const isRunning = pomodoro.state === 'Running'

  // Apply breathing animation when running
  const timerContainerClasses = `w-72 h-72 mx-auto rounded-full border-[12px] flex items-center justify-center relative overflow-hidden ${
    isRunning ? 'animate-breath' : ''
  }`

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-br ${bgGradient} transition-colors duration-300`}>
      <div className="w-full max-w-md text-center">
        {/* 标题 - Zenith Flow: Minimal Cognitive Load */}
        <div className={`mb-8 ${isRunning ? 'opacity-70' : 'opacity-100'} transition-opacity duration-300`}>
          <h1 className={`font-serif text-3xl md:text-4xl font-semibold mb-2 ${textColor}`}>
            {getModeName(pomodoro.state)}
          </h1>
          <p className={`${textColor} ${secondaryOpacity}`}>
            {pomodoro.state === 'Running'
              ? '减少干扰，专注当下这一件事'
              : pomodoro.state === 'Break' || pomodoro.state === 'LongBreak'
              ? '站起来活动一下，喝杯水，让眼睛休息'
              : '准备好开始深度专注了吗？'
            }
          </p>
        </div>

        {/* 计时器圆圈 - with breathing animation when running */}
        <div className="relative mb-8">
          <div
            className={timerContainerClasses}
            style={{
              borderColor: `${accentColor}30`,
              backgroundColor: 'transparent'
            }}
          >
            {/* 圆形进度环 - 使用扇形填充 */}
            <svg className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="50%"
                cy="50%"
                r="calc(50% - 6px)"
                fill="none"
                stroke={`${accentColor}20`}
                strokeWidth="8"
              />
              <circle
                cx="50%"
                cy="50%"
                r="calc(50% - 6px)"
                fill="none"
                stroke={accentColor}
                strokeWidth="8"
                strokeDasharray={`${pomodoro.progress_percent * 2.83} 283`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>

            <div className="relative z-10">
              <div className={`font-sans font-light tracking-[0.1em] ${textColor}`} style={{
                fontSize: 'clamp(3rem, 15vw, 4.5rem)'
              }}>
                {formatTime(pomodoro.remaining_seconds)}
              </div>
              <div className={`${textColor} ${secondaryOpacity} text-sm mt-3`}>
                {pomodoro.completed_sessions} 个番茄钟 • {totalFocusMinutes} 分钟
              </div>
            </div>
          </div>
        </div>

        {/* 控制按钮 - hide completely when running to reduce distraction */}
        {!isRunning && (
          <div className="flex items-center justify-center gap-4 mb-8 flex-wrap animate-in fade-in duration-300">
            {isIdleOrPaused && pomodoro.remaining_seconds > 0 && (
              <button
                onClick={startTimer}
                className={`px-8 py-3 rounded-full font-semibold transition-all hover:scale-105`}
                style={{
                  backgroundColor: `${accentColor}`,
                  color: 'white'
                }}
              >
                {pomodoro.state === 'Idle' ? '开始专注' : '继续'}
              </button>
            )}
            <button
              onClick={resetTimer}
              className="px-6 py-3 rounded-full font-semibold bg-white/10 hover:bg-white/20 backdrop-blur transition-all hover:scale-105"
              style={{
                color: textColor
              }}
            >
              重置
            </button>
          </div>
        )}

        {isRunning && (
          <div className="mb-8">
            <button
              onClick={pauseTimer}
              className="px-8 py-3 rounded-full font-semibold bg-white/10 hover:bg-white/20 backdrop-blur transition-all"
              style={{ color: textColor }}
            >
              暂停
            </button>
          </div>
        )}

        {/* 设置开关 - always visible but subtle */}
        <div className="mb-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`${textColor} ${secondaryOpacity} hover:opacity-100 text-sm underline transition-opacity`}
          >
            {showSettings ? '收起设置' : '调整时长 ⚙️'}
          </button>
        </div>

        {/* 设置面板 */}
        {showSettings && (
          <div className={`bg-white/10 backdrop-blur rounded-card p-6 mb-8 text-left animate-in fade-in slide-in-from-top-2 duration-300 border border-[var(--color-border-subtle)]`}>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${textColor} ${secondaryOpacity}`}>
                  工作时长: {workMinutes} 分钟
                </label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={workMinutes}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setWorkMinutes(val)
                  }}
                  className="w-full accent-[var(--color-accent)]"
                />
                <div className={`flex justify-between text-xs ${textColor} ${secondaryOpacity}`}>
                  <span>5m</span>
                  <span>60m</span>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textColor} ${secondaryOpacity}`}>
                  休息时长: {breakMinutes} 分钟
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={breakMinutes}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setBreakMinutes(val)
                  }}
                  className="w-full accent-[var(--color-accent)]"
                />
                <div className={`flex justify-between text-xs ${textColor} ${secondaryOpacity}`}>
                  <span>1m</span>
                  <span>30m</span>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textColor} ${secondaryOpacity}`}>
                  长休息时长: {longBreakMinutes} 分钟
                </label>
                <input
                  type="range"
                  min="10"
                  max="45"
                  step="5"
                  value={longBreakMinutes}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setLongBreakMinutes(val)
                  }}
                  className="w-full accent-[var(--color-accent)]"
                />
                <div className={`flex justify-between text-xs ${textColor} ${secondaryOpacity}`}>
                  <span>10m</span>
                  <span>45m</span>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textColor} ${secondaryOpacity}`}>
                  长休息间隔: 每 {sessionsBeforeLongBreak} 个番茄钟
                </label>
                <input
                  type="range"
                  min="2"
                  max="6"
                  step="1"
                  value={sessionsBeforeLongBreak}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setSessionsBeforeLongBreak(val)
                  }}
                  className="w-full accent-[var(--color-accent)]"
                />
                <div className={`flex justify-between text-xs ${textColor} ${secondaryOpacity}`}>
                  <span>2</span>
                  <span>6</span>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textColor} ${secondaryOpacity}`}>
                  连续专注提醒: {reminderThreshold} 分钟
                </label>
                <input
                  type="range"
                  min="20"
                  max="90"
                  step="5"
                  value={reminderThreshold}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setReminderThreshold(val)
                  }}
                  className="w-full accent-[var(--color-accent)]"
                />
                <div className={`flex justify-between text-xs ${textColor} ${secondaryOpacity}`}>
                  <span>20m</span>
                  <span>90m</span>
                </div>
              </div>
              <p className={`text-xs ${textColor} ${secondaryOpacity}`}>
                💡 配置会保存在本地，刷新后生效
              </p>
            </div>
          </div>
        )}

        {/* 今日统计 - Only show when not running to reduce distraction */}
        {!isRunning && pomodoro.completed_sessions > 0 && (
          <div className={`bg-white/10 backdrop-blur rounded-card p-6 text-left border border-[var(--color-border-subtle)] animate-in fade-in duration-300`}>
            <h3 className={`font-semibold mb-3 ${textColor}`}>今日统计</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className={`text-2xl font-bold ${textColor}`}>{pomodoro.completed_sessions}</div>
                <div className={`text-sm ${textColor} ${secondaryOpacity}`}>完成番茄钟</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${textColor}`}>{totalFocusMinutes}</div>
                <div className={`text-sm ${textColor} ${secondaryOpacity}`}>总专注分钟</div>
              </div>
            </div>
          </div>
        )}

        {/* 小贴士 - very subtle, low opacity */}
        <div className={`mt-8 ${textColor} ${secondaryOpacity} text-sm`}>
          <p>深度专注: 一次只做一件事，保持节奏比长时间更重要。</p>
          <p className="mt-1">完成多个番茄钟后，延长休息帮助精力恢复。</p>
        </div>

        {/* 连续专注休息提醒弹窗 */}
        {showBreakReminder && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className={`${isDark ? 'bg-aether-dark-200' : 'bg-white'} rounded-2xl p-8 w-full max-w-lg border ${isDark ? 'border-[var(--color-border-subtle)]' : 'border-[var(--color-border-subtle)]'}`}>
              <h2 className={`text-3xl font-bold ${isDark ? 'text-aether-text-dark-primary' : 'text-aether-text-primary'} mb-4`}>
                Ready to take a break?
              </h2>
              <p className={`text-xl ${isDark ? 'text-aether-text-dark-secondary' : 'text-aether-text-secondary'} mb-8`}>
                More than {reminderThreshold} minutes passed since you started working.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleStartBreak}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-full text-xl font-semibold hover:opacity-90 transition-colors"
                >
                  Start Break ({breakMinutes} min)
                </button>
                <button
                  onClick={handleSnooze}
                  className={`flex-1 px-6 py-4 rounded-full text-xl font-semibold ${
                    isDark ? 'bg-aether-dark-300 text-aether-text-dark-primary' : 'bg-aether-200 text-aether-text-primary'
                  } hover:opacity-90 transition-colors`}
                >
                  Snooze (5 min)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FocusMode
