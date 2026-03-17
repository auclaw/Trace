import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Statistics from './pages/Statistics'
import Sidebar from './components/Sidebar'
import { checkTrackingStatus } from './utils/tracking'

function App() {
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    // 检查追踪状态
    checkTrackingStatus().then(status => {
      setIsTracking(status)
    })
  }, [])

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
