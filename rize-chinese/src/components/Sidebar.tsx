import React from 'react'
import { NavLink } from 'react-router-dom'

interface SidebarProps {
  isTracking: boolean
}

const Sidebar: React.FC<SidebarProps> = ({ isTracking }) => {
  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Rize 中文</h1>
        <div className="mt-2 flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
          <span className="text-sm text-gray-500">{isTracking ? '正在追踪' : '追踪已暂停'}</span>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <NavLink 
              to="/" 
              end
              className={({ isActive }) => 
                `flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <span className="mr-3">📊</span>
              仪表盘
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/statistics" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <span className="mr-3">📈</span>
              统计报表
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/settings" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <span className="mr-3">⚙️</span>
              设置
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-blue-800">
            💡 AI自动分类<br/>
            专为中文软件优化
          </p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
