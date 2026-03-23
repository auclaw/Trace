import React from 'react'
import { NavLink } from 'react-router-dom'
import type { Theme } from '../App'

interface SidebarProps {
  isTracking: boolean
  theme: Theme
}

const Sidebar: React.FC<SidebarProps> = ({ isTracking, theme }) => {
  const isDark = theme === 'dark'
  const bgClass = isDark ? 'bg-gray-800' : 'bg-white'
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200'
  const textClass = isDark ? 'text-gray-300' : 'text-gray-700'
  const mutedTextClass = isDark ? 'text-gray-400' : 'text-gray-500'
  const borderBottomClass = isDark ? 'border-b border-gray-700' : 'border-b border-gray-100'

  return (
    <div className={`w-64 ${bgClass} shadow-sm border-r ${borderClass} flex flex-col transition-colors duration-200`}>
      <div className={`p-6 ${borderBottomClass}`}>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">Merize</h1>
        <p className={`text-xs ${mutedTextClass}`}>AI 自动时间追踪</p>
        <div className="mt-2 flex items-center">
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
          <li>
            <NavLink
              to="/settings"
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
