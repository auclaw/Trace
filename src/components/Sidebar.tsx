import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import type { Theme } from '../App'
import { apiRequest } from '../utils/api'

interface SidebarProps {
  isTracking: boolean
  theme: Theme
}

type SubscriptionPlan = 'free' | 'personal' | 'business'

interface UserRole {
  hasOrgAdmin: boolean
  hasTeamLead: boolean
  hasAnyTeam: boolean
  plan: SubscriptionPlan
}

const Sidebar: React.FC<SidebarProps> = ({ isTracking, theme }) => {
  const isDark = theme === 'dark'
  const [roles, setRoles] = useState<UserRole>({
    hasOrgAdmin: false,
    hasTeamLead: false,
    hasAnyTeam: false,
    plan: 'free',
  })
  const bgClass = isDark ? 'bg-gray-800' : 'bg-white'
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200'
  const textClass = isDark ? 'text-gray-300' : 'text-gray-700'
  const mutedTextClass = isDark ? 'text-gray-400' : 'text-gray-500'
  const borderBottomClass = isDark ? 'border-b border-gray-700' : 'border-b border-gray-100'

  // Load user role permissions for dynamic menu
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await apiRequest('/api/user/roles', 'GET')
        if (response.code === 200) {
          setRoles(response.data)
        }
      } catch (error) {
        console.error('Failed to load user roles', error)
      }
    }
    loadRoles()
  }, [])

  return (
    <div className={`w-64 ${bgClass} shadow-sm border-r ${borderClass} flex flex-col transition-colors duration-200`}>
      <div className={`p-6 ${borderBottomClass}`}>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">Merize</h1>
        <p className={`text-xs ${mutedTextClass}`}>AI 自动时间追踪</p>
        <div className="mt-2 flex items-center" data-tour="tracking-status">
          <span className={`w-2 h-2 rounded-full mr-2 ${isTracking ? 'bg-green-500 animate-pulse' : isDark ? 'bg-gray-600' : 'bg-gray-300'} transition-all duration-300`}></span>
          <span className={`text-sm ${mutedTextClass}`}>{isTracking ? '正在追踪' : '追踪已暂停'}</span>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/"
              end
              data-tour="dashboard"
              className={({ isActive }) => {
                const base = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform'
                if (isActive) {
                  return `${base} bg-gradient-to-r from-primary/10 to-success/10 text-primary font-medium scale-[1.02] shadow-sm`
                } else {
                  return `${base} ${textClass} hover:bg-opacity-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:scale-[1.01]`
                }
              }}
            >
              <span className="mr-3 text-lg">📊</span>
              仪表盘
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/statistics"
              data-tour="statistics"
              className={({ isActive }) => {
                const base = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform'
                if (isActive) {
                  return `${base} bg-gradient-to-r from-primary/10 to-success/10 text-primary font-medium scale-[1.02] shadow-sm`
                } else {
                  return `${base} ${textClass} hover:bg-opacity-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:scale-[1.01]`
                }
              }}
            >
              <span className="mr-3 text-lg">📈</span>
              统计报表
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/planner"
              data-tour="planner"
              className={({ isActive }) => {
                const base = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform'
                if (isActive) {
                  return `${base} bg-gradient-to-r from-primary/10 to-success/10 text-primary font-medium scale-[1.02] shadow-sm`
                } else {
                  return `${base} ${textClass} hover:bg-opacity-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:scale-[1.01]`
                }
              }}
            >
              <span className="mr-3 text-lg">📝</span>
              今日计划
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/calendar"
              data-tour="calendar"
              className={({ isActive }) => {
                const base = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform'
                if (isActive) {
                  return `${base} bg-gradient-to-r from-primary/10 to-success/10 text-primary font-medium scale-[1.02] shadow-sm`
                } else {
                  return `${base} ${textClass} hover:bg-opacity-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:scale-[1.01]`
                }
              }}
            >
              <span className="mr-3 text-lg">📅</span>
              日历
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/focus"
              data-tour="focus-mode"
              className={({ isActive }) => {
                const base = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform'
                if (isActive) {
                  return `${base} bg-gradient-to-r from-primary/10 to-success/10 text-primary font-medium scale-[1.02] shadow-sm`
                } else {
                  return `${base} ${textClass} hover:bg-opacity-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:scale-[1.01]`
                }
              }}
            >
              <span className="mr-3 text-lg">⏱️</span>
              专注模式
            </NavLink>
          </li>

          {/* 个人生产力 */}
          <li className="pt-4">
            <p className={`px-4 text-xs uppercase tracking-wider ${mutedTextClass} mb-2`}>个人生产力</p>
          </li>
          <li>
            <NavLink
              to="/habits"
              className={({ isActive }) => {
                const base = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform'
                if (isActive) {
                  return `${base} bg-gradient-to-r from-primary/10 to-success/10 text-primary font-medium scale-[1.02] shadow-sm`
                } else {
                  return `${base} ${textClass} hover:bg-opacity-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:scale-[1.01]`
                }
              }}
            >
              <span className="mr-3 text-lg">🎯</span>
              习惯目标
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/flow-blocks"
              className={({ isActive }) => {
                const base = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform'
                if (isActive) {
                  return `${base} bg-gradient-to-r from-primary/10 to-success/10 text-primary font-medium scale-[1.02] shadow-sm`
                } else {
                  return `${base} ${textClass} hover:bg-opacity-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:scale-[1.01]`
                }
              }}
            >
              <span className="mr-3 text-lg">🚫</span>
              分心屏蔽
            </NavLink>
          </li>

          {/* AI 效率分析 - 需要个人套餐及以上 */}
          {roles.plan !== 'free' && (
            <>
              <li className="pt-4">
                <p className={`px-4 text-xs uppercase tracking-wider ${mutedTextClass} mb-2`}>AI 分析</p>
              </li>
              <li>
                <NavLink
                  to="/ai-summary"
                  className={({ isActive }) => {
                    const base = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform'
                    if (isActive) {
                      return `${base} bg-gradient-to-r from-primary/10 to-success/10 text-primary font-medium scale-[1.02] shadow-sm`
                    } else {
                      return `${base} ${textClass} hover:bg-opacity-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:scale-[1.01]`
                    }
                  }}
                >
                  <span className="mr-3 text-lg">✨</span>
                  AI 总结
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/deep-work-stats"
                  className={({ isActive }) => {
                    const base = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform'
                    if (isActive) {
                      return `${base} bg-gradient-to-r from-primary/10 to-success/10 text-primary font-medium scale-[1.02] shadow-sm`
                    } else {
                      return `${base} ${textClass} hover:bg-opacity-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:scale-[1.01]`
                    }
                  }}
                >
                  <span className="mr-3 text-lg">💪</span>
                  深度工作
                </NavLink>
              </li>
            </>
          )}

          {/* 团队/企业功能区 - 需要商业套餐及以上 */}
          {roles.plan === 'business' && (
            <>
              <li className="pt-4">
                <p className={`px-4 text-xs uppercase tracking-wider ${mutedTextClass} mb-2`}>团队协作</p>
              </li>
              <li>
                <NavLink
                  to="/team-focus"
                  className={({ isActive }) => {
                    const base = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform'
                    if (isActive) {
                      return `${base} bg-gradient-to-r from-primary/10 to-success/10 text-primary font-medium scale-[1.02] shadow-sm`
                    } else {
                      return `${base} ${textClass} hover:bg-opacity-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:scale-[1.01]`
                    }
                  }}
                >
                  <span className="mr-3 text-lg">👥</span>
                  团队专注
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/approval"
                  className={({ isActive }) => {
                    const base = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform'
                    if (isActive) {
                      return `${base} bg-gradient-to-r from-primary/10 to-success/10 text-primary font-medium scale-[1.02] shadow-sm`
                    } else {
                      return `${base} ${textClass} hover:bg-opacity-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:scale-[1.01]`
                    }
                  }}
                >
                  <span className="mr-3 text-lg">✅</span>
                  每周审批
                </NavLink>
              </li>
              {roles.hasAnyTeam && (
                <li>
                  <NavLink
                    to="/team-dashboard"
                    className={({ isActive }) => {
                      const base = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform'
                      if (isActive) {
                        return `${base} bg-gradient-to-r from-primary/10 to-success/10 text-primary font-medium scale-[1.02] shadow-sm`
                      } else {
                        return `${base} ${textClass} hover:bg-opacity-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:scale-[1.01]`
                      }
                    }}
                  >
                    <span className="mr-3 text-lg">📊</span>
                    团队仪表盘
                  </NavLink>
                </li>
              )}
              {roles.hasOrgAdmin && (
                <li>
                  <NavLink
                    to="/org-admin"
                    className={({ isActive }) => {
                      const base = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform'
                      if (isActive) {
                        return `${base} bg-gradient-to-r from-primary/10 to-success/10 text-primary font-medium scale-[1.02] shadow-sm`
                      } else {
                        return `${base} ${textClass} hover:bg-opacity-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:scale-[1.01]`
                      }
                    }}
                  >
                    <span className="mr-3 text-lg">🏢</span>
                    组织管理
                  </NavLink>
                </li>
              )}
            </>
          )}

          <li>
            <NavLink
              to="/privacy"
              className={({ isActive }) => {
                const base = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform'
                if (isActive) {
                  return `${base} bg-gradient-to-r from-primary/10 to-success/10 text-primary font-medium scale-[1.02] shadow-sm`
                } else {
                  return `${base} ${textClass} hover:bg-opacity-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:scale-[1.01]`
                }
              }}
            >
              <span className="mr-3 text-lg">🔒</span>
              隐私设置
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/settings"
              data-tour="settings"
              className={({ isActive }) => {
                const base = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform'
                if (isActive) {
                  return `${base} bg-gradient-to-r from-primary/10 to-success/10 text-primary font-medium scale-[1.02] shadow-sm`
                } else {
                  return `${base} ${textClass} hover:bg-opacity-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:scale-[1.01]`
                }
              }}
            >
              <span className="mr-3 text-lg">⚙️</span>
              设置
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className={`p-4 border-t ${borderClass}`}>
        <div className="bg-gradient-to-br from-primary/10 to-success/10 rounded-xl p-4">
          <p className="text-xs text-primary/80 font-medium">
            💡 AI自动分类<br/>
            专为中文软件优化
          </p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
