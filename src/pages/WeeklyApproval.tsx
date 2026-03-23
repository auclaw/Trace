import { useState, useEffect, useCallback } from 'react'
import type { Theme } from '../App'
import { apiRequest } from '../utils/api'

interface WeeklyApprovalProps {
  theme: Theme
}

interface UserOrganization {
  id: number
  name: string
  role: string
}

interface Team {
  id: number
  name: string
}

interface PreviousSubmission {
  id: number
  week_start: string
  status: string
  submitted_at: string
  approved_at: string | null
  feedback: string | null
}

const WeeklyApproval: React.FC<WeeklyApprovalProps> = ({ theme }) => {
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<UserOrganization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [weekStart, setWeekStart] = useState<string>('')
  const [history, setHistory] = useState<PreviousSubmission[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Get start of current week (Monday)
  const getCurrentWeekStart = () => {
    const now = new Date()
    const day = now.getDay() // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(now.getTime() + diff * 24 * 60 * 60 * 1000)
    return monday.toISOString().split('T')[0]
  }

  const loadOrganizations = useCallback(async () => {
    try {
      const response = await apiRequest('/api/org/list', 'GET')
      if (response.code === 200) {
        setOrganizations(response.data.organizations)
      }
      setWeekStart(getCurrentWeekStart())
    } catch (error) {
      console.error('加载组织失败', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadHistory = useCallback(async () => {
    if (!selectedOrg) return
    try {
      const response = await apiRequest(`/api/approval/history?org_id=${selectedOrg}${selectedTeam ? `&team_id=${selectedTeam}` : ''}`, 'GET')
      if (response.code === 200) {
        setHistory(response.data.history)
      }
    } catch (error) {
      console.error('加载历史失败', error)
    }
  }, [selectedOrg, selectedTeam])

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

  const submitWeekly = async () => {
    if (!selectedOrg) {
      alert('请先选择组织')
      return
    }
    if (!weekStart) {
      alert('请选择周起始日期')
      return
    }
    setSubmitting(true)
    try {
      const response = await apiRequest('/api/approval/submit', 'POST', {
        org_id: selectedOrg,
        week_start: weekStart
      })
      if (response.code === 200) {
        alert('提交成功！')
        loadHistory()
      } else {
        alert(response.msg || '提交失败')
      }
    } catch (error) {
      console.error('提交失败', error)
      alert('提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      case 'submitted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return '草稿'
      case 'submitted': return '已提交'
      case 'approved': return '已通过'
      case 'rejected': return '已拒绝'
      default: return status
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])

  useEffect(() => {
    if (selectedOrg) {
      loadHistory()
    }
  }, [selectedOrg, loadHistory])

  const bgClass = isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
  const cardBgClass = isDark ? 'bg-gray-800' : 'bg-gray-50'
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200'
  const buttonPrimaryClass = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50'

  if (loading) {
    return (
      <div className={`${bgClass} min-h-screen p-4`}>
        <div className="animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <div className={`${bgClass} min-h-screen p-4`}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">每周工时审批</h1>

        {/* Organization Selection */}
        <div className={`mb-6 p-4 border ${borderClass} rounded ${cardBgClass}`}>
          <label className="block text-sm font-medium mb-2">选择组织</label>
          <div className="grid grid-cols-2 gap-2">
            {organizations.map(org => (
              <button
                key={org.id}
                className={`p-3 border ${borderClass} rounded text-left ${selectedOrg === org.id ? 'border-blue-500 ring-1 ring-blue-500' : 'bg-transparent'}`}
                onClick={() => setSelectedOrg(org.id)}
              >
                {org.name}
              </button>
            ))}
          </div>
        </div>

        {/* Team Selection (when org selected) */}
        {selectedOrg && teams.length > 0 && (
          <div className={`mb-6 p-4 border ${borderClass} rounded ${cardBgClass}`}>
            <label className="block text-sm font-medium mb-2">选择团队</label>
            <div className="grid grid-cols-2 gap-2">
              {teams.map(team => (
                <button
                  key={team.id}
                  className={`p-3 border ${borderClass} rounded text-left ${selectedTeam === team.id ? 'border-blue-500 ring-1 ring-blue-500' : 'bg-transparent'}`}
                  onClick={() => setSelectedTeam(team.id)}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Week Selection */}
        {selectedOrg && (
          <div className={`mb-6 p-4 border ${borderClass} rounded ${cardBgClass}`}>
            <label className="block text-sm font-medium mb-2">选择周（周一起始）</label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className={`px-3 py-2 border ${borderClass} rounded ${isDark ? 'bg-gray-700' : 'bg-white'}`}
            />
          </div>
        )}

        {/* Submit Button */}
        {selectedOrg && weekStart && (
          <div className="mb-6">
            <button
              className={buttonPrimaryClass}
              onClick={submitWeekly}
              disabled={submitting}
            >
              {submitting ? '提交中...' : '提交本周工时'}
            </button>
          </div>
        )}

        {/* Submission History */}
        {history.length > 0 && (
          <div className={`border ${borderClass} rounded ${cardBgClass} p-4`}>
            <h2 className="text-xl font-semibold mb-4">提交历史</h2>
            <div className="space-y-3">
              {history.map(item => (
                <div
                  key={item.id}
                  className={`p-3 border ${borderClass} rounded`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">周起始：{formatDate(item.week_start)}</p>
                      <p className="text-sm text-gray-500">
                        提交于 {formatDate(item.submitted_at)}
                      </p>
                      {item.feedback && (
                        <p className="text-sm mt-1">
                          <span className="font-medium">反馈：</span> {item.feedback}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {organizations.length === 0 && (
          <div className={`p-8 text-center border ${borderClass} rounded ${cardBgClass}`}>
            <p className="text-gray-500">你还没有加入任何需要审批的组织</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WeeklyApproval
