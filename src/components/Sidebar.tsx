import React, { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Clock,
  ClipboardList,
  Target,
  CheckCircle2,
  LineChart,
  Cat,
  Settings,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { AppState, Activity } from '../store/useAppStore'

interface NavItem {
  key: string
  i18nKey: string
  path: string
  icon: React.ReactNode
  end?: boolean
}

const ALL_NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', i18nKey: 'nav.dashboard', path: '/', end: true,
    icon: <LayoutDashboard size={16} strokeWidth={2} /> },
  { key: 'timeline', i18nKey: 'nav.timeline', path: '/timeline',
    icon: <Clock size={16} strokeWidth={2} /> },
  { key: 'planner', i18nKey: 'nav.planner', path: '/planner',
    icon: <ClipboardList size={16} strokeWidth={2} /> },
  { key: 'focus', i18nKey: 'nav.focus', path: '/focus',
    icon: <Target size={16} strokeWidth={2} /> },
  { key: 'habits', i18nKey: 'nav.habits', path: '/habits',
    icon: <CheckCircle2 size={16} strokeWidth={2} /> },
  { key: 'statistics', i18nKey: 'nav.statistics', path: '/statistics',
    icon: <LineChart size={16} strokeWidth={2} /> },
  { key: 'pet', i18nKey: 'nav.pet', path: '/pet',
    icon: <Cat size={16} strokeWidth={2} /> },
  { key: 'settings', i18nKey: 'nav.settings', path: '/settings',
    icon: <Settings size={16} strokeWidth={2} /> },
]

/* ── Sidebar ── */
export default function Sidebar() {
  const { t } = useTranslation()
  const activeModules = useAppStore((s: AppState) => s.activeModules)
  const sidebarCollapsed = useAppStore((s: AppState) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s: AppState) => s.toggleSidebar)
  const activities = useAppStore((s: AppState) => s.activities)
  const location = useLocation()

  const visibleItems = useMemo(
    () => ALL_NAV_ITEMS.filter((item) => activeModules.includes(item.key)),
    [activeModules],
  )

  const todayMinutes = useMemo(
    () => activities.reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0),
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
        background: 'linear-gradient(180deg, var(--color-bg-surface-1) 0%, var(--color-bg-surface-2) 100%)',
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
          T
        </div>
        <div className={[
          'flex flex-col min-w-0 transition-opacity duration-200',
          sidebarCollapsed ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100',
        ].join(' ')}>
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
            时迹 Trace
          </span>
          <span className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>
            {t('app.demoUser')}
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
                      e.currentTarget.style.background = 'var(--color-accent-soft)'
                      e.currentTarget.style.boxShadow = '0 0 8px var(--color-accent-soft)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                      style={{
                        height: '55%',
                        background: 'var(--color-accent-gradient, var(--color-accent))',
                        boxShadow: '2px 0 8px var(--color-accent-soft)',
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
                    {t(item.i18nKey)}
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
            {t('nav.today')}{' '}
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
