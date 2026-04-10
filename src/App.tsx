import React, { Suspense, useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import { backgroundSkinConfigs } from './config/themes'
import { ToastProvider } from './components/ui/Toast'
import Sidebar from './components/Sidebar'
import Onboarding from './components/Onboarding'
import PetMiniWidget from './components/PetMiniWidget'
import FocusStatusIndicator from './components/FocusStatusIndicator'
import FocusStartedModal from './components/FocusStartedModal'
import FocusCompletedModal from './components/FocusCompletedModal'
import DailyGoalAchievedModal from './components/DailyGoalAchievedModal'
import { trackingService } from './services/trackingService'

// Re-export types & configs so existing pages importing from '../App' still work
export type { Theme, ColorTheme, BackgroundSkin } from './config/themes'
export { colorThemeConfigs, backgroundSkinConfigs } from './config/themes'

/* ─ Lazy-loaded pages ── */
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Timeline = React.lazy(() => import('./pages/Timeline'))
const Planner = React.lazy(() => import('./pages/Planner'))
const FocusMode = React.lazy(() => import('./pages/FocusMode'))
const Statistics = React.lazy(() => import('./pages/Statistics'))
const Habits = React.lazy(() => import('./pages/Habits'))
const VirtualPet = React.lazy(() => import('./pages/VirtualPet'))
const Settings = React.lazy(() => import('./pages/Settings'))

/* ── Loading fallback ── */
function PageLoader() {
  const { t } = useTranslation()
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin"
        />
        <span className="text-sm text-[var(--color-text-muted)]">{t('app.pageLoading')}</span>
      </div>
    </div>
  )
}

/* ── Pet widget that hides on /pet page ── */
function PetWidgetWrapper() {
  const location = useLocation()
  if (location.pathname === '/pet') return null
  return <PetMiniWidget />
}

/* ── Focus session popup orchestrator ── */
import type { AppState, Activity } from './store/useAppStore'
function FocusPopupManager() {
  const focusState = useAppStore((s: AppState) => s.focusState)
  const focusSessions = useAppStore((s: AppState) => s.focusSessions)
  const focusSettings = useAppStore((s: AppState) => s.focusSettings)
  const activities = useAppStore((s: AppState) => s.activities)
  const dailyGoalMinutes = useAppStore((s: AppState) => s.dailyGoalMinutes)
  const navigate = useNavigate()

  const [showStarted, setShowStarted] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [showGoalAchieved, setShowGoalAchieved] = useState(false)
  const [completedStats, setCompletedStats] = useState({ minutes: 0, sessions: 0, xp: 0, coins: 0 })

  const prevFocusState = useRef(focusState)
  const goalAchievedShown = useRef(false)

  // Show "started" modal when transitioning from idle → working
  useEffect(() => {
    if (prevFocusState.current === 'idle' && focusState === 'working') {
      setShowStarted(true)
    }
    // Show "completed" modal when a work session ends (working → break/longBreak)
    if (prevFocusState.current === 'working' && (focusState === 'break' || focusState === 'longBreak')) {
      const mins = focusSettings.workMinutes
      setCompletedStats({
        minutes: mins,
        sessions: focusSessions,
        xp: mins,
        coins: Math.floor(mins / 5),
      })
      setShowCompleted(true)
    }
    prevFocusState.current = focusState
  }, [focusState, focusSessions, focusSettings.workMinutes])

  // Check daily goal achievement
  useEffect(() => {
    if (goalAchievedShown.current) return
    const todayMinutes = activities.reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0)
    if (todayMinutes >= dailyGoalMinutes && dailyGoalMinutes > 0) {
      goalAchievedShown.current = true
      // Delay slightly to not overlap with focus completed modal
      setTimeout(() => setShowGoalAchieved(true), 1500)
    }
  }, [activities, dailyGoalMinutes])

  return (
    <>
      <FocusStartedModal
        isOpen={showStarted}
        onClose={() => setShowStarted(false)}
        onViewSession={() => navigate('/focus')}
      />
      <FocusCompletedModal
        isOpen={showCompleted}
        onClose={() => setShowCompleted(false)}
        sessionMinutes={completedStats.minutes}
        totalSessions={completedStats.sessions}
        xpGained={completedStats.xp}
        coinsGained={completedStats.coins}
      />
      <DailyGoalAchievedModal
        isOpen={showGoalAchieved}
        onClose={() => setShowGoalAchieved(false)}
        totalMinutes={activities.reduce((sum, a) => sum + (a.duration || 0), 0)}
        goalMinutes={dailyGoalMinutes}
      />
    </>
  )
}

/* ── Main app content (inside Router) ── */
function AppContent() {
  const initialize = useAppStore((s: AppState) => s.initialize)
  const initialized = useAppStore((s: AppState) => s.initialized)
  const isFirstLaunch = useAppStore((s: AppState) => s.isFirstLaunch)
  const theme = useAppStore((s: AppState) => s.theme)
  const backgroundSkin = useAppStore((s: AppState) => s.backgroundSkin)
  const location = useLocation()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Start AI tracking service when app initializes
  useEffect(() => {
    if (initialized && !isFirstLaunch) {
      trackingService.start()
      return () => { trackingService.stop() }
    }
  }, [initialized, isFirstLaunch])

  if (!initialized) {
    const { t } = useTranslation()
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          <span className="text-[var(--color-text-muted)] text-sm">{t('app.loading')}</span>
        </div>
      </div>
    )
  }

  const bgClass = backgroundSkinConfigs[backgroundSkin].getBgClass(theme === 'dark')

  return (
    <>
      {isFirstLaunch && <Onboarding />}
      <div
        className={`flex h-screen ${bgClass} transition-colors duration-300 ${
          backgroundSkin === 'glass' ? 'glass-mode' : ''
        }`}
      >
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<PageLoader />}>
            <div key={location.pathname} className="page-transition">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/focus" element={<FocusMode />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/pet" element={<VirtualPet />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </div>
          </Suspense>
        </main>
      </div>
      <PetWidgetWrapper />
      <FocusStatusIndicator />
      <FocusPopupManager />
    </>
  )
}

/* ── Root ── */
export default function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  )
}
