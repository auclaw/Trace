import { useState, useEffect, useCallback } from 'react'
import type { Theme } from '../App'
import { apiRequest } from '../utils/api'

interface Organization {
  id: number
  name: string
  domain: string | null
  role: string
  status: string
}

interface Team {
  id: number
  org_id: number
  name: string
  lead_user_id: number
}

interface Member {
  id: number
  team_id: number | null
  user_id: number
  role: string
  status: string
  invited_at: string
}

interface OrgAdminProps {
  theme: Theme
}

const OrgAdmin: React.FC<OrgAdminProps> = ({ theme }) => {
  const isDark = theme === 'dark'
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgDomain, setNewOrgDomain] = useState('')
  const [newOrgSeats, setNewOrgSeats] = useState(5)
  const [newTeamName, setNewTeamName] = useState('')

  const loadOrganizations = useCallback(async () => {
    try {
      const response = await apiRequest('/api/org/list', 'GET')
      if (response.code === 200) {
        setOrganizations(response.data.organizations)
      }
    } catch (error) {
      console.error('加载组织列表失败', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTeamsAndMembers = useCallback(async (org: Organization) => {
    setSelectedOrg(org)
    try {
      // Load members
      const memberResp = await apiRequest(`/api/org/members?org_id=${org.id}`, 'GET')
      if (memberResp.code === 200) {
        setMembers(memberResp.data.members)
      }
      // Load teams
      const teamResp = await apiRequest(`/api/team/list?org_id=${org.id}`, 'GET')
      if (teamResp.code === 200) {
        setTeams(teamResp.data.teams)
      }
    } catch (error) {
      console.error('加载团队/成员失败', error)
    }
  }, [])

  const createOrganization = async () => {
    if (!newOrgName.trim()) {
      alert('组织名称不能为空')
      return
    }
    try {
      const response = await apiRequest('/api/org/create', 'POST', {
        name: newOrgName.trim(),
        domain: newOrgDomain.trim() || null,
        seat_count: newOrgSeats,
        billing_cycle: 'monthly',
        amount: 0
      })
      if (response.code === 200) {
        setNewOrgName('')
        setNewOrgDomain('')
        setShowCreateOrg(false)
        loadOrganizations()
      }
    } catch (error) {
      console.error('创建组织失败', error)
    }
  }

  const createTeam = async () => {
    if (!selectedOrg || !newTeamName.trim()) {
      alert('团队名称不能为空')
      return
    }
    try {
      const response = await apiRequest('/api/team/create', 'POST', {
        org_id: selectedOrg.id,
        name: newTeamName.trim()
      })
      if (response.code === 200) {
        setNewTeamName('')
        setShowCreateTeam(false)
        // Reload teams
        loadTeamsAndMembers(selectedOrg)
      }
    } catch (error) {
      console.error('创建团队失败', error)
    }
  }

  useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '组织管理员'
      case 'lead': return '团队负责人'
      case 'member': return '成员'
      default: return role
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '已激活'
      case 'pending': return '待接受'
      case 'suspended': return '已暂停'
      default: return status
    }
  }

  const bgClass = isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
  const cardBgClass = isDark ? 'bg-gray-800' : 'bg-gray-50'
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200'
  const buttonPrimaryClass = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded'
  const buttonSecondaryClass = isDark
    ? 'bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded'

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
        <h1 className="text-2xl font-bold mb-6">组织管理</h1>

        {/* Create Organization Button */}
        <div className="mb-6">
          <button
            className={buttonPrimaryClass}
            onClick={() => setShowCreateOrg(true)}
          >
            + 创建新组织
          </button>
        </div>

        {/* Create Organization Modal */}
        {showCreateOrg && (
          <div className={`mb-6 p-4 border ${borderClass} rounded ${cardBgClass}`}>
            <h2 className="text-xl font-semibold mb-4">创建新组织</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">组织名称 *</label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className={`w-full px-3 py-2 border ${borderClass} rounded ${isDark ? 'bg-gray-700' : 'bg-white'}`}
                  placeholder="输入组织名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">域名（可选）</label>
                <input
                  type="text"
                  value={newOrgDomain}
                  onChange={(e) => setNewOrgDomain(e.target.value)}
                  className={`w-full px-3 py-2 border ${borderClass} rounded ${isDark ? 'bg-gray-700' : 'bg-white'}`}
                  placeholder="company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">座位数</label>
                <input
                  type="number"
                  value={newOrgSeats}
                  onChange={(e) => setNewOrgSeats(parseInt(e.target.value) || 5)}
                  min={1}
                  className={`w-full px-3 py-2 border ${borderClass} rounded ${isDark ? 'bg-gray-700' : 'bg-white'}`}
                />
              </div>
              <div className="flex space-x-3">
                <button className={buttonPrimaryClass} onClick={createOrganization}>
                  创建
                </button>
                <button className={buttonSecondaryClass} onClick={() => setShowCreateOrg(false)}>
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Organization List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {organizations.length === 0 ? (
            <div className={`p-8 text-center border ${borderClass} rounded ${cardBgClass}`}>
              <p className="text-gray-500">还没有加入任何组织</p>
            </div>
          ) : (
            organizations.map(org => (
              <div
                key={org.id}
                className={`p-4 border ${borderClass} rounded ${cardBgClass} cursor-pointer hover:border-blue-500 transition-colors ${selectedOrg?.id === org.id ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                onClick={() => loadTeamsAndMembers(org)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{org.name}</h3>
                    {org.domain && <p className="text-sm text-gray-500">{org.domain}</p>}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    {getRoleLabel(org.role)}
                  </span>
                </div>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${org.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                    {getStatusLabel(org.status)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Organization Details */}
        {selectedOrg && (
          <div className={`border ${borderClass} rounded ${cardBgClass} p-4`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedOrg.name} · 成员列表
              </h2>
              <button
                className={buttonPrimaryClass}
                onClick={() => setShowCreateTeam(true)}
              >
                + 创建团队
              </button>
            </div>

            {/* Create Team Modal inline */}
            {showCreateTeam && (
              <div className={`mb-4 p-3 border ${borderClass} rounded`}>
                <h3 className="text-sm font-medium mb-2">创建新团队</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className={`flex-1 px-3 py-2 border ${borderClass} rounded ${isDark ? 'bg-gray-700' : 'bg-white'}`}
                    placeholder="团队名称"
                  />
                  <button className={buttonPrimaryClass} onClick={createTeam}>
                    创建
                  </button>
                  <button className={buttonSecondaryClass} onClick={() => setShowCreateTeam(false)}>
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* Members Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${borderClass}`}>
                    <th className="text-left py-2 px-2">用户ID</th>
                    <th className="text-left py-2 px-2">团队</th>
                    <th className="text-left py-2 px-2">角色</th>
                    <th className="text-left py-2 px-2">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => (
                    <tr key={member.id} className={`border-b ${borderClass} last:border-b-0`}>
                      <td className="py-2 px-2">{member.user_id}</td>
                      <td className="py-2 px-2">
                        {member.team_id ? teams.find(t => t.id === member.team_id)?.name || member.team_id : '-'}
                      </td>
                      <td className="py-2 px-2">{getRoleLabel(member.role)}</td>
                      <td className="py-2 px-2">
                        <span className={`text-xs px-2 py-1 rounded ${member.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                          {getStatusLabel(member.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">
                        暂无成员
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrgAdmin
