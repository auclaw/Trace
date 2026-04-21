import React, { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Clock,
  ListTodo,
  BarChart3,
  Settings,
  User,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { AppState } from '../store/useAppStore'

interface NavItem {
  key: string
  label: string
  path: string
  icon: React.ReactNode
  end?: boolean
}

const ALL_NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/', end: true,
    icon: <LayoutDashboard size={18} strokeWidth={1.5} /> },
  { key: 'timeline', label: 'Timeline', path: '/timeline',
    icon: <Clock size={18} strokeWidth={1.5} /> },
  { key: 'task', label: 'Tasks', path: '/task',
    icon: <ListTodo size={18} strokeWidth={1.5} /> },
  { key: 'analytics', label: 'Analytics', path: '/analytics',
    icon: <BarChart3 size={18} strokeWidth={1.5} /> },
  { key: 'settings', label: 'Settings', path: '/settings',
    icon: <Settings size={18} strokeWidth={1.5} /> },
]

/* ── Sidebar ── */
export default function Sidebar() {
  const activeModules = useAppStore((s: AppState) => s.activeModules)
  const location = useLocation()

  const visibleItems = useMemo(
    () => ALL_NAV_ITEMS.filter((item) => activeModules.includes(item.key)),
    [activeModules],
  )

  return (
    <aside
      className="relative flex flex-col h-screen bg-white border-r border-[#D6D3CD]"
      style={{ width: '264px' }}
    >
      {/* ── Brand Logo ── */}
      <div className="flex items-center gap-2 px-6 py-8 shrink-0">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #79BEEB 0%, #5AACDF 100%)' }}>
          <span className="text-white text-xs font-bold">Ξ</span>
        </div>
        <span className="text-lg font-semibold" style={{ color: '#3A3638' }}>Trace AI</span>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2">
        <ul className="flex flex-col gap-1">
          {visibleItems.map((item) => {
            const isActive = item.end
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path)

            return (
              <li key={item.key}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200"
                  style={{
                    background: isActive ? '#79BEEB' : 'transparent',
                    color: isActive ? '#3A3638' : '#9E9899',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#F5F1EA'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── User Profile Card (Macaron Coral) ── */}
      <div className="shrink-0 px-4 pb-6">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: 'rgba(255, 140, 130, 0.12)',
            border: '1px solid #FF8C82',
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#FF8C82' }}
          >
            <User size={16} color="white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate" style={{ color: '#3A3638' }}>
              Alex Trace
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: '#9E9899' }}>
              Pro Account
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
