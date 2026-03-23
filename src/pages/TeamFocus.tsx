import { useState, useEffect, useCallback } from 'react'
import type { Theme } from '../App'
import { apiRequest } from '../utils/api'
import { getCurrentUserId } from '../utils/auth'

interface Team {
  id: number
  name: string
  org_id: number
}

interface TeamFocusMember {
  user_id: number
  status: 'focusing' | 'break' | 'finished'
}

interface TeamFocusSession {
  id: number
  team_id: number
  creator_id: number
  start_time: string
  end_time: string
  status: 'active' | 'finished'
  members: TeamFocusMember[]
}

interface TeamFocusProps {
  theme: Theme
}

const TeamFocus: React.FC<TeamFocusProps> = ({ theme }) => {
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [currentSession, setCurrentSession] = useState<TeamFocusSession | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [startTime, setStartTime] = useState<string>(() => {
    const now = new Date()
    return now.toTimeString().slice(0, 5)
  })
  const [duration, setDuration] = useState<string>('60')

  const loadOrganizations = useCallback(async () => {
    try {
      const response = await apiRequest('/api/org/list', 'GET')
      if (response.code === 200) {
        setOrganizations(response.data.organizations)
      }
    } catch (error) {
      console.error('加载组织失败', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCurrentSession = useCallback(async (teamId: number) => {
    try {
      const response = await apiRequest(`/api/team-focus/current?team_id=${teamId}`, 'GET')
      if (response.code === 200) {
        setCurrentSession(response.data.data)
      } else {
        setCurrentSession(null)
      }
    } catch (error) {
      console.error('加载当前会议失败', error)
    }
  }, [])

  const createSession = async () => {
    if (!selectedTeam) {
      alert('请先选择团队')
      return
    }
    const [hours, minutes] = startTime.split(':').map(Number)
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
    const end = new Date(start.getTime() + parseInt(duration) * 60 * 1000)

    try {
      const response = await apiRequest('/api/team-focus/create', 'POST', {
        team_id: selectedTeam,
        start_time: start.toISOString(),
        end_time: end.toISOString()
      })
      if (response.code === 200) {
        setShowCreate(false)
        loadCurrentSession(selectedTeam)
      }
    } catch (error) {
      console.error('创建会议失败', error)
      alert('创建失败')
    }
  }

  const joinSession = async () => {
    if (!currentSession) return
    try {
      await apiRequest('/api/team-focus/join', 'POST', {
        session_id: currentSession.id
      })
      loadCurrentSession(selectedTeam!)
    } catch (error) {
      console.error('加入失败', error)
      alert('加入失败')
    }
  }

  const updateStatus = async (status: 'focusing' | 'break' | 'finished') => {
    if (!currentSession) return
    try {
      await apiRequest('/api/team-focus/update-status', 'POST', {
        session_id: currentSession.id,
        status: status
      })
      loadCurrentSession(selectedTeam!)
    } catch (error) {
      console.error('更新状态失败', error)
      alert('更新失败')
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'focusing': return '专注中'
      case 'break': return '休息中'
      case 'finished': return '已完成'
      default: return status
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'focusing': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'break': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'finished': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const calculateRemaining = (endTime: string) => {
    const end = new Date(endTime)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    if (diff <= 0) return '已结束'
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}小时${mins}分钟`
    }
    return `${mins}分钟`
  }

  useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])

  // Load teams when selected org changes
  useEffect(() => {
    if (!selectedOrg) {
      setTeams([])
      setSelectedTeam(null)
      return
    }
    const loadTeams = async () => {
      try {
        const response = await apiRequest(`/api/team/list?org_id=${selectedOrg}`, 'GET')
        if (response.code === 200) {
          setTeams(response.data.teams)
        }
      } catch (error) {
        console.error('加载团队失败', error)
      }
    }
    loadTeams()
  }, [selectedOrg])

  useEffect(() => {
    if (selectedTeam) {
      loadCurrentSession(selectedTeam)
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        loadCurrentSession(selectedTeam)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [selectedTeam, loadCurrentSession])

  const bgClass = isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
  const cardBgClass = isDark ? 'bg-gray-800' : 'bg-gray-50'
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200'
  const buttonPrimaryClass = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded'
  const buttonFocusClass = 'bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm'
  const buttonBreakClass = isDark
    ? 'bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm'
    : 'bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm'
  const buttonFinishClass = isDark
    ? 'bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm'
    : 'bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm'

  if (loading) {
    return (
      <div className={`${bgClass} min-h-screen p-4`}>
        <div className="animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <div className={`${bgClass} min-h-screen p-4`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">团队同步专注</h1>
          {selectedTeam && !currentSession && (
            <button
              className={buttonPrimaryClass}
              onClick={() => setShowCreate(true)}
            >
              + 开启专注会议
            </button>
          )}
        </div>

        {/* Organization Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">选择组织</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {organizations.map(org => (
              <button
                key={org.id}
                className={`p-3 border ${borderClass} rounded text-left ${selectedOrg === org.id ? 'border-blue-500 ring-1 ring-blue-500' : cardBgClass}`}
                onClick={() => {
                  setSelectedOrg(org.id)
                  setSelectedTeam(null)
                }}
              >
                {org.name}
              </button>
            ))}
          </div>
        </div>

        {/* Team Selection (when org selected) */}
        {selectedOrg && teams.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">选择团队</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {teams.map(team => (
                <button
                  key={team.id}
                  className={`p-3 border ${borderClass} rounded text-left ${selectedTeam === team.id ? 'border-blue-500 ring-1 ring-blue-500' : cardBgClass}`}
                  onClick={() => setSelectedTeam(team.id)}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create New Session Modal inline */}
        {showCreate && selectedTeam && (
          <div className={`mb-6 p-4 border ${borderClass} rounded ${cardBgClass}`}>
            <h2 className="text-lg font-semibold mb-4">开启新的团队专注会议</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">开始时间</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`px-3 py-2 border ${borderClass} rounded ${isDark ? 'bg-gray-700' : 'bg-white'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">时长（分钟）</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="15"
                  max="240"
                  step="5"
                  className={`px-3 py-2 border ${borderClass} rounded w-32 ${isDark ? 'bg-gray-700' : 'bg-white'}`}
                />
              </div>
              <div className="flex space-x-3">
                <button className={buttonPrimaryClass} onClick={createSession}>
                  开启
                </button>
                <button
                  className={isDark ? 'bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded' : 'bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded'}
                  onClick={() => setShowCreate(false)}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current Session */}
        {currentSession && (
          <div className={`mb-6 p-4 border ${borderClass} rounded ${cardBgClass}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">当前专注会议</h2>
                <p className="text-sm text-gray-500">
                  剩余时间：{calculateRemaining(currentSession.end_time)}
                </p>
              </div>
              <span className={`px-3 py-1 rounded text-sm ${currentSession.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                {currentSession.status === 'active' ? '进行中' : '已结束'}
              </span>
            </div>

            {/* Members Status */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {currentSession.members.map(member => (
                <div
                  key={member.user_id}
                  className={`p-3 border ${borderClass} rounded`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">用户 {member.user_id}</span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(member.status)}`}>
                      {getStatusLabel(member.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Check if current user has joined */}
            {getCurrentUserId() !== null &&
             currentSession.status === 'active' &&
             !currentSession.members.some(m => m.user_id === getCurrentUserId()!) && (
              <div className="mt-4">
                <button
                  className={buttonPrimaryClass}
                  onClick={joinSession}
                >
                  加入会议
                </button>
              </div>
            )}

            {/* Status Update Buttons — only show if already joined */}
            {getCurrentUserId() !== null &&
             currentSession.members.some(m => m.user_id === getCurrentUserId()!) && (
              <div className="mt-4 flex space-x-3">
                <span className="text-sm font-medium my-auto">我的状态：</span>
                <button className={buttonFocusClass} onClick={() => updateStatus('focusing')}>
                  专注
                </button>
                <button className={buttonBreakClass} onClick={() => updateStatus('break')}>
                  休息
                </button>
                <button className={buttonFinishClass} onClick={() => updateStatus('finished')}>
                  完成
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!currentSession && selectedTeam && !showCreate && (
          <div className={`p-8 text-center border ${borderClass} rounded ${cardBgClass}`}>
            <p className="text-gray-500">当前没有进行中的专注会议</p>
            <p className="text-sm text-gray-400 mt-1">
              点击上方"开启专注会议"开始团队同步专注
            </p>
          </div>
        )}

        {/* Empty State when no org */}
        {organizations.length === 0 && (
          <div className={`p-8 text-center border ${borderClass} rounded ${cardBgClass}`}>
            <p className="text-gray-500">你还没有加入任何团队</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamFocus
