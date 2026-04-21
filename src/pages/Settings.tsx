import { useState } from 'react'
import {
  User,
  CreditCard,
  Users,
  Palette,
  Target,
  Timer,
  Activity,
  Coffee,
  Tag,
  Calendar,
  Zap,
  BarChart3,
  Download,
  Key,
  ChevronRight,
  Moon,
  Sun,
  Trash2,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

// Setting sections with grouped navigation
const SETTING_SECTIONS = [
  {
    group: 'ACCOUNT & BILLING',
    items: [
      { key: 'account', label: 'Account', icon: User, color: '#79BEEB' },
      { key: 'billing', label: 'Billing', icon: CreditCard, color: '#79BEEB' },
      { key: 'members', label: 'Members', icon: Users, color: '#79BEEB' },
    ],
  },
  {
    group: 'APPEARANCE',
    items: [
      { key: 'theme', label: 'Theme', icon: Palette, color: '#A8E6CF' },
    ],
  },
  {
    group: 'TRACKING',
    items: [
      { key: 'dailyGoal', label: 'Daily Goal', icon: Target, color: '#D4C4FB' },
      { key: 'focus', label: 'Focus Timer', icon: Timer, color: '#FFD3B6' },
      { key: 'activity', label: 'Activity', icon: Activity, color: '#FF8C82' },
      { key: 'categories', label: 'Categories', icon: Tag, color: '#9E9899' },
    ],
  },
  {
    group: 'PRODUCTIVITY',
    items: [
      { key: 'breaks', label: 'Breaks', icon: Coffee, color: '#79BEEB' },
      { key: 'coach', label: 'AI Coach', icon: Zap, color: '#A8E6CF' },
    ],
  },
  {
    group: 'INTEGRATIONS & DATA',
    items: [
      { key: 'calendar', label: 'Calendar', icon: Calendar, color: '#D4C4FB' },
      { key: 'export', label: 'Data Export', icon: Download, color: '#FFD3B6' },
      { key: 'api', label: 'API', icon: Key, color: '#FF8C82' },
    ],
  },
]

// Default categories data
const DEFAULT_CATEGORIES = [
  { name: 'Work', color: '#79BEEB', enabled: true },
  { name: 'Meeting', color: '#D4C4FB', enabled: true },
  { name: 'Break', color: '#A8E6CF', enabled: true },
  { name: 'Learning', color: '#FFD3B6', enabled: true },
  { name: 'Other', color: '#9E9899', enabled: true },
]

export default function Settings() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const dailyGoalMinutes = useAppStore((s) => s.dailyGoalMinutes)
  const setDailyGoalMinutes = useAppStore((s) => s.setDailyGoalMinutes)
  const focusSettings = useAppStore((s) => s.focusSettings)
  const updateFocusSettings = useAppStore((s) => s.updateFocusSettings)

  const [activeSection, setActiveSection] = useState<string>('account')
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [autoAcceptThreshold, setAutoAcceptThreshold] = useState(95)
  const [minEntryMinutes, setMinEntryMinutes] = useState(15)

  const toggleCategory = (index: number) => {
    const newCategories = [...categories]
    newCategories[index].enabled = !newCategories[index].enabled
    setCategories(newCategories)
  }

  // Render section content based on active key
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: '#FFFFFF',
                border: '2px solid #D6D3CD',
                boxShadow: '4px 4px 0px #D6D3CD',
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: '#3A3638' }}>
                Profile
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: '#79BEEB' }}
                >
                  <User size={28} color="white" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#3A3638' }}>Alex Trace</p>
                  <p className="text-xs" style={{ color: '#9E9899' }}>Pro Account</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #E8E6E1' }}>
                  <span className="text-sm" style={{ color: '#5C5658' }}>Email</span>
                  <span className="text-sm font-medium" style={{ color: '#3A3638' }}>alex@trace.ai</span>
                </div>
                <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #E8E6E1' }}>
                  <span className="text-sm" style={{ color: '#5C5658' }}>Member Since</span>
                  <span className="text-sm font-medium" style={{ color: '#3A3638' }}>April 2026</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'billing':
        return (
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: '#FFFFFF',
                border: '2px solid #D6D3CD',
                boxShadow: '4px 4px 0px #D6D3CD',
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: '#3A3638' }}>
                Subscription
              </h3>
              <div className="p-4 rounded-xl mb-4" style={{ background: '#D4C4FB20', border: '2px solid #D4C4FB' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: '#4A3A6A' }}>Pro Plan</span>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#A8E6CF', color: '#2D5A4A' }}>
                    Active
                  </span>
                </div>
                <p className="text-xs" style={{ color: '#6A5A8A' }}>$12.99 / month · Renews May 1, 2026</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #E8E6E1' }}>
                  <span className="text-sm" style={{ color: '#5C5658' }}>Next Billing</span>
                  <span className="text-sm font-medium" style={{ color: '#3A3638' }}>May 1, 2026</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm" style={{ color: '#5C5658' }}>Payment Method</span>
                  <span className="text-sm font-medium" style={{ color: '#3A3638' }}>•••• 4242</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'theme':
        return (
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: '#FFFFFF',
                border: '2px solid #D6D3CD',
                boxShadow: '4px 4px 0px #D6D3CD',
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: '#3A3638' }}>
                Appearance
              </h3>
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9E9899' }}>
                  Theme
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'light', label: 'Light', icon: Sun },
                    { key: 'dark', label: 'Dark', icon: Moon },
                  ].map((option) => {
                    const Icon = option.icon
                    const isActive = theme === option.key
                    return (
                      <button
                        key={option.key}
                        onClick={() => setTheme(option.key as 'light' | 'dark')}
                        className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all"
                        style={{
                          background: isActive ? '#79BEEB20' : '#F5F1EA',
                          border: isActive ? '2px solid #79BEEB' : '2px solid transparent',
                        }}
                      >
                        <Icon size={20} style={{ color: isActive ? '#79BEEB' : '#9E9899' }} />
                        <span className="text-xs font-semibold" style={{ color: isActive ? '#79BEEB' : '#5C5658' }}>
                          {option.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )

      case 'dailyGoal':
        return (
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: '#FFFFFF',
                border: '2px solid #D6D3CD',
                boxShadow: '4px 4px 0px #D6D3CD',
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: '#3A3638' }}>
                Daily Focus Goal
              </h3>
              <p className="text-sm mb-6" style={{ color: '#9E9899' }}>
                Set your daily target for focused work time
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="30"
                  max="480"
                  step="15"
                  value={dailyGoalMinutes}
                  onChange={(e) => setDailyGoalMinutes(parseInt(e.target.value))}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: '#F5F1EA' }}
                />
                <div
                  className="px-4 py-2 rounded-xl text-center min-w-[100px]"
                  style={{ background: '#A8E6CF30', border: '2px solid #A8E6CF' }}
                >
                  <span className="text-lg font-bold" style={{ color: '#2D5A4A' }}>
                    {Math.floor(dailyGoalMinutes / 60)}h {dailyGoalMinutes % 60}m
                  </span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'focus':
        return (
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: '#FFFFFF',
                border: '2px solid #D6D3CD',
                boxShadow: '4px 4px 0px #D6D3CD',
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: '#3A3638' }}>
                Pomodoro Timer Settings
              </h3>
              <div className="space-y-4">
                {[
                  { key: 'workMinutes', label: 'Work Duration', options: [15, 20, 25, 30, 45, 60], suffix: 'min' },
                  { key: 'breakMinutes', label: 'Short Break', options: [3, 5, 7, 10, 15], suffix: 'min' },
                  { key: 'longBreakMinutes', label: 'Long Break', options: [10, 15, 20, 25, 30], suffix: 'min' },
                  { key: 'longBreakInterval', label: 'Long Break After', options: [2, 3, 4, 5, 6], suffix: 'sessions' },
                ].map(({ key, label, options, suffix }) => (
                  <div key={key} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #E8E6E1' }}>
                    <span className="text-sm" style={{ color: '#5C5658' }}>
                      {label}
                    </span>
                    <select
                      value={(focusSettings as any)[key]}
                      onChange={(e) => updateFocusSettings({ [key]: parseInt(e.target.value) })}
                      className="px-3 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: '#F5F1EA', color: '#3A3638', border: 'none', outline: 'none' }}
                    >
                      {options.map((m) => (
                        <option key={m} value={m}>{m} {suffix}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'categories':
        return (
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: '#FFFFFF',
                border: '2px solid #D6D3CD',
                boxShadow: '4px 4px 0px #D6D3CD',
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: '#3A3638' }}>
                Activity Categories
              </h3>
              <p className="text-sm mb-4" style={{ color: '#9E9899' }}>
                Enable or disable categories for activity tracking
              </p>
              <div className="space-y-3">
                {categories.map((cat, index) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: '#F5F1EA' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                      <span className="text-sm font-medium" style={{ color: '#3A3638' }}>{cat.name}</span>
                    </div>
                    <button
                      onClick={() => toggleCategory(index)}
                      className="w-10 h-5 rounded-full transition-all flex items-center px-0.5"
                      style={{ background: cat.enabled ? '#A8E6CF' : '#E8E6E1' }}
                    >
                      <div
                        className="w-4 h-4 rounded-full bg-white transition-all shadow-sm"
                        style={{ transform: cat.enabled ? 'translateX(20px)' : 'translateX(0)' }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'activity':
        return (
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: '#FFFFFF',
                border: '2px solid #D6D3CD',
                boxShadow: '4px 4px 0px #D6D3CD',
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: '#3A3638' }}>
                Activity Tracking Settings
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl mb-4" style={{ background: '#FAF7F2' }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#3A3638' }}>
                    Auto-Accept Tag Suggestions
                  </p>
                  <p className="text-xs mb-3" style={{ color: '#9E9899' }}>
                    Automatically accept AI suggestions above this confidence level
                  </p>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="5"
                      value={autoAcceptThreshold}
                      onChange={(e) => setAutoAcceptThreshold(parseInt(e.target.value))}
                      className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                      style={{ background: '#E8E6E1' }}
                    />
                    <span className="text-sm font-bold w-12 text-right" style={{ color: '#A8E6CF' }}>
                      {autoAcceptThreshold}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #E8E6E1' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#3A3638' }}>Minimum Time Entry</p>
                    <p className="text-xs" style={{ color: '#9E9899' }}>Minimum minutes required for a time entry</p>
                  </div>
                  <select
                    value={minEntryMinutes}
                    onChange={(e) => setMinEntryMinutes(parseInt(e.target.value))}
                    className="px-3 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: '#F5F1EA', color: '#3A3638', border: 'none', outline: 'none' }}
                  >
                    {[1, 5, 10, 15, 30].map((m) => (
                      <option key={m} value={m}>{m} minutes</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )

      case 'export':
        return (
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: '#FFFFFF',
                border: '2px solid #D6D3CD',
                boxShadow: '4px 4px 0px #D6D3CD',
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: '#3A3638' }}>
                Data Export
              </h3>
              <p className="text-sm mb-6" style={{ color: '#9E9899' }}>
                Download all your activity data in various formats
              </p>
              <div className="space-y-3">
                <button
                  className="w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.01]"
                  style={{ background: '#79BEEB20' }}
                >
                  <Download size={18} style={{ color: '#79BEEB' }} />
                  <div className="flex-1 text-left">
                    <span className="text-sm font-semibold" style={{ color: '#3A3638' }}>
                      Export as JSON
                    </span>
                    <p className="text-xs" style={{ color: '#9E9899' }}>
                      Full structured data export
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: '#79BEEB' }} />
                </button>
                <button
                  className="w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.01]"
                  style={{ background: '#A8E6CF20' }}
                >
                  <Download size={18} style={{ color: '#A8E6CF' }} />
                  <div className="flex-1 text-left">
                    <span className="text-sm font-semibold" style={{ color: '#3A3638' }}>
                      Export as CSV
                    </span>
                    <p className="text-xs" style={{ color: '#9E9899' }}>
                      Spreadsheet compatible format
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: '#A8E6CF' }} />
                </button>
                <button
                  className="w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.01]"
                  style={{ background: '#FF8C8220' }}
                >
                  <Trash2 size={18} style={{ color: '#FF8C82' }} />
                  <div className="flex-1 text-left">
                    <span className="text-sm font-semibold" style={{ color: '#3A3638' }}>
                      Clear All Data
                    </span>
                    <p className="text-xs" style={{ color: '#9E9899' }}>
                      Permanently delete all your activity history
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: '#FF8C82' }} />
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div
            className="p-12 rounded-2xl text-center"
            style={{
              background: '#FFFFFF',
              border: '2px solid #D6D3CD',
              boxShadow: '4px 4px 0px #D6D3CD',
            }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: '#F5F1EA' }}>
              <BarChart3 size={28} style={{ color: '#9E9899' }} />
            </div>
            <h3 className="text-base font-semibold mb-2" style={{ color: '#3A3638' }}>
              Coming Soon
            </h3>
            <p className="text-sm" style={{ color: '#9E9899' }}>
              This feature is being developed and will be available in the next update.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="flex h-full" style={{ background: 'var(--color-bg-base)' }}>
      {/* Left Sidebar - Navigation */}
      <div
        className="w-56 flex-shrink-0 p-4 overflow-y-auto"
        style={{
          background: '#FFFFFF',
          borderRight: '2px solid #D6D3CD',
        }}
      >
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#9E9899' }}>
            Settings
          </h2>
        </div>

        {SETTING_SECTIONS.map((group, groupIndex) => (
          <div key={group.group} className={groupIndex > 0 ? 'mt-6' : ''}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: '#9E9899' }}>
              {group.group}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                    style={{
                      background: isActive ? `${item.color}20` : 'transparent',
                      color: isActive ? item.color : '#5C5658',
                    }}
                  >
                    <Icon size={16} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          <div className="mb-6">
            <h1 className="text-xl font-bold mb-1" style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}>
              {SETTING_SECTIONS.flatMap(g => g.items).find(i => i.key === activeSection)?.label || 'Settings'}
            </h1>
          </div>
          {renderSectionContent()}
        </div>
      </div>
    </div>
  )
}
