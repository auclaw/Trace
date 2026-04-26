import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Sparkles, TrendingUp } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import NowEngineCard from '../components/NowEngineCard'
import MorningRitual from '../components/MorningRitual'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 根据时间返回不同的打招呼语
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return '早上好 ☀️'
  if (hour >= 12 && hour < 14) return '中午好 🌤️'
  if (hour >= 14 && hour < 18) return '下午好 🌅'
  if (hour >= 18 && hour < 22) return '晚上好 🌙'
  return '夜深了 ✨'
}

// 鼓励语
function getEncouragement(goalProgress: number): string {
  if (goalProgress >= 100) return '太棒了！今日目标已达成 🎉'
  if (goalProgress >= 70) return '做得很好！继续保持 💪'
  if (goalProgress >= 40) return '状态不错，加油前进 🚀'
  if (goalProgress > 0) return '已开始专注，循序渐进 ⭐'
  return '准备好开始新的一天了吗？'
}

export default function Dashboard() {
  const navigate = useNavigate()

  const activities = useAppStore((s) => s.activities)
  const loadActivities = useAppStore((s) => s.loadActivities)
  const tasks = useAppStore((s) => s.tasks)
  const loadTasks = useAppStore((s) => s.loadTasks)
  const dailyGoalMinutes = useAppStore((s) => s.dailyGoalMinutes)
  const guardianSettings = useAppStore((s) => s.guardianSettings)
  const focusState = useAppStore((s) => s.focusState)
  const [loading, setLoading] = useState(true)

  // Guardian modal states
  const [showMorningRitual, setShowMorningRitual] = useState(false)

  const today = todayStr()
  const todayActivities = activities.filter((a) => a.startTime.slice(0, 10) === today)
  const todayMinutes = Math.round(todayActivities.reduce((sum, a) => sum + (a.duration || 0), 0))
  const goalProgress = dailyGoalMinutes > 0 ? Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100)) : 0

  const isFocusing = focusState === 'working'
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const pendingTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived').length

  useEffect(() => {
    Promise.all([loadActivities(), loadTasks()]).finally(() => setLoading(false))
  }, [loadActivities, loadTasks])

  // Auto-trigger Morning Ritual and Daily Review
  const lastMorningRitualDate = useAppStore((s) => s.lastMorningRitualDate)

  useEffect(() => {
    if (loading) return

    const today = todayStr()
    const currentHour = new Date().getHours()

    // Check Morning Ritual: 5:00 - 18:00, and not done today
    if (
      guardianSettings.morningRitualEnabled &&
      currentHour >= 5 &&
      currentHour < 18 &&
      lastMorningRitualDate !== today
    ) {
      // Delay 1 second to not overwhelm user on page load
      const timer = setTimeout(() => setShowMorningRitual(true), 1000)
      return () => clearTimeout(timer)
    }

  }, [loading, guardianSettings, lastMorningRitualDate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-base)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Guardian Modals */}
      <MorningRitual
        isOpen={showMorningRitual}
        onComplete={() => setShowMorningRitual(false)}
      />

      <div className="min-h-screen px-8 py-8" style={{ background: 'var(--color-bg-base)' }}>
        {/* 🎯 Page Header - 用日期 + 打招呼，去掉 Dashboard */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}>
            {getGreeting()}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>

        {/* 📊 核心数据概览 - 更丰富的设计 */}
        <div
          onClick={() => navigate('/analytics')}
          className="mb-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="grid grid-cols-3 gap-3">
            {/* 今日专注卡片 */}
            <div
              className="p-5 rounded-2xl transition-all duration-200 hover:shadow-md"
              style={{
                background: 'var(--color-bg-surface-1)',
                border: '2px solid var(--color-blue)',
                boxShadow: '4px 4px 0px var(--color-blue-soft)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: isFocusing ? 'var(--color-green-soft)' : 'var(--color-blue-soft)' }}
                >
                  <Sparkles size={20} style={{ color: isFocusing ? 'var(--color-green)' : 'var(--color-blue)' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  今日专注
                </span>
              </div>
              <div className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}>
                {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
              </div>
              {/* 进度条 */}
              <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--color-border-light)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, goalProgress)}%`,
                    background: isFocusing
                      ? 'linear-gradient(90deg, var(--color-green) 0%, var(--color-blue) 100%)'
                      : 'var(--color-accent-gradient)',
                  }}
                />
              </div>
              {isFocusing && (
                <div className="mt-2.5 text-xs font-medium" style={{ color: 'var(--color-green)' }}>
                  🔥 正在专注中...
                </div>
              )}
            </div>

            {/* 目标进度卡片 */}
            <div
              className="p-5 rounded-2xl transition-all duration-200 hover:shadow-md"
              style={{
                background: 'var(--color-bg-surface-1)',
                border: '2px solid var(--color-lemon)',
                boxShadow: '4px 4px 0px var(--color-lemon-soft)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: goalProgress >= 100 ? 'var(--color-green-soft)' : 'var(--color-lemon-soft)' }}
                    >
                      <TrendingUp size={20} style={{ color: goalProgress >= 100 ? 'var(--color-green)' : 'var(--color-lemon)' }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      目标进度
                    </span>
                  </div>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}>
                    {goalProgress}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {goalProgress >= 100 ? '🎉 目标达成' : `还需 ${Math.max(0, dailyGoalMinutes - todayMinutes)} 分钟`}
                  </div>
                </div>
                {/* 小圆环进度指示器 */}
                <div className="relative w-12 h-12 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      strokeWidth="3"
                      fill="none"
                      style={{ stroke: 'var(--color-border-light)' }}
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${Math.min(100, goalProgress) * 1.26} 126`}
                      style={{
                        stroke: goalProgress >= 100
                          ? 'var(--color-green-gradient)'
                          : 'var(--color-lemon-gradient)',
                        strokeLinecap: 'round',
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
                      {goalProgress >= 100 ? '✓' : '💪'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 任务完成卡片 */}
            <div
              className="p-5 rounded-2xl transition-all duration-200 hover:shadow-md"
              style={{
                background: 'var(--color-bg-surface-1)',
                border: '2px solid var(--color-purple)',
                boxShadow: '4px 4px 0px var(--color-purple-soft)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'var(--color-purple-soft)' }}
                    >
                      <Calendar size={20} style={{ color: 'var(--color-purple)' }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      任务完成
                    </span>
                  </div>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}>
                    {completedTasks} / {tasks.length}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {pendingTasks > 0 ? `${pendingTasks} 个待完成` : '✨ 全部完成'}
                  </div>
                </div>
                {/* 已完成任务头像堆叠预览 */}
                {completedTasks > 0 && (
                  <div className="flex -space-x-2 flex-shrink-0">
                    {[...Array(Math.min(2, completedTasks))].map((_, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: `linear-gradient(135deg, var(--color-purple) 0%, var(--color-blue) 100%)`,
                          color: 'white',
                          border: '2px solid var(--color-bg-surface-1)',
                        }}
                      >
                        ✓
                      </div>
                    ))}
                    {completedTasks > 2 && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: 'var(--color-bg-surface-2)',
                          color: 'var(--color-text-secondary)',
                          border: '2px solid var(--color-bg-surface-1)',
                        }}
                      >
                        +{completedTasks - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 鼓励语只在专注时显示 */}
        {isFocusing && (
          <div className="mb-4 text-center">
            <p
              className="text-sm font-medium px-4 py-2 rounded-xl inline-block"
              style={{
                background: 'linear-gradient(135deg, var(--color-green-soft) 0%, var(--color-blue-soft) 100%)',
                color: 'var(--color-success-strong)',
              }}
            >
              🔥 正在专注 · {getEncouragement(goalProgress)}
            </p>
          </div>
        )}

        {/* 🌟 NowEngine - 页面核心 */}
        <NowEngineCard />
      </div>
    </>
  )
}
