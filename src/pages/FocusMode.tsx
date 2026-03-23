// 专注模式 - 番茄工作法
// 25分钟工作 / 5分钟休息，支持自定义时长
// 记录专注会话，统计每日专注时间

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Theme } from '../App'

type FocusMode = 'work' | 'break'

interface FocusSession {
  id: string
  startTime: number
  duration: number
  mode: FocusMode
}

interface FocusModeProps {
  theme: Theme
}

const DEFAULT_WORK_MINUTES = 25
const DEFAULT_BREAK_MINUTES = 5
const LONG_BREAK_MINUTES = 15
const POMODORO_BEFORE_LONG_BREAK = 4

const FocusMode: React.FC<FocusModeProps> = ({ theme: _theme }) => {
  const [workMinutes, setWorkMinutes] = useState(DEFAULT_WORK_MINUTES)
  const [breakMinutes, setBreakMinutes] = useState(DEFAULT_BREAK_MINUTES)
  const [timeLeft, setTimeLeft] = useState(DEFAULT_WORK_MINUTES * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [currentMode, setCurrentMode] = useState<FocusMode>('work')
  const [sessionCount, setSessionCount] = useState(0)
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [showSettings, setShowSettings] = useState(false)

  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 加载历史会话统计
  useEffect(() => {
    const today = new Date().toDateString()
    const saved = localStorage.getItem(`merize-focus-sessions-${today}`)
    if (saved) {
      const parsed: FocusSession[] = JSON.parse(saved)
      setSessions(parsed)
      setSessionCount(parsed.filter(s => s.mode === 'work').length)
    }

    // 创建音频元素
    audioRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3')
  }, [])

  // 保存会话到本地存储
  const saveSessions = useCallback((newSessions: FocusSession[]) => {
    const today = new Date().toDateString()
    localStorage.setItem(`merize-focus-sessions-${today}`, JSON.stringify(newSessions))
  }, [])

  // 格式化时间为 mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 进度百分比
  const getProgressPercent = (): number => {
    const total = currentMode === 'work' ? workMinutes * 60 : breakMinutes * 60
    return ((total - timeLeft) / total) * 100
  }

  // 开始计时器
  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true)
    }
  }

  // 暂停计时器
  const pauseTimer = () => {
    setIsRunning(false)
  }

  // 重置计时器
  const resetTimer = () => {
    setIsRunning(false)
    if (currentMode === 'work') {
      setTimeLeft(workMinutes * 60)
    } else {
      setTimeLeft(breakMinutes * 60)
    }
  }

  // 跳过当前会话，切换模式
  const skipSession = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setIsRunning(false)
    switchMode()
  }

  // 切换工作/休息模式
  const switchMode = () => {
    if (currentMode === 'work') {
      // 完成一个工作会话
      const newSession: FocusSession = {
        id: Date.now().toString(),
        startTime: Date.now() - workMinutes * 60 * 1000,
        duration: workMinutes * 60,
        mode: 'work'
      }
      const newSessions = [...sessions, newSession]
      setSessions(newSessions)
      saveSessions(newSessions)
      setSessionCount(newSessions.filter(s => s.mode === 'work').length)

      // 决定休息时长
      const completedWorkSessions = newSessions.filter(s => s.mode === 'work').length
      const actualBreakMinutes = completedWorkSessions % POMODORO_BEFORE_LONG_BREAK === 0
        ? LONG_BREAK_MINUTES
        : breakMinutes

      setCurrentMode('break')
      setTimeLeft(actualBreakMinutes * 60)
    } else {
      setCurrentMode('work')
      setTimeLeft(workMinutes * 60)
    }
  }

  // 计时器滴答
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // 时间到
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.error('播放提示音失败', e))
            }
            setIsRunning(false)
            switchMode()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning, timeLeft])

  // 计算今日总专注分钟
  const totalFocusMinutes = sessions
    .filter(s => s.mode === 'work')
    .reduce((sum, s) => sum + Math.round(s.duration / 60), 0)

  // 背景颜色根据模式变化
  const bgGradient = currentMode === 'work'
    ? 'from-blue-900 to-indigo-900'
    : 'from-green-700 to-teal-800'

  const progressColor = currentMode === 'work'
    ? 'bg-blue-400'
    : 'bg-green-400'

  const buttonBg = currentMode === 'work'
    ? 'bg-blue-500 hover:bg-blue-600'
    : 'bg-green-500 hover:bg-green-600'

  return (
    <div className={`min-h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br ${bgGradient} text-white`}>
      <div className="w-full max-w-md text-center">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {currentMode === 'work' ? '专注工作' : '放松休息'}
          </h1>
          <p className="text-white/70">
            {currentMode === 'work'
              ? '关闭通知，专注当下一件事'
              : '站起来活动一下，喝杯水休息一下'
            }
          </p>
        </div>

        {/* 计时器圆圈 */}
        <div className="relative mb-8">
          <div className="w-64 h-64 mx-auto rounded-full border-8 border-white/20 flex items-center justify-center relative overflow-hidden">
            {/* 进度条 */}
            <div
              className={`absolute inset-0 ${progressColor} opacity-20 transition-all duration-1000 ease-linear`}
              style={{ width: `${getProgressPercent()}%`, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
            />
            <div className="relative z-10">
              <div className="text-6xl font-bold tracking-wider">
                {formatTime(timeLeft)}
              </div>
              <div className="text-white/70 text-sm mt-2">
                {sessionCount} 个番茄钟 • {totalFocusMinutes} 分钟
              </div>
            </div>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {!isRunning ? (
            <button
              onClick={startTimer}
              className={`px-8 py-3 rounded-full font-semibold ${buttonBg} transition-all hover:scale-105`}
            >
              {timeLeft === (currentMode === 'work' ? workMinutes : breakMinutes) * 60
                ? '开始'
                : '继续'
              }
            </button>
          ) : (
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
          <button
            onClick={skipSession}
            className="px-6 py-3 rounded-full font-semibold bg-white/10 hover:bg-white/20 transition-all hover:scale-105"
          >
            跳过
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
                    if (!isRunning && currentMode === 'work') {
                      setTimeLeft(val * 60)
                    }
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
                    if (!isRunning && currentMode === 'break') {
                      setTimeLeft(val * 60)
                    }
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>1m</span>
                  <span>30m</span>
                </div>
              </div>
              <p className="text-xs text-white/60">
                💡 每 {POMODORO_BEFORE_LONG_BREAK} 个番茄钟后会自动延长休息时间到 {LONG_BREAK_MINUTES} 分钟
              </p>
            </div>
          </div>
        )}

        {/* 今日统计 */}
        {sessions.length > 0 && (
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-left">
            <h3 className="font-semibold mb-3">今日统计</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{sessionCount}</div>
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
          <p>番茄工作法: 25分钟专注工作 → 5分钟休息，循环往复。</p>
          <p className="mt-1">每完成4个番茄钟，建议休息15分钟。</p>
        </div>
      </div>
    </div>
  )
}

export default FocusMode
