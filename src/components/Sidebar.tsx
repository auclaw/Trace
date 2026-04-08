import React, { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

/* ── SVG icon helper (1.5px stroke weight per research) ── */
const I = ({ d, size = 20 }: { d: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="flex-shrink-0"
  >
    <path d={d} />
  </svg>
)

interface NavItem {
  key: string
  label: string
  path: string
  icon: React.ReactNode
  end?: boolean
}

const ALL_NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: '仪表盘', path: '/', end: true,
    icon: <I d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z M9 22V12h6v10" /> },
  { key: 'planner', label: '今日计划', path: '/planner',
    icon: <I d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z M9 14l2 2 4-4" /> },
  { key: 'focus', label: '专注模式', path: '/focus',
    icon: <I d="M12 2v4 M12 18v4 M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M2 12h4 M18 12h4 M4.93 19.07l2.83-2.83 M16.24 7.76l2.83-2.83" /> },
  { key: 'calendar', label: '日历', path: '/calendar',
    icon: <I d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18" /> },
  { key: 'statistics', label: '统计', path: '/statistics',
    icon: <I d="M18 20V10 M12 20V4 M6 20v-6" /> },
  { key: 'habits', label: '习惯打卡', path: '/habits',
    icon: <I d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" /> },
  { key: 'pet', label: '宠物', path: '/pet',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M12 21c-4.97 0-9-2.686-9-6s4.03-6 9-6 9 2.686 9 6-4.03 6-9 6z" />
        <circle cx="8" cy="9" r="2" /><circle cx="16" cy="9" r="2" />
        <circle cx="5" cy="5" r="1.5" /><circle cx="19" cy="5" r="1.5" />
      </svg>
    ),
  },
  { key: 'ai-summary', label: 'AI 总结', path: '/ai-summary',
    icon: <I d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" /> },
  { key: 'deep-work-stats', label: '深度工作', path: '/deep-work-stats',
    icon: <I d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /> },
  { key: 'flow-blocks', label: '心流屏蔽', path: '/flow-blocks',
    icon: <I d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
  { key: 'settings', label: '设置', path: '/settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

/* ── Sidebar ── */
export default function Sidebar() {
  const activeModules = useAppStore((s) => s.activeModules)
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const activities = useAppStore((s) => s.activities)
  const location = useLocation()

  const visibleItems = useMemo(
    () => ALL_NAV_ITEMS.filter((item) => activeModules.includes(item.key)),
    [activeModules],
  )

  const todayMinutes = useMemo(
    () => activities.reduce((sum, a) => sum + (a.duration || 0), 0),
    [activities],
  )

  const h = Math.floor(todayMinutes / 60)
  const m = todayMinutes % 60

  return (
    <aside
      className={[
        'group/sidebar relative flex flex-col h-screen overflow-hidden',
        'transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
        sidebarCollapsed ? 'w-[68px] hover:w-[264px]' : 'w-[264px]',
      ].join(' ')}
      style={{
        background: 'var(--color-bg-surface-1)',
        borderRight: '1px solid var(--color-border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* ── Brand / Avatar ── */}
      <div
        className="flex items-center gap-3 px-4 h-[60px] shrink-0 overflow-hidden"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <div
          className="w-9 h-9 rounded-[var(--radius-md)] shrink-0 flex items-center justify-center text-white text-sm font-bold"
          style={{
            background: 'var(--color-accent-gradient, var(--color-accent))',
            boxShadow: 'var(--shadow-accent)',
          }}
        >
          M
        </div>
        <div className={[
          'flex flex-col min-w-0 transition-opacity duration-200',
          sidebarCollapsed ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100',
        ].join(' ')}>
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
            Merize
          </span>
          <span className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>
            演示用户
          </span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        <ul className="flex flex-col gap-0.5">
          {visibleItems.map((item) => {
            const isActive = item.end
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path)

            return (
              <li key={item.key}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  className="relative flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] transition-all duration-150 group/item overflow-hidden"
                  style={{
                    background: isActive ? 'var(--color-accent-soft)' : 'transparent',
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--color-bg-surface-2)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                      style={{
                        height: '55%',
                        background: 'var(--color-accent)',
                      }}
                    />
                  )}

                  <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                    {item.icon}
                  </span>

                  <span className={[
                    'text-[13px] whitespace-nowrap transition-opacity duration-200',
                    isActive ? 'font-semibold' : 'font-medium',
                    sidebarCollapsed ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100',
                  ].join(' ')}>
                    {item.label}
                  </span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Bottom stats ── */}
      <div
        className="shrink-0 px-4 py-3 overflow-hidden"
        style={{ borderTop: '1px solid var(--color-border-subtle)' }}
      >
        <div className="flex items-center gap-2.5">
          {/* Mini progress ring */}
          <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
            <circle cx="9" cy="9" r="7" fill="none" stroke="var(--color-border-subtle)" strokeWidth="2" />
            <circle
              cx="9" cy="9" r="7" fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${Math.min(todayMinutes / 480, 1) * 44} 44`}
              transform="rotate(-90 9 9)"
            />
          </svg>
          <span className={[
            'text-xs whitespace-nowrap transition-opacity duration-200',
            sidebarCollapsed ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100',
          ].join(' ')}
            style={{ color: 'var(--color-text-muted)' }}
          >
            今日{' '}
            <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>
              {h > 0 ? `${h}h ` : ''}{m}m
            </span>
          </span>
        </div>
      </div>

      {/* ── Collapse toggle button ── */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover/sidebar:opacity-100 transition-all duration-200 z-10"
        style={{
          background: 'var(--color-bg-surface-1)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
        aria-label={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
      >
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`}
        >
          <path d="M7 1.5L3 5l4 3.5" />
        </svg>
      </button>
    </aside>
  )
}
