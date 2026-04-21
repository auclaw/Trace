import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3, Clock, ListTodo } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { trackingService } from '../services/trackingService'

// ── Helpers ──

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function greeting(t: (key: string) => string): string {
  const h = new Date().getHours()
  if (h < 6) return t('dashboard.greeting.night')
  if (h < 12) return t('dashboard.greeting.morning')
  if (h < 14) return t('dashboard.greeting.noon')
  if (h < 18) return t('dashboard.greeting.afternoon')
  return t('dashboard.greeting.evening')
}

// ── Main Dashboard ──

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const activities = useAppStore((s) => s.activities)
  const loadActivities = useAppStore((s) => s.loadActivities)

  const tasks = useAppStore((s) => s.tasks)
  const loadTasks = useAppStore((s) => s.loadTasks)

  const dailyGoalMinutes = useAppStore((s) => s.dailyGoalMinutes)

  const [loading, setLoading] = useState(true)

  // Derived stats
  const today = todayStr()
  const todayActivities = activities.filter((a) => a.startTime.slice(0, 10) === today)
  const todayMinutes = Math.round(todayActivities.reduce((sum, a) => sum + (a.duration || 0), 0))
  const goalProgress = dailyGoalMinutes > 0 ? Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100)) : 0

  const pendingTasks = tasks.filter((t) => t.status !== 'completed').length

  // Load data on mount
  useEffect(() => {
    Promise.all([loadActivities(), loadTasks()]).finally(() => setLoading(false))
  }, [loadActivities, loadTasks])

  // Track current activity
  const [currentTracking, setCurrentTracking] = useState(trackingService.getCurrentActivity())

  useEffect(() => {
    const unsubscribe = trackingService.subscribe(() => {
      setCurrentTracking(trackingService.getCurrentActivity())
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-base)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('app.loading')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg-base)' }}>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {greeting(t)} 👋
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t('dashboard.welcomeBack')}
        </p>
      </div>

      {/* ═══ BENTO GRID ROW 1: Stats Cards ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Focus Time - Macaron Blue */}
        <div
          className="p-6 rounded-2xl"
          style={{
            background: '#79BEEB',
            border: '2px solid #5AACDF',
            boxShadow: '4px 4px 0px rgba(121, 190, 235, 0.4)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock size={20} style={{ color: '#2A4A5E' }} />
            <span className="text-sm font-semibold" style={{ color: '#2A4A5E' }}>
              {t('dashboard.todayFocus')}
            </span>
          </div>
          <div className="text-3xl font-bold mb-2" style={{ color: '#2A4A5E' }}>
            {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
          </div>
          <div className="text-xs" style={{ color: '#3D6A7E' }}>
            {goalProgress}% {t('dashboard.ofDailyGoal')}
          </div>
        </div>

        {/* Goal Progress - Macaron Green */}
        <div
          className="p-6 rounded-2xl"
          style={{
            background: '#A8E6CF',
            border: '2px solid #7DD4B0',
            boxShadow: '4px 4px 0px rgba(168, 230, 207, 0.4)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <ListTodo size={20} style={{ color: '#2D5A4A' }} />
            <span className="text-sm font-semibold" style={{ color: '#2D5A4A' }}>
              {t('dashboard.dailyGoal')}
            </span>
          </div>
          <div className="text-3xl font-bold mb-2" style={{ color: '#2D5A4A' }}>
            {goalProgress}%
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: '#D4F5E5' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${goalProgress}%`, background: '#4A8A6E' }}
            />
          </div>
        </div>

        {/* Activities - Neutral Gray (Style A2) */}
        <div
          className="p-6 rounded-2xl"
          style={{
            background: '#FFFFFF',
            border: '2px solid #D6D3CD',
            boxShadow: '4px 4px 0px #D6D3CD',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={20} color="#5C5658" />
            <span className="text-sm font-semibold" style={{ color: '#5C5658' }}>
              {t('dashboard.activities')}
            </span>
          </div>
          <div className="text-3xl font-bold mb-2" style={{ color: '#3A3638' }}>
            {todayActivities.length}
          </div>
          <div className="text-xs" style={{ color: '#9E9899' }}>
            {t('dashboard.today')}
          </div>
        </div>

        {/* Streak - Macaron Lemon */}
        <div
          className="p-6 rounded-2xl"
          style={{
            background: '#FFD3B6',
            border: '2px solid #FFBB8E',
            boxShadow: '4px 4px 0px rgba(255, 211, 182, 0.4)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🔥</span>
            <span className="text-sm font-semibold" style={{ color: '#7A5A4A' }}>
              {t('dashboard.streak')}
            </span>
          </div>
          <div className="text-3xl font-bold mb-2" style={{ color: '#7A5A4A' }}>
            7 {t('dashboard.days')}
          </div>
          <div className="text-xs" style={{ color: '#8A6A5A' }}>
            {t('dashboard.keepItUp')}
          </div>
        </div>
      </div>

      {/* ═══ BENTO GRID ROW 2: Quick Navigation (Style A2 - Neutral) ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Timeline Card */}
        <div
          className="p-6 rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => navigate('/timeline')}
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
            <Clock size={18} style={{ color: '#79BEEB' }} />
          </div>
          <h3 className="text-base font-semibold mb-2" style={{ color: '#3A3638' }}>
            {t('dashboard.timeline')}
          </h3>
          <p className="text-sm mb-4" style={{ color: '#9E9899' }}>
            {t('dashboard.viewTimeline')}
          </p>
          <div className="text-xs font-semibold" style={{ color: '#79BEEB' }}>
            {t('common.open')} →
          </div>
        </div>

        {/* Tasks Card */}
        <div
          className="p-6 rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => navigate('/task')}
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
            <ListTodo size={18} style={{ color: '#A8E6CF' }} />
          </div>
          <h3 className="text-base font-semibold mb-2" style={{ color: '#3A3638' }}>
            {t('tasks.title')}
          </h3>
          <p className="text-sm mb-4" style={{ color: '#9E9899' }}>
            {t('dashboard.manageTasks')}
          </p>
          <div className="text-xs font-semibold" style={{ color: '#A8E6CF' }}>
            {pendingTasks} {t('dashboard.pending')}
          </div>
        </div>

        {/* Analytics Card */}
        <div
          className="p-6 rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => navigate('/analytics')}
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
            <BarChart3 size={18} style={{ color: '#FFD3B6' }} />
          </div>
          <h3 className="text-base font-semibold mb-2" style={{ color: '#3A3638' }}>
            {t('dashboard.analytics')}
          </h3>
          <p className="text-sm mb-4" style={{ color: '#9E9899' }}>
            {t('dashboard.viewReports')}
          </p>
          <div className="text-xs font-semibold" style={{ color: '#FFD3B6' }}>
            {t('common.viewDetails')} →
          </div>
        </div>
      </div>

      {/* ═══ BENTO GRID ROW 3: Tracking Banner (Macaron Blue) ═══ */}
      {trackingService.isTracking() && currentTracking && (
        <div
          className="p-6 rounded-2xl mb-6"
          style={{
            background: 'linear-gradient(135deg, #79BEEB 0%, #5AACDF 100%)',
            border: '2px solid #79BEEB',
            boxShadow: '4px 4px 0px rgba(121, 190, 235, 0.4)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ background: '#EF4444' }}
              />
              <div>
                <div className="font-semibold" style={{ color: '#2A4A5E' }}>
                  {currentTracking.name}
                </div>
                <div className="text-sm" style={{ color: '#3D6A7E' }}>
                  {currentTracking.category}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/timeline')}
              className="px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
              style={{
                background: '#2A4A5E',
                color: 'white',
              }}
            >
              {t('dashboard.viewDetails')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
