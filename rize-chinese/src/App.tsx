import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Statistics from './pages/Statistics'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import { checkTrackingStatus } from './utils/tracking'
import { checkAuth } from './utils/auth'

function App() {
  const [isTracking, setIsTracking] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查登录状态
    checkAuth().then(auth => {
      setIsLoggedIn(auth)
      setLoading(false)
    })

    // 检查追踪状态
    checkTrackingStatus().then(status => {
      setIsTracking(status)
    })
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>
  }

  if (!isLoggedIn) {
    return (
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="*" element={<Login onLoginSuccess={() => setIsLoggedIn(true)} />} />
          </Routes>
        </div>
      </Router>
    )
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar isTracking={isTracking} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
