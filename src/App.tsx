import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Statistics from './pages/Statistics'
import Planner from './pages/Planner'
import Calendar from './pages/Calendar'
import FocusMode from './pages/FocusMode'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import { checkTrackingStatus } from './utils/tracking'
import { checkAuth } from './utils/auth'

// 主题上下文
export type Theme = 'light' | 'dark'

function App() {
  const [isTracking, setIsTracking] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('merize-theme')
    return (saved as Theme) || 'light'
  })

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
      <Router>
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
          <Routes>
            <Route path="*" element={<Login theme={theme} onLoginSuccess={() => setIsLoggedIn(true)} />} />
          </Routes>
        </div>
      </Router>
    )
  }

  const bgClass = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'

  return (
    <Router>
      <div className={`flex h-screen ${bgClass} transition-colors duration-200`}>
        <Sidebar isTracking={isTracking} theme={theme} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard theme={theme} />} />
            <Route path="/statistics" element={<Statistics theme={theme} />} />
            <Route path="/planner" element={<Planner theme={theme} />} />
            <Route path="/calendar" element={<Calendar theme={theme} />} />
            <Route path="/focus" element={<FocusMode theme={theme} />} />
            <Route path="/settings" element={<Settings theme={theme} toggleTheme={toggleTheme} />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
