import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, Button, Badge, Modal, EmptyState } from '../components/ui'
import Input from '../components/ui/Input'
import Progress from '../components/ui/Progress'

// ── Types ──

interface TeamMember {
  id: string
  name: string
  emoji: string
  role: 'admin' | 'lead' | 'member'
  weeklyHours: number
  focusScore: number
  status: 'online' | 'focusing' | 'away' | 'offline'
  joinedAt: string
}

interface FocusSession {
  id: string
  memberId: string
  startedAt: string
  duration: number
  type: 'deep' | 'sync' | 'solo'
}

interface WeeklyReport {
  id: string
  memberId: string
  week: string
  summary: string
  hours: number
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
}

type SubTab = 'dashboard' | 'focus' | 'weekly' | 'admin'

// ── Constants ──

const STORAGE_KEY = 'merize-team-data'
const SUB_TABS: { key: SubTab; label: string; icon: string }[] = [
  { key: 'dashboard', label: '总览', icon: '📊' },
  { key: 'focus', label: '专注', icon: '🎯' },
  { key: 'weekly', label: '周报', icon: '📝' },
  { key: 'admin', label: '管理', icon: '⚙️' },
]

const DEFAULT_MEMBERS: TeamMember[] = [
  { id: '1', name: '陈思远', emoji: '🧑‍💻', role: 'admin', weeklyHours: 42, focusScore: 92, status: 'online', joinedAt: '2025-06-01' },
  { id: '2', name: '林晓薇', emoji: '👩‍🎨', role: 'lead', weeklyHours: 38, focusScore: 88, status: 'focusing', joinedAt: '2025-07-15' },
  { id: '3', name: '王俊凯', emoji: '👨‍🔬', role: 'member', weeklyHours: 35, focusScore: 85, status: 'online', joinedAt: '2025-08-20' },
  { id: '4', name: '赵雨萱', emoji: '👩‍💼', role: 'member', weeklyHours: 40, focusScore: 90, status: 'away', joinedAt: '2025-09-10' },
  { id: '5', name: '张浩然', emoji: '🧑‍🏫', role: 'member', weeklyHours: 30, focusScore: 78, status: 'offline', joinedAt: '2025-10-05' },
  { id: '6', name: '刘梦琪', emoji: '👩‍🚀', role: 'lead', weeklyHours: 44, focusScore: 95, status: 'focusing', joinedAt: '2025-06-20' },
]

const DEFAULT_SESSIONS: FocusSession[] = [
  { id: 'fs1', memberId: '2', startedAt: new Date(Date.now() - 25 * 60000).toISOString(), duration: 25, type: 'sync' },
  { id: 'fs2', memberId: '6', startedAt: new Date(Date.now() - 40 * 60000).toISOString(), duration: 50, type: 'deep' },
]

const DEFAULT_REPORTS: WeeklyReport[] = [
  { id: 'wr1', memberId: '1', week: '2026-W14', summary: '完成了用户权限模块重构，修复了3个线上bug', hours: 42, status: 'approved', submittedAt: '2026-04-05' },
  { id: 'wr2', memberId: '2', week: '2026-W14', summary: '设计了新版Dashboard原型，完成了组件库更新', hours: 38, status: 'approved', submittedAt: '2026-04-05' },
  { id: 'wr3', memberId: '3', week: '2026-W14', summary: '调研了新的数据分析方案，编写了技术文档', hours: 35, status: 'pending', submittedAt: '2026-04-06' },
  { id: 'wr4', memberId: '4', week: '2026-W15', summary: '完成了API对接和集成测试', hours: 40, status: 'pending', submittedAt: '2026-04-08' },
]

// ── Data persistence ──

interface TeamData {
  members: TeamMember[]
  sessions: FocusSession[]
  reports: WeeklyReport[]
  teamName: string
  privacy: 'public' | 'private'
}

function loadTeamData(): TeamData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { members: DEFAULT_MEMBERS, sessions: DEFAULT_SESSIONS, reports: DEFAULT_REPORTS, teamName: 'Merize 核心团队', privacy: 'private' }
}

function saveTeamData(data: TeamData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// ── Helpers ──

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'accent' | 'warning' | 'default' }> = {
  online: { label: '在线', variant: 'success' },
  focusing: { label: '专注中', variant: 'accent' },
  away: { label: '离开', variant: 'warning' },
  offline: { label: '离线', variant: 'default' },
}

const ROLE_LABELS: Record<string, string> = { admin: '管理员', lead: '组长', member: '成员' }

// ── Sub-components (placeholder comments filled below) ──
// DashboardTab, FocusTab, WeeklyTab, AdminTab

// ── Main Component ──

export default function Team() {
  const [tab, setTab] = useState<SubTab>('dashboard')
  const [data, setData] = useState<TeamData>(loadTeamData)

  const update = useCallback((partial: Partial<TeamData>) => {
    setData(prev => {
      const next = { ...prev, ...partial }
      saveTeamData(next)
      return next
    })
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">👥 {data.teamName}</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">{data.members.length} 位成员 · 协作共进</p>
      </div>

      {/* Sub-tab nav */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ background: 'var(--color-bg-surface-2)', border: '1px solid var(--color-border-subtle)' }}
      >
        {SUB_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
            style={{
              background: tab === t.key ? 'var(--color-accent-soft)' : 'transparent',
              color: tab === t.key ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              boxShadow: tab === t.key ? '0 1px 4px rgba(44,24,16,0.08)' : 'none',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'dashboard' && <DashboardTab members={data.members} />}
      {tab === 'focus' && <FocusTab members={data.members} sessions={data.sessions} onUpdate={s => update({ sessions: s })} />}
      {tab === 'weekly' && <WeeklyTab members={data.members} reports={data.reports} onUpdate={r => update({ reports: r })} />}
      {tab === 'admin' && <AdminTab data={data} onUpdate={update} />}
    </div>
  )
}

// ── Dashboard Tab ──

function DashboardTab({ members }: { members: TeamMember[] }) {
  const activeCount = members.filter(m => m.status === 'online' || m.status === 'focusing').length
  const totalHours = members.reduce((s, m) => s + m.weeklyHours, 0)
  const avgEfficiency = Math.round(members.reduce((s, m) => s + m.focusScore, 0) / members.length)
  const petProgress = Math.min(100, Math.round(totalHours / 2.5))
  const sorted = useMemo(() => [...members].sort((a, b) => b.focusScore - a.focusScore), [members])

  const stats = [
    { label: '总成员', value: members.length, icon: '👥' },
    { label: '当前活跃', value: activeCount, icon: '🟢' },
    { label: '本周总时长', value: `${totalHours}h`, icon: '⏱️' },
    { label: '平均效率', value: `${avgEfficiency}%`, icon: '⚡' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} padding="sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <div className="text-xl font-bold text-[var(--color-text-primary)]">{s.value}</div>
                <div className="text-xs text-[var(--color-text-muted)]">{s.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Team pet progress */}
      <Card padding="sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">🐾 团队宠物成长</span>
          <span className="text-xs text-[var(--color-text-muted)]">{petProgress}%</span>
        </div>
        <Progress value={petProgress} showLabel={false} />
        <p className="text-xs text-[var(--color-text-muted)] mt-2">团队累计专注 {totalHours}h，继续加油！</p>
      </Card>

      {/* Leaderboard + Member list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Card padding="sm">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">🏆 效率排行</h3>
          <div className="space-y-2">
            {sorted.slice(0, 5).map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 py-1.5">
                <span className="w-5 text-center text-sm font-bold" style={{ color: i < 3 ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                  {i + 1}
                </span>
                <span className="text-lg">{m.emoji}</span>
                <span className="flex-1 text-sm text-[var(--color-text-primary)] font-medium">{m.name}</span>
                <Badge variant={i === 0 ? 'accent' : 'default'} size="sm">{m.focusScore}%</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Members */}
        <Card padding="sm">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">👤 成员列表</h3>
          <div className="space-y-2">
            {members.map(m => {
              const sc = STATUS_CONFIG[m.status]
              return (
                <div key={m.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-[var(--color-bg-surface-2)] transition-colors">
                  <span className="text-lg">{m.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">{m.name}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">{ROLE_LABELS[m.role]} · {m.weeklyHours}h/周</div>
                  </div>
                  <Badge variant={sc.variant} size="sm">{sc.label}</Badge>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── Focus Tab ──

function FocusTab({ members, sessions, onUpdate }: { members: TeamMember[]; sessions: FocusSession[]; onUpdate: (s: FocusSession[]) => void }) {
  const [timer, setTimer] = useState(0)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [active])

  const fmtTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const startTeamFocus = () => {
    setActive(true)
    setTimer(0)
    const newSession: FocusSession = {
      id: `fs-${Date.now()}`,
      memberId: '1',
      startedAt: new Date().toISOString(),
      duration: 25,
      type: 'sync',
    }
    onUpdate([...sessions, newSession])
  }

  const stopFocus = () => setActive(false)

  const getMember = (id: string) => members.find(m => m.id === id)
  const focusingMembers = members.filter(m => m.status === 'focusing')
  const onlineMembers = members.filter(m => m.status === 'online')
  const awayMembers = members.filter(m => m.status === 'away' || m.status === 'offline')

  return (
    <div className="space-y-6">
      {/* Timer display */}
      <Card padding="md">
        <div className="text-center">
          <div className="text-5xl font-mono font-bold text-[var(--color-text-primary)] mb-3" style={{ letterSpacing: '0.05em' }}>
            {fmtTimer(timer)}
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            {active ? '团队同步专注中...' : '开启团队专注，一起高效工作'}
          </p>
          {active ? (
            <Button variant="danger" size="md" onClick={stopFocus}>结束专注</Button>
          ) : (
            <Button variant="primary" size="md" onClick={startTeamFocus}>🎯 开始团队专注</Button>
          )}
        </div>
      </Card>

      {/* Member status grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusGroup label="🔥 专注中" members={focusingMembers} />
        <StatusGroup label="🟢 在线" members={onlineMembers} />
        <StatusGroup label="💤 离开/离线" members={awayMembers} />
      </div>

      {/* Active sessions */}
      <Card padding="sm">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">📋 进行中的专注</h3>
        {sessions.length === 0 ? (
          <EmptyState icon="🎯" title="暂无进行中的专注" description="点击上方按钮开始团队专注" />
        ) : (
          <div className="space-y-2">
            {sessions.map(s => {
              const m = getMember(s.memberId)
              const elapsed = Math.round((Date.now() - new Date(s.startedAt).getTime()) / 60000)
              return (
                <div key={s.id} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: 'var(--color-bg-surface-2)' }}>
                  <span className="text-lg">{m?.emoji ?? '👤'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{m?.name ?? '未知'}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">{s.type === 'sync' ? '同步' : s.type === 'deep' ? '深度' : '独立'} · {elapsed}分钟</div>
                  </div>
                  <Badge variant="accent" size="sm">{s.duration}min</Badge>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function StatusGroup({ label, members }: { label: string; members: TeamMember[] }) {
  return (
    <Card padding="sm">
      <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">{label}</h4>
      {members.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)] py-2">无</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs" style={{ background: 'var(--color-bg-surface-2)' }}>
              <span>{m.emoji}</span>
              <span className="text-[var(--color-text-primary)]">{m.name}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ── Weekly Tab ──

function WeeklyTab({ members, reports, onUpdate }: { members: TeamMember[]; reports: WeeklyReport[]; onUpdate: (r: WeeklyReport[]) => void }) {
  const [summary, setSummary] = useState('')
  const [hours, setHours] = useState('')

  const getMember = (id: string) => members.find(m => m.id === id)
  const thisWeek = reports.filter(r => r.week === '2026-W15')
  const totalWeekHours = thisWeek.reduce((s, r) => s + r.hours, 0)

  const submit = () => {
    if (!summary.trim()) return
    const report: WeeklyReport = {
      id: `wr-${Date.now()}`,
      memberId: '1',
      week: '2026-W15',
      summary: summary.trim(),
      hours: Number(hours) || 0,
      status: 'pending',
      submittedAt: new Date().toISOString().slice(0, 10),
    }
    onUpdate([...reports, report])
    setSummary('')
    setHours('')
  }

  const handleApproval = (id: string, status: 'approved' | 'rejected') => {
    onUpdate(reports.map(r => r.id === id ? { ...r, status } : r))
  }

  const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
    pending: { label: '待审核', variant: 'warning' },
    approved: { label: '已通过', variant: 'success' },
    rejected: { label: '已驳回', variant: 'danger' },
  }

  return (
    <div className="space-y-6">
      {/* Week summary */}
      <Card padding="sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">📅 本周概览 (W15)</h3>
          <Badge variant="accent" size="md">{thisWeek.length} 份周报</Badge>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-text-primary)]">{thisWeek.length}</div>
            <div className="text-[11px] text-[var(--color-text-muted)]">已提交</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-text-primary)]">{totalWeekHours}h</div>
            <div className="text-[11px] text-[var(--color-text-muted)]">累计时长</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-text-primary)]">{thisWeek.filter(r => r.status === 'approved').length}</div>
            <div className="text-[11px] text-[var(--color-text-muted)]">已审核</div>
          </div>
        </div>
      </Card>

      {/* Submission form */}
      <Card padding="sm">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">✍️ 提交周报</h3>
        <div className="space-y-3">
          <Input label="本周工作总结" value={summary} onChange={setSummary} placeholder="描述你本周完成的主要工作..." multiline rows={3} />
          <Input label="工作时长 (小时)" value={hours} onChange={setHours} placeholder="例如: 40" type="number" />
          <Button variant="primary" size="sm" onClick={submit} disabled={!summary.trim()}>提交周报</Button>
        </div>
      </Card>

      {/* Reports list */}
      <Card padding="sm">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">📋 周报记录</h3>
        {reports.length === 0 ? (
          <EmptyState icon="📝" title="暂无周报" description="提交你的第一份周报吧" />
        ) : (
          <div className="space-y-3">
            {reports.map(r => {
              const m = getMember(r.memberId)
              const sb = STATUS_BADGE[r.status]
              return (
                <div key={r.id} className="p-3 rounded-lg" style={{ background: 'var(--color-bg-surface-2)', border: '1px solid var(--color-border-subtle)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{m?.emoji ?? '👤'}</span>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{m?.name ?? '未知'}</span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">{r.week}</span>
                    </div>
                    <Badge variant={sb.variant} size="sm">{sb.label}</Badge>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">{r.summary}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--color-text-muted)]">{r.hours}h · {r.submittedAt}</span>
                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => handleApproval(r.id, 'approved')}>通过</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleApproval(r.id, 'rejected')}>驳回</Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Admin Tab ──

function AdminTab({ data, onUpdate }: { data: TeamData; onUpdate: (partial: Partial<TeamData>) => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('🧑')
  const [newRole, setNewRole] = useState<'admin' | 'lead' | 'member'>('member')
  const [teamName, setTeamName] = useState(data.teamName)
  const [privacy, setPrivacy] = useState(data.privacy)

  const addMember = () => {
    if (!newName.trim()) return
    const member: TeamMember = {
      id: `m-${Date.now()}`,
      name: newName.trim(),
      emoji: newEmoji,
      role: newRole,
      weeklyHours: 0,
      focusScore: 0,
      status: 'offline',
      joinedAt: new Date().toISOString().slice(0, 10),
    }
    onUpdate({ members: [...data.members, member] })
    setNewName('')
    setNewEmoji('🧑')
    setNewRole('member')
    setShowAdd(false)
  }

  const removeMember = (id: string) => {
    onUpdate({ members: data.members.filter(m => m.id !== id) })
  }

  const saveSettings = () => {
    onUpdate({ teamName, privacy })
  }

  return (
    <div className="space-y-6">
      {/* Team settings */}
      <Card padding="sm">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">🏢 团队设置</h3>
        <div className="space-y-3">
          <Input label="团队名称" value={teamName} onChange={setTeamName} placeholder="输入团队名称" />
          <div>
            <label className="text-[10px] font-medium text-[var(--color-text-muted)] block mb-1">隐私级别</label>
            <div className="flex gap-2">
              {(['public', 'private'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPrivacy(p)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
                  style={{
                    background: privacy === p ? 'var(--color-accent-soft)' : 'var(--color-bg-surface-2)',
                    color: privacy === p ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    border: `1px solid ${privacy === p ? 'var(--color-accent)' : 'var(--color-border-subtle)'}`,
                  }}
                >
                  {p === 'public' ? '🌐 公开' : '🔒 私有'}
                </button>
              ))}
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={saveSettings}>保存设置</Button>
        </div>
      </Card>

      {/* Member management */}
      <Card padding="sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">👤 成员管理</h3>
          <Button variant="secondary" size="sm" onClick={() => setShowAdd(true)}>+ 添加成员</Button>
        </div>
        <div className="space-y-2">
          {data.members.map(m => (
            <div key={m.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[var(--color-bg-surface-2)] transition-colors">
              <span className="text-lg">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--color-text-primary)]">{m.name}</div>
                <div className="text-[11px] text-[var(--color-text-muted)]">{ROLE_LABELS[m.role]} · 加入于 {m.joinedAt}</div>
              </div>
              <Badge variant={m.role === 'admin' ? 'accent' : m.role === 'lead' ? 'warning' : 'default'} size="sm">
                {ROLE_LABELS[m.role]}
              </Badge>
              {m.role !== 'admin' && (
                <button
                  onClick={() => removeMember(m.id)}
                  className="text-xs text-[var(--color-text-muted)] hover:text-red-500 transition-colors cursor-pointer px-1"
                  title="移除成员"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Permission info */}
      <Card padding="sm">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">🔑 权限说明</h3>
        <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <div className="flex gap-2"><Badge variant="accent" size="sm">管理员</Badge> 全部权限，包括团队设置和成员管理</div>
          <div className="flex gap-2"><Badge variant="warning" size="sm">组长</Badge> 审批周报，管理专注会话</div>
          <div className="flex gap-2"><Badge variant="default" size="sm">成员</Badge> 提交周报，参与团队专注</div>
        </div>
      </Card>

      {/* Add member modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="添加成员" size="sm">
        <div className="space-y-3">
          <Input label="姓名" value={newName} onChange={setNewName} placeholder="输入成员姓名" />
          <Input label="头像 Emoji" value={newEmoji} onChange={setNewEmoji} placeholder="例如: 🧑" />
          <div>
            <label className="text-[10px] font-medium text-[var(--color-text-muted)] block mb-1">角色</label>
            <div className="flex gap-2">
              {(['member', 'lead', 'admin'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setNewRole(r)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
                  style={{
                    background: newRole === r ? 'var(--color-accent-soft)' : 'var(--color-bg-surface-2)',
                    color: newRole === r ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    border: `1px solid ${newRole === r ? 'var(--color-accent)' : 'var(--color-border-subtle)'}`,
                  }}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>取消</Button>
            <Button variant="primary" size="sm" onClick={addMember} disabled={!newName.trim()}>添加</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
