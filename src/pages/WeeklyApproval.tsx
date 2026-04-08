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
      case 'draft': return 'bg-[var(--color-border-light)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
      case 'submitted': return 'bg-[rgba(255,190,0,0.15)] text-[#d97706] dark:text-[#fbbf24]'
      case 'approved': return 'bg-[rgba(34,197,94,0.15)] text-[#15803d] dark:text-[#4ade80]'
      case 'rejected': return 'bg-[rgba(239,68,68,0.15)] text-[#dc2626] dark:text-[#f87171]'
      default: return 'bg-[var(--color-border-light)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
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

  const bgClass = isDark ? 'bg-aether-dark-100 text-aether-text-dark-primary' : 'bg-aether-100 text-aether-text-primary'
  const cardBgClass = isDark ? 'bg-aether-dark-200' : 'bg-aether-200'
  const borderClass = isDark ? 'border-[var(--color-border-subtle)]' : 'border-[var(--color-border-subtle)]'
  const mutedTextClass = isDark ? 'text-aether-text-dark-secondary' : 'text-aether-text-secondary'
  const buttonPrimaryClass = 'bg-[var(--color-accent)] hover:opacity-90 text-[#fffefb] px-4 py-2 rounded transition-opacity disabled:opacity-50'

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">每周工时审批</h1>
        </div>

        {/* Organization Selection */}
        <div className={`mb-6 p-4 border ${borderClass} rounded ${cardBgClass}`}>
          <label className="block text-sm font-medium mb-2">选择组织</label>
          <div className="grid grid-cols-2 gap-2">
            {organizations.map(org => (
              <button
                key={org.id}
                className={`p-3 border ${borderClass} rounded text-left transition-colors hover:bg-[var(--color-border-light)] ${selectedOrg === org.id ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]' : cardBgClass}`}
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
                  className={`p-3 border ${borderClass} rounded text-left transition-colors hover:bg-[var(--color-border-light)] ${selectedTeam === team.id ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]' : cardBgClass}`}
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
              className={`px-3 py-2 border ${borderClass} rounded focus:ring-2 focus:ring-[var(--color-accent)] outline-none ${isDark ? 'bg-aether-dark-300 text-aether-text-dark-primary' : 'bg-aether-200 text-aether-text-primary'}`}
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
                      <p className={`text-sm ${mutedTextClass}`}>
                        提交于 {formatDate(item.submitted_at)}
                      </p>
                      {item.feedback && (
                        <p className={`text-sm mt-1 ${mutedTextClass}`}>
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
            <p className={`${mutedTextClass}`}>你还没有加入任何需要审批的组织</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WeeklyApproval
