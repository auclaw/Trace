import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Statistics from './pages/Statistics'
import Planner from './pages/Planner'
import Calendar from './pages/Calendar'
import FocusMode from './pages/FocusMode'
import StylePreview from './pages/StylePreview'
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

// 颜色主题选项 - 多种彩色方案供用户选择
export type ColorTheme = 'blue' | 'green' | 'purple' | 'orange' | 'pink'

export interface ColorThemeConfig {
  name: string
  accent: string
  accentSoft: string
  description: string
}

export const colorThemeConfigs: Record<ColorTheme, ColorThemeConfig> = {
  blue: {
    name: '清爽天蓝',
    accent: '#5aa9e6',
    accentSoft: 'rgba(90, 169, 230, 0.15)',
    description: '干净清爽，适合长时间工作',
  },
  green: {
    name: '自然翠绿',
    accent: '#34c759',
    accentSoft: 'rgba(52, 199, 89, 0.15)',
    description: '清新自然，缓解视觉疲劳',
  },
  purple: {
    name: '优雅紫调',
    accent: '#af52de',
    accentSoft: 'rgba(175, 82, 222, 0.15)',
    description: '优雅知性，适合创意工作',
  },
  orange: {
    name: '活力橙黄',
    accent: '#ff9500',
    accentSoft: 'rgba(255, 149, 0, 0.15)',
    description: '充满活力，提升专注力',
  },
  pink: {
    name: '柔粉樱花',
    accent: '#ff2d55',
    accentSoft: 'rgba(255, 45, 85, 0.15)',
    description: '柔美清新，女生最爱',
  },
}

// 背景皮肤/模式 - 不同整体风格
export type BackgroundSkin = 'gradient' | 'solid' | 'glass'

export interface BackgroundSkinConfig {
  name: string
  description: string
  getBgClass: (isDark: boolean) => string
}

export const backgroundSkinConfigs: Record<BackgroundSkin, BackgroundSkinConfig> = {
  gradient: {
    name: '通透渐变',
    description: '柔和渐变背景 + 纯白卡片，现代 SaaS 风格（参考 Prodigy 设计）',
    getBgClass: (isDark: boolean) => {
      return isDark ? 'bg-gradient-to-br from-aether-dark-100 to-[#1a1a2e]' : 'bg-gradient-to-br from-[#f8f8ff] to-[#f0f5ff]'
    }
  },
  solid: {
    name: '纯净纯色',
    description: '纯色背景干净简洁，传统简约风格',
    getBgClass: (isDark: boolean) => {
      return isDark ? 'bg-aether-dark-100' : 'bg-aether-100'
    }
  },
  glass: {
    name: '玻璃拟态',
    description: '半透明磨砂效果，新潮玻璃风格',
    getBgClass: (isDark: boolean) => {
      return isDark ? 'bg-gradient-to-br from-aether-dark-100 to-[#1a1a2e]' : 'bg-gradient-to-br from-[#f8f8ff] to-[#f0f5ff]'
    }
  },
}

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
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem('merize-color-theme')
    return (saved as ColorTheme) || 'orange'
  })
  const [backgroundSkin, setBackgroundSkin] = useState<BackgroundSkin>(() => {
    const saved = localStorage.getItem('merize-background-skin')
    return (saved as BackgroundSkin) || 'gradient'
  })
  const [showTour, setShowTour] = useState(() => {
    // Only show on first visit
    const tourCompleted = localStorage.getItem('merize-onboarding-completed')
    return getFeatureFlag('onboardingTour') && !tourCompleted
  })

  // 立即应用保存的颜色主题，保证第一次渲染就是正确的
  const initialConfig = colorThemeConfigs[colorTheme]
  document.documentElement.style.setProperty('--color-accent', initialConfig.accent)
  document.documentElement.style.setProperty('--color-accent-soft', initialConfig.accentSoft)

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

  useEffect(() => {
    // 保存颜色主题选择
    localStorage.setItem('merize-color-theme', colorTheme)
    // 应用 CSS 变量
    const config = colorThemeConfigs[colorTheme]
    document.documentElement.style.setProperty('--color-accent', config.accent)
    document.documentElement.style.setProperty('--color-accent-soft', config.accentSoft)
  }, [colorTheme])

  useEffect(() => {
    // 保存背景皮肤选择
    localStorage.setItem('merize-background-skin', backgroundSkin)
  }, [backgroundSkin])

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
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-aether-dark-100' : 'bg-aether-100'} flex items-center justify-center transition-colors duration-300`}>
        <div className={theme === 'dark' ? 'text-aether-text-dark-secondary' : 'text-aether-text-secondary'}>加载中...</div>
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

  // 根据选择的皮肤获取背景类
  const bgClass = backgroundSkinConfigs[backgroundSkin].getBgClass(theme === 'dark')

  const handleToggleTracking = async (newStatus: boolean) => {
    setIsTracking(newStatus)
  }

  return (
    <div className={`flex h-screen ${bgClass} transition-colors duration-300 ${backgroundSkin === 'glass' ? 'glass-mode' : ''}`}>
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
          <Route path="/settings" element={<Settings theme={theme} toggleTheme={toggleTheme} colorTheme={colorTheme} onColorThemeChange={setColorTheme} backgroundSkin={backgroundSkin} onBackgroundSkinChange={setBackgroundSkin} isTracking={isTracking} onTrackingChange={setIsTracking} />} />
          <Route path="/style-preview" element={<StylePreview />} />
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
