import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Clock, ListTodo, ChevronRight } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import NowEngineCard from '../components/NowEngineCard'
import ActiveTrackingCard from '../components/Dashboard/ActiveTrackingCard'
import PlanVsActualCard from '../components/Dashboard/PlanVsActualCard'
import DailyReviewCard from '../components/Dashboard/DailyReviewCard'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Dashboard() {
  const navigate = useNavigate()

  const activities = useAppStore((s) => s.activities)
  const loadActivities = useAppStore((s) => s.loadActivities)
  const tasks = useAppStore((s) => s.tasks)
  const loadTasks = useAppStore((s) => s.loadTasks)
  const dailyGoalMinutes = useAppStore((s) => s.dailyGoalMinutes)
  const [loading, setLoading] = useState(true)

  const today = todayStr()
  const todayActivities = activities.filter((a) => a.startTime.slice(0, 10) === today)
  const todayMinutes = Math.round(todayActivities.reduce((sum, a) => sum + (a.duration || 0), 0))
  const goalProgress = dailyGoalMinutes > 0 ? Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100)) : 0

  const efficiencyScore = useMemo(() => {
    if (todayActivities.length === 0) return 0
    const baseScore = Math.min(70, goalProgress * 0.7)
    const activityBonus = Math.min(30, todayActivities.length * 3)
    return Math.min(100, Math.round(baseScore + activityBonus))
  }, [goalProgress, todayActivities.length])

  const pendingTasks = tasks.filter((t) => t.status !== 'completed').length

  useEffect(() => {
    Promise.all([loadActivities(), loadTasks()]).finally(() => setLoading(false))
  }, [loadActivities, loadTasks])

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
    <div className="min-h-screen px-8 py-8" style={{ background: 'var(--color-bg-base)' }}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}>
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Row - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Focus Time - Blue */}
        <div
          className="p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: '#79BEEB',
            border: '2px solid #5AACDF',
            boxShadow: '4px 4px 0px rgba(121, 190, 235, 0.4)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock size={20} style={{ color: '#2A4A5E' }} />
            <span className="text-sm font-semibold" style={{ color: '#2A4A5E' }}>
              Focus Time
            </span>
          </div>
          <div className="text-3xl font-bold mb-2" style={{ color: '#2A4A5E', fontFamily: 'Quicksand, sans-serif' }}>
            {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
          </div>
          <div className="text-xs" style={{ color: '#3D6A7E' }}>
            Today
          </div>
        </div>

        {/* Goal Progress - Green */}
        <div
          className="p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: '#A8E6CF',
            border: '2px solid #7DD4B0',
            boxShadow: '4px 4px 0px rgba(168, 230, 207, 0.4)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <ListTodo size={20} style={{ color: '#2D5A4A' }} />
            <span className="text-sm font-semibold" style={{ color: '#2D5A4A' }}>
              Daily Goal
            </span>
          </div>
          <div className="text-3xl font-bold mb-2" style={{ color: '#2D5A4A', fontFamily: 'Quicksand, sans-serif' }}>
            {goalProgress}%
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: '#D4F5E5' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${goalProgress}%`, background: '#4A8A6E' }}
            />
          </div>
        </div>

        {/* Efficiency Score - Purple */}
        <div
          className="p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: '#D4C4FB',
            border: '2px solid #B8A0E8',
            boxShadow: '4px 4px 0px rgba(212, 196, 251, 0.4)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⚡</span>
            <span className="text-sm font-semibold" style={{ color: '#4A3A6A' }}>
              Efficiency
            </span>
          </div>
          <div className="text-3xl font-bold mb-2" style={{ color: '#4A3A6A', fontFamily: 'Quicksand, sans-serif' }}>
            {efficiencyScore}
          </div>
          <div className="text-xs" style={{ color: '#6A5A8A' }}>
            Better than {Math.min(98, Math.round((todayMinutes / 240) * 50 + (efficiencyScore / 100) * 30 + 20))}%
          </div>
        </div>

        {/* Activities Count - Neutral */}
        <div
          className="p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: '#FFFFFF',
            border: '2px solid #D6D3CD',
            boxShadow: '4px 4px 0px #D6D3CD',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={20} color="#5C5658" />
            <span className="text-sm font-semibold" style={{ color: '#5C5658' }}>
              Activities
            </span>
          </div>
          <div className="text-3xl font-bold mb-2" style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}>
            {todayActivities.length}
          </div>
          <div className="text-xs" style={{ color: '#9E9899' }}>
            Today
          </div>
        </div>
      </div>

      {/* NowEngine - Centerpiece */}
      <div className="mb-6">
        <NowEngineCard />
      </div>

      {/* Activity Tracking & Plan vs Actual Row - 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ActiveTrackingCard
          currentApp="VSCode - Dashboard.tsx"
          duration={todayMinutes}
          category="work"
        />
        <PlanVsActualCard
          plannedMinutes={dailyGoalMinutes}
          actualMinutes={todayMinutes}
          goalMinutes={dailyGoalMinutes}
        />
      </div>

      {/* Daily Review Card */}
      <div className="mb-6">
        <DailyReviewCard
          totalMinutes={todayMinutes}
          efficiencyScore={efficiencyScore}
          completedTasks={tasks.filter((t) => t.status === 'completed').length}
        />
      </div>

      {/* Function Cards Row - 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Review Activities */}
        <div
          className="p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px]"
          onClick={() => navigate('/timeline')}
          style={{
            background: '#FFFFFF',
            border: '2px solid #D6D3CD',
            boxShadow: '4px 4px 0px #D6D3CD',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(168, 230, 207, 0.12)' }}
          >
            <Clock size={18} style={{ color: '#7DD4B0' }} />
          </div>
          <h3 className="text-base font-semibold mb-2" style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}>
            Review Activities
          </h3>
          <p className="text-sm mb-4" style={{ color: '#9E9899' }}>
            Auto-classified by AI, click to confirm
          </p>
          <div className="flex items-center text-xs font-semibold" style={{ color: '#7DD4B0' }}>
            {Math.max(0, todayActivities.length - 3) || 5} items to review
            <ChevronRight size={14} className="ml-1" />
          </div>
        </div>

        {/* Priority Tasks */}
        <div
          className="p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px]"
          onClick={() => navigate('/task')}
          style={{
            background: '#FFFFFF',
            border: '2px solid #D6D3CD',
            boxShadow: '4px 4px 0px #D6D3CD',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(255, 211, 182, 0.12)' }}
          >
            <ListTodo size={18} style={{ color: '#FFBB8E' }} />
          </div>
          <h3 className="text-base font-semibold mb-2" style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}>
            Priority Tasks
          </h3>
          <p className="text-sm mb-4" style={{ color: '#9E9899' }}>
            Important items to complete today
          </p>
          <div className="flex items-center text-xs font-semibold" style={{ color: '#FFBB8E' }}>
            {pendingTasks} pending
            <ChevronRight size={14} className="ml-1" />
          </div>
        </div>

        {/* Daily Report */}
        <div
          className="p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px]"
          onClick={() => navigate('/analytics')}
          style={{
            background: '#FFFFFF',
            border: '2px solid #D6D3CD',
            boxShadow: '4px 4px 0px #D6D3CD',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(121, 190, 235, 0.12)' }}
          >
            <BarChart3 size={18} style={{ color: '#79BEEB' }} />
          </div>
          <h3 className="text-base font-semibold mb-2" style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}>
            Daily Report
          </h3>
          <p className="text-sm mb-4" style={{ color: '#9E9899' }}>
            Efficiency score {efficiencyScore} · Detailed insights
          </p>
          <div className="flex items-center text-xs font-semibold" style={{ color: '#79BEEB' }}>
            View full analysis
            <ChevronRight size={14} className="ml-1" />
          </div>
        </div>
      </div>
    </div>
  )
}
