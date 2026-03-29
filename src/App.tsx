import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Statistics from './pages/Statistics'
import Planner from './pages/Planner'
import Calendar from './pages/Calendar'
import FocusMode from './pages/FocusMode'
import Login from './pages/Login'
import OrgAdmin from './pages/OrgAdmin'
import TeamDashboard from './pages/TeamDashboard'
import WeeklyApproval from './pages/WeeklyApproval'
import Habits from './pages/Habits'
import FlowBlocks from './pages/FlowBlocks'
import TeamFocus from './pages/TeamFocus'
import AiSummary from './pages/AiSummary'
import DeepWorkStats from './pages/DeepWorkStats'
import Sidebar from './components/Sidebar'
import OnboardingTour, { getDefaultTourSteps } from './components/OnboardingTour'
import { checkTrackingStatus, toggleTracking } from './utils/tracking'
import { checkAuth } from './utils/auth'
import { getFeatureFlag } from './utils/feature-flags'

// 主题上下文
export type Theme = 'light' | 'dark'

// AppContent 需要在 Router 内部才能使用 useNavigate
function AppContent() {
  const navigate = useNavigate()
  const [isTracking, setIsTracking] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('merize-theme')
    return (saved as Theme) || 'light'
  })
  const [showTour, setShowTour] = useState(() => {
    // Only show on first visit
    const tourCompleted = localStorage.getItem('merize-onboarding-completed')
    return getFeatureFlag('onboardingTour') && !tourCompleted
  })

  const handleTourComplete = () => {
    localStorage.setItem('merize-onboarding-completed', 'true')
    setShowTour(false)
  }

  const handleTourSkip = () => {
    localStorage.setItem('merize-onboarding-completed', 'true')
    setShowTour(false)
  }

  useEffect(() => {
    // 保存主题选择
    localStorage.setItem('merize-theme', theme)
    // 应用到 html
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  useEffect(() => {
    // 检查认证状态
    checkAuth().then(authStatus => {
      setIsLoggedIn(authStatus)
      setLoading(false)
    })
    // 检查追踪状态
    checkTrackingStatus().then(status => {
      setIsTracking(status)
    })
  }, [])

  // 全局键盘快捷键监听
  useEffect(() => {
    // 如果功能开关关闭，不监听
    if (!getFeatureFlag('keyboardShortcuts')) {
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // 只有当窗口有焦点时才处理
      if (!document.hasFocus()) return

      // 如果焦点在输入框、文本框、或者 contenteditable 元素，不处理快捷键
      const activeElement = document.activeElement
      if (activeElement) {
        const tagName = activeElement.tagName.toLowerCase()
        if (tagName === 'input' || tagName === 'textarea' ||
            (activeElement as HTMLElement).isContentEditable) {
          return
        }
      }

      // Space: 切换追踪暂停/继续
      if (e.code === 'Space') {
        e.preventDefault()
        const newStatus = !isTracking
        toggleTracking(newStatus).then(() => {
          setIsTracking(newStatus)
        }).catch(err => {
          console.error('Failed to toggle tracking:', err)
        })
        return
      }

      // n: 导航到计划页（新建任务）
      if (e.key === 'n') {
        navigate('/planner')
        return
      }

      // d: 导航到仪表盘
      if (e.key === 'd') {
        navigate('/')
        return
      }

      // s: 导航到设置
      if (e.key === 's') {
        navigate('/settings')
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isTracking, navigate])

  // 等待认证检查完成
  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center transition-colors duration-200`}>
        <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>加载中...</div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="*" element={<Login theme={theme} onLoginSuccess={() => setIsLoggedIn(true)} />} />
      </Routes>
    )
  }

  const bgClass = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'

  const handleToggleTracking = async (newStatus: boolean) => {
    setIsTracking(newStatus)
  }

  return (
    <div className={`flex h-screen ${bgClass} transition-colors duration-200`}>
      <Sidebar isTracking={isTracking} theme={theme} onToggleTracking={handleToggleTracking} />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard theme={theme} isTracking={isTracking} onTrackingChange={setIsTracking} />} />
          <Route path="/statistics" element={<Statistics theme={theme} />} />
          <Route path="/planner" element={<Planner theme={theme} />} />
          <Route path="/calendar" element={<Calendar theme={theme} />} />
          <Route path="/focus" element={<FocusMode theme={theme} />} />
          <Route path="/org-admin" element={<OrgAdmin theme={theme} />} />
          <Route path="/team-dashboard" element={<TeamDashboard theme={theme} />} />
          <Route path="/approval" element={<WeeklyApproval theme={theme} />} />
          <Route path="/habits" element={<Habits theme={theme} />} />
          <Route path="/flow-blocks" element={<FlowBlocks theme={theme} />} />
          <Route path="/team-focus" element={<TeamFocus theme={theme} />} />
          <Route path="/ai-summary" element={<AiSummary theme={theme} />} />
          <Route path="/deep-work-stats" element={<DeepWorkStats theme={theme} />} />
          <Route path="/settings" element={<Settings theme={theme} toggleTheme={toggleTheme} isTracking={isTracking} onTrackingChange={setIsTracking} />} />
        </Routes>
      </main>
      <OnboardingTour
        steps={getDefaultTourSteps()}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
        isOpen={showTour && getFeatureFlag('onboardingTour')}
      />
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
