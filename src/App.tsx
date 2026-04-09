import React, { Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import { backgroundSkinConfigs } from './config/themes'
import { ToastProvider } from './components/ui/Toast'
import Sidebar from './components/Sidebar'
import Onboarding from './components/Onboarding'

// Re-export types & configs so existing pages importing from '../App' still work
export type { Theme, ColorTheme, BackgroundSkin } from './config/themes'
export { colorThemeConfigs, backgroundSkinConfigs } from './config/themes'

/* ── Lazy-loaded pages ── */
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
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin"
        />
        <span className="text-sm text-[var(--color-text-muted)]">加载中...</span>
      </div>
    </div>
  )
}

/* ── Main app content (inside Router) ── */
function AppContent() {
  const initialize = useAppStore((s) => s.initialize)
  const initialized = useAppStore((s) => s.initialized)
  const isFirstLaunch = useAppStore((s) => s.isFirstLaunch)
  const theme = useAppStore((s) => s.theme)
  const backgroundSkin = useAppStore((s) => s.backgroundSkin)

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          <span className="text-[var(--color-text-muted)] text-sm">Merize 启动中...</span>
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
          </Suspense>
        </main>
      </div>
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
