// 专注模式 - 番茄工作法
// 25分钟工作 / 5分钟休息，支持自定义时长
// 浏览器模式前端独立运行，桌面应用使用后端驱动保证准确性

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Theme } from '../App'
import type { PomodoroData, PomodoroState } from '../utils/tracking'

interface FocusModeProps {
  theme: Theme
}

const FocusMode: React.FC<FocusModeProps> = ({ theme: _theme }) => {
  // FocusMode uses immersive fullscreen with mode-specific gradients regardless of app theme
  const [pomodoro, setPomodoro] = useState<PomodoroData>({
    state: 'Idle',
    remaining_seconds: 25 * 60,
    total_seconds: 25 * 60,
    completed_sessions: 0,
    progress_percent: 0,
  })
  const [showSettings, setShowSettings] = useState(false)
  const [workMinutes, setWorkMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [longBreakMinutes, setLongBreakMinutes] = useState(15)
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(4)

  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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
    }

    // 启动定时器
    timerRef.current = window.setInterval(tick, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [playNotification, sessionsBeforeLongBreak, breakMinutes, longBreakMinutes])

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
      case 'Running': return '专注中'
      case 'Paused': return '已暂停'
      case 'Break': return '休息中'
      case 'LongBreak': return '长休息'
      default: return '未知'
    }
  }

  // Get background gradient based on current state
  const getBgGradient = (state: PomodoroState): string => {
    switch (state) {
      case 'Running': return 'from-blue-900 to-indigo-900'
      case 'Break': return 'from-green-700 to-teal-800'
      case 'LongBreak': return 'from-green-800 to-teal-900'
      case 'Paused': return 'from-yellow-700 to-orange-800'
      case 'Idle': return 'from-gray-800 to-gray-900'
      default: return 'from-gray-800 to-gray-900'
    }
  }

  // Get progress color based on current state
  const getProgressColor = (state: PomodoroState): string => {
    switch (state) {
      case 'Running': return 'bg-blue-400'
      case 'Break': case 'LongBreak': return 'bg-green-400'
      case 'Paused': return 'bg-yellow-400'
      case 'Idle': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  // Get button background based on current state
  const getButtonBg = (state: PomodoroState): string => {
    switch (state) {
      case 'Running': return 'bg-blue-500 hover:bg-blue-600'
      case 'Break': case 'LongBreak': return 'bg-green-500 hover:bg-green-600'
      case 'Paused': return 'bg-yellow-500 hover:bg-yellow-600'
      case 'Idle': return 'bg-gray-500 hover:bg-gray-600'
      default: return 'bg-gray-500 hover:bg-gray-600'
    }
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
  const progressColor = getProgressColor(pomodoro.state)
  const buttonBg = getButtonBg(pomodoro.state)

  const isIdleOrPaused = pomodoro.state === 'Idle' || pomodoro.state === 'Paused'

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br ${bgGradient} text-white`}>
      <div className="w-full max-w-md text-center">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {getModeName(pomodoro.state)}
          </h1>
          <p className="text-white/70">
            {pomodoro.state === 'Running'
              ? '关闭通知，专注当下一件事'
              : pomodoro.state === 'Break' || pomodoro.state === 'LongBreak'
              ? '站起来活动一下，喝杯水休息一下'
              : '点击开始开始专注之旅'
            }
          </p>
        </div>

        {/* 计时器圆圈 */}
        <div className="relative mb-8">
          <div className="w-64 h-64 mx-auto rounded-full border-8 border-white/20 flex items-center justify-center relative overflow-hidden">
            {/* 进度条 */}
            <div
              className={`absolute inset-0 ${progressColor} opacity-20 transition-all duration-1000 ease-linear`}
              style={{ width: `${pomodoro.progress_percent}%`, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
            />
            <div className="relative z-10">
              <div className="text-6xl font-bold tracking-wider">
                {formatTime(pomodoro.remaining_seconds)}
              </div>
              <div className="text-white/70 text-sm mt-2">
                {pomodoro.completed_sessions} 个番茄钟 • {totalFocusMinutes} 分钟
              </div>
            </div>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
          {isIdleOrPaused && pomodoro.remaining_seconds > 0 && (
            <button
              onClick={startTimer}
              className={`px-8 py-3 rounded-full font-semibold ${buttonBg} transition-all hover:scale-105`}
            >
              {pomodoro.state === 'Idle' ? '开始' : '继续'}
            </button>
          )}
          {pomodoro.state === 'Running' && (
            <button
              onClick={pauseTimer}
              className={`px-8 py-3 rounded-full font-semibold bg-white/20 hover:bg-white/30 transition-all hover:scale-105`}
            >
              暂停
            </button>
          )}
          <button
            onClick={resetTimer}
            className="px-6 py-3 rounded-full font-semibold bg-white/10 hover:bg-white/20 transition-all hover:scale-105"
          >
            重置
          </button>
        </div>

        {/* 设置开关 */}
        <div className="mb-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-white/70 hover:text-white text-sm underline"
          >
            {showSettings ? '收起设置' : '调整时长 ⚙️'}
          </button>
        </div>

        {/* 设置面板 */}
        {showSettings && (
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-8 text-left animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
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
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>5m</span>
                  <span>60m</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
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
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>1m</span>
                  <span>30m</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
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
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>10m</span>
                  <span>45m</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
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
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>2</span>
                  <span>6</span>
                </div>
              </div>
              <p className="text-xs text-white/60">
                💡 配置会保存在本地，刷新后生效
              </p>
            </div>
          </div>
        )}

        {/* 今日统计 */}
        {pomodoro.completed_sessions > 0 && (
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-left">
            <h3 className="font-semibold mb-3">今日统计</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{pomodoro.completed_sessions}</div>
                <div className="text-sm text-white/70">完成番茄钟</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{totalFocusMinutes}</div>
                <div className="text-sm text-white/70">总专注分钟</div>
              </div>
            </div>
          </div>
        )}

        {/* 小贴士 */}
        <div className="mt-8 text-white/50 text-sm">
          <p>番茄工作法: 专注工作 → 休息，循环往复。</p>
          <p className="mt-1">每完成多个番茄钟，建议延长休息时间恢复精力。</p>
        </div>
      </div>
    </div>
  )
}

export default FocusMode
