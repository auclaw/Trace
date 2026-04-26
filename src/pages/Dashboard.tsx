import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Calendar, ChevronRight, Sparkles, TrendingUp } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import NowEngineCard from '../components/NowEngineCard'
import MorningRitual from '../components/MorningRitual'
import DailyReview from '../components/DailyReview'

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
  const [showDailyReview, setShowDailyReview] = useState(false)

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
  const lastDailyReviewDate = useAppStore((s) => s.lastDailyReviewDate)

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

    // Check Daily Review: after 20:00, and not done today
    if (
      guardianSettings.dailyReviewEnabled &&
      currentHour >= 20 &&
      lastDailyReviewDate !== today
    ) {
      const timer = setTimeout(() => setShowDailyReview(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [loading, guardianSettings, lastMorningRitualDate, lastDailyReviewDate])

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
      <DailyReview
        isOpen={showDailyReview}
        onComplete={() => setShowDailyReview(false)}
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

        {/* 📊 核心数据概览 - 简约横向卡片 */}
        <div
          onClick={() => navigate('/analytics')}
          className="p-5 mb-6 rounded-2xl flex items-center justify-between gap-4 flex-wrap cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-[0.99]"
          style={{
            background: '#FFFFFF',
            border: '2px solid #D6D3CD',
            boxShadow: '4px 4px 0px #D6D3CD',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: isFocusing ? '#A8E6CF40' : '#79BEEB40' }}
            >
              <Sparkles size={18} style={{ color: isFocusing ? '#2D5A4A' : '#2A4A5E' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: '#9E9899' }}>今日专注</p>
              <p className="text-lg font-bold" style={{ color: isFocusing ? '#2D5A4A' : '#3A3638' }}>
                {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
              </p>
            </div>
          </div>

          <div className="w-px h-10" style={{ background: '#E8E6E1' }} />

          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: goalProgress >= 100 ? '#A8E6CF40' : '#FFD3B640' }}
            >
              <TrendingUp size={18} style={{ color: goalProgress >= 100 ? '#2D5A4A' : '#B8860B' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: '#9E9899' }}>目标进度</p>
              <p className="text-lg font-bold" style={{ color: goalProgress >= 100 ? '#2D5A4A' : '#3A3638' }}>
                {goalProgress}%
              </p>
            </div>
          </div>

          <div className="w-px h-10" style={{ background: '#E8E6E1' }} />

          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#D4C4FB40' }}
            >
              <Calendar size={18} style={{ color: '#4A3A6A' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: '#9E9899' }}>任务完成</p>
              <p className="text-lg font-bold" style={{ color: '#3A3638' }}>
                {completedTasks} / {tasks.length}
              </p>
            </div>
          </div>

          {/* 箭头指示可点击 */}
          <div className="w-px h-10 hidden sm:block" style={{ background: '#E8E6E1' }} />
          <div className="ml-auto flex items-center justify-center w-8 h-8 rounded-xl" style={{ background: '#F5F1EA' }}>
            <ChevronRight size={18} style={{ color: '#9E9899' }} />
          </div>
        </div>

        {/* 鼓励语 + 专注状态提示 */}
        <div className="mb-6 text-center">
          <p
            className="text-sm font-medium px-4 py-2 rounded-xl inline-block"
            style={{
              background: isFocusing
                ? 'linear-gradient(135deg, rgba(168,230,207,0.3) 0%, rgba(121,190,235,0.2) 100%)'
                : 'rgba(245,241,234,0.5)',
              color: isFocusing ? '#2D5A4A' : '#5C5658',
            }}
          >
            {isFocusing && '🔥 正在专注 · '}{getEncouragement(goalProgress)}
          </p>
        </div>

        {/* 🌟 NowEngine - 页面核心 */}
        <div className="mb-6">
          <NowEngineCard />
        </div>

        {/* 底部快捷入口 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/timeline')}
            className="p-5 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: '#FFFFFF',
              border: '2px solid #D6D3CD',
              boxShadow: '4px 4px 0px #D6D3CD',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: '#79BEEB40' }}
              >
                <BarChart3 size={18} style={{ color: '#2A4A5E' }} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: '#3A3638' }}>时间线</p>
                <p className="text-xs" style={{ color: '#9E9899' }}>查看完整活动记录</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/tasks')}
            className="p-5 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: '#FFFFFF',
              border: '2px solid #D6D3CD',
              boxShadow: '4px 4px 0px #D6D3CD',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: '#D4C4FB40' }}
              >
                <BarChart3 size={18} style={{ color: '#4A3A6A' }} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: '#3A3638' }}>任务管理</p>
                <p className="text-xs" style={{ color: '#9E9899' }}>
                  {pendingTasks} 个待办任务
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  )
}
