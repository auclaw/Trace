import { useState, useEffect, useCallback } from 'react'
import type { Theme } from '../App'
import { apiRequest } from '../utils/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface WeeklyApproval {
  id: number
  user_id: number
  user_name?: string
  week_start: string
  status: string
  submitted_at: string
}

interface TeamStats {
  total_members: number
  active_members: number
  total_hours_this_week: number
  avg_utilization: number // 0-100
  project_utilization: Array<{project: string, hours: number, utilization: number}>
}

interface TeamDashboardProps {
  theme: Theme
}

const TeamDashboard: React.FC<TeamDashboardProps> = ({ theme }) => {
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [pendingApprovals, setPendingApprovals] = useState<WeeklyApproval[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)

  const loadOrganizations = useCallback(async () => {
    try {
      const response = await apiRequest('/api/org/list', 'GET')
      if (response.code === 200) {
        // Filter to only teams where user is lead or admin
        const userOrgs = response.data.organizations.filter(
          (org: any) => org.role === 'admin' || org.role === 'lead'
        )
        setOrganizations(userOrgs)
      }
    } catch (error) {
      console.error('加载组织失败', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTeamData = useCallback(async (orgId: number, teamId: number) => {
    try {
      // Load pending approvals
      const approvalResp = await apiRequest(
        `/api/approval/list?org_id=${orgId}&team_id=${teamId}`,
        'GET'
      )
      if (approvalResp.code === 200) {
        setPendingApprovals(approvalResp.data.approvals)
      }
      // Load team stats
      const statsResp = await apiRequest(
        `/api/team/stats?org_id=${orgId}&team_id=${teamId}`,
        'GET'
      )
      if (statsResp.code === 200) {
        setTeamStats(statsResp.data.stats)
      }
    } catch (error) {
      console.error('加载团队数据失败', error)
    }
  }, [])

  const handleApprove = async (approvalId: number, approve: boolean) => {
    try {
      await apiRequest('/api/approval/approve', 'POST', {
        approval_id: approvalId,
        action: approve ? 'approved' : 'rejected'
      })
      // Reload pending approvals
      if (selectedOrg && selectedTeam) {
        loadTeamData(selectedOrg, selectedTeam)
      }
    } catch (error) {
      console.error('审批操作失败', error)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-[rgba(255,190,0,0.15)] text-[#d97706] dark:text-[#fbbf24]'
      case 'approved':
        return 'bg-[rgba(34,197,94,0.15)] text-[#15803d] dark:text-[#4ade80]'
      case 'rejected':
        return 'bg-[rgba(239,68,68,0.15)] text-[#dc2626] dark:text-[#f87171]'
      default:
        return 'bg-[var(--color-border-light)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted': return '待审核'
      case 'approved': return '已通过'
      case 'rejected': return '已拒绝'
      default: return status
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    if (wholeHours > 0 && minutes > 0) {
      return `${wholeHours}小时${minutes}分钟`
    }
    if (wholeHours > 0) {
      return `${wholeHours}小时`
    }
    return `${minutes}分钟`
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return isDark ? 'text-green-400' : 'text-green-700'
    if (utilization >= 60) return isDark ? 'text-yellow-400' : 'text-yellow-700'
    return isDark ? 'text-red-400' : 'text-red-700'
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
    if (selectedOrg && selectedTeam) {
      loadTeamData(selectedOrg, selectedTeam)
    }
  }, [selectedOrg, selectedTeam, loadTeamData])

  const bgClass = isDark ? 'bg-aether-dark-100 text-aether-text-dark-primary' : 'bg-aether-100 text-aether-text-primary'
  const cardBgClass = isDark ? 'bg-aether-dark-200' : 'bg-aether-200'
  const borderClass = isDark ? 'border-[var(--color-border-subtle)]' : 'border-[var(--color-border-subtle)]'
  const mutedTextClass = isDark ? 'text-aether-text-dark-secondary' : 'text-aether-text-secondary'
  const buttonGreenClass = 'bg-[var(--color-accent)] hover:opacity-90 text-[#fffefb] px-3 py-1 rounded text-sm transition-opacity'
  const buttonRedClass = 'bg-[var(--color-text-muted)] hover:opacity-90 text-[#fffefb] px-3 py-1 rounded text-sm transition-opacity'

  if (loading) {
    return (
      <div className={`${bgClass} min-h-screen p-4`}>
        <div className="animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <div className={`${bgClass} min-h-screen p-4`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">团队仪表盘</h1>
        </div>

        {/* Organization Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">选择组织</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {organizations.map(org => (
              <button
                key={org.id}
                className={`p-3 border ${borderClass} rounded text-left transition-colors hover:bg-[var(--color-border-light)] ${selectedOrg === org.id ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]' : cardBgClass}`}
                onClick={() => {
                  setSelectedOrg(org.id)
                  setSelectedTeam(null)
                  setTeamStats(null)
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
                  className={`p-3 border ${borderClass} rounded text-left transition-colors hover:bg-[var(--color-border-light)] ${selectedTeam === team.id ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]' : cardBgClass}`}
                  onClick={() => setSelectedTeam(team.id)}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Team Summary Stats */}
        {selectedOrg && selectedTeam && teamStats && (
          <>
            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className={`${cardBgClass} border ${borderClass} rounded p-4`}>
                <p className={`text-sm ${mutedTextClass} mb-1`}>总成员</p>
                <p className="text-2xl font-bold">{teamStats.total_members}</p>
              </div>
              <div className={`${cardBgClass} border ${borderClass} rounded p-4`}>
                <p className={`text-sm ${mutedTextClass} mb-1`}>本周活跃</p>
                <p className={`text-2xl font-bold ${getUtilizationColor(teamStats.active_members / teamStats.total_members * 100)}`}>{teamStats.active_members}</p>
              </div>
              <div className={`${cardBgClass} border ${borderClass} rounded p-4`}>
                <p className={`text-sm ${mutedTextClass} mb-1`}>本周总工时</p>
                <p className="text-2xl font-bold">{formatDuration(teamStats.total_hours_this_week)}</p>
              </div>
              <div className={`${cardBgClass} border ${borderClass} rounded p-4`}>
                <p className={`text-sm ${mutedTextClass} mb-1`}>平均利用率</p>
                <p className={`text-2xl font-bold ${getUtilizationColor(teamStats.avg_utilization)}`}>
                  {teamStats.avg_utilization.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Project Utilization Chart */}
            {teamStats.project_utilization.length > 0 && (
              <div className={`mb-6 ${cardBgClass} border ${borderClass} rounded p-4`}>
                <h2 className="text-xl font-semibold mb-4">项目工时分布</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamStats.project_utilization}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                      <XAxis
                        dataKey="project"
                        tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
                      />
                      <YAxis
                        tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
                        unit="%"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                          color: isDark ? '#f9fafb' : '#111827',
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, '利用率']}
                      />
                      <Bar dataKey="utilization" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        {/* Pending Weekly Approvals */}
        {selectedOrg && (
          <div className={`border ${borderClass} rounded ${cardBgClass} p-4`}>
            <h2 className="text-xl font-semibold mb-4">待审批每周总结</h2>

            {pendingApprovals.length === 0 ? (
              <div className={`text-center py-8 ${mutedTextClass}`}>
                当前没有待审批的总结
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map(approval => (
                  <div
                    key={approval.id}
                    className={`p-3 border ${borderClass} rounded flex justify-between items-center`}
                  >
                    <div>
                      <p className="font-medium">
                        {approval.user_name || `用户 ${approval.user_id}`} · 周 {formatDate(approval.week_start)}
                      </p>
                      <p className={`text-sm ${mutedTextClass}`}>
                        提交于 {formatDate(approval.submitted_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(approval.status)}`}>
                        {getStatusLabel(approval.status)}
                      </span>
                      {approval.status === 'submitted' && (
                        <>
                          <button
                            className={buttonGreenClass}
                            onClick={() => handleApprove(approval.id, true)}
                          >
                            通过
                          </button>
                          <button
                            className={buttonRedClass}
                            onClick={() => handleApprove(approval.id, false)}
                          >
                            拒绝
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {organizations.length === 0 && (
          <div className={`p-8 text-center border ${borderClass} rounded ${cardBgClass}`}>
            <p className={`${mutedTextClass}`}>你没有可管理的团队或组织</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamDashboard
