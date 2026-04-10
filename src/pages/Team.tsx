import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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

const STORAGE_KEY = 'trace-team-data'
const SUB_TABS: { key: SubTab; labelKey: string; icon: string }[] = [
  { key: 'dashboard', labelKey: 'team.tabs.dashboard', icon: '📊' },
  { key: 'focus', labelKey: 'team.tabs.focus', icon: '🎯' },
  { key: 'weekly', labelKey: 'team.tabs.weekly', icon: '📝' },
  { key: 'admin', labelKey: 'team.tabs.admin', icon: '⚙️' },
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
  return { members: DEFAULT_MEMBERS, sessions: DEFAULT_SESSIONS, reports: DEFAULT_REPORTS, teamName: 'Trace 核心团队', privacy: 'private' }
}

function saveTeamData(data: TeamData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// ── Helpers ──

const STATUS_CONFIG: Record<string, { labelKey: string; variant: 'success' | 'accent' | 'warning' | 'default' }> = {
  online: { labelKey: 'team.status.online', variant: 'success' },
  focusing: { labelKey: 'team.status.focusing', variant: 'accent' },
  away: { labelKey: 'team.status.away', variant: 'warning' },
  offline: { labelKey: 'team.status.offline', variant: 'default' },
}

const ROLE_LABELS: Record<string, string> = { admin: 'team.roles.admin', lead: 'team.roles.lead', member: 'team.roles.member' }

// ── Sub-components (placeholder comments filled below) ──
// DashboardTab, FocusTab, WeeklyTab, AdminTab

// ── Main Component ──

export default function Team() {
  const { t } = useTranslation()
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
        <p className="text-sm text-[var(--color-text-muted)] mt-1">{data.members.length} {t('team.totalMembers')}</p>
      </div>

      {/* Sub-tab nav */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ background: 'var(--color-bg-surface-2)', border: '1px solid var(--color-border-subtle)' }}
      >
        {SUB_TABS.map(tabInfo => (
          <button
            key={tabInfo.key}
            onClick={() => setTab(tabInfo.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
            style={{
              background: tab === tabInfo.key ? 'var(--color-accent-soft)' : 'transparent',
              color: tab === tabInfo.key ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              boxShadow: tab === tabInfo.key ? '0 1px 4px rgba(44,24,16,0.08)' : 'none',
            }}
          >
            {tabInfo.icon} {t(tabInfo.labelKey)}
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
  const { t } = useTranslation()
  const activeCount = members.filter(m => m.status === 'online' || m.status === 'focusing').length
  const totalHours = members.reduce((s, m) => s + m.weeklyHours, 0)
  const avgEfficiency = Math.round(members.reduce((s, m) => s + m.focusScore, 0) / members.length)
  const petProgress = Math.min(100, Math.round(totalHours / 2.5))
  const sorted = useMemo(() => [...members].sort((a, b) => b.focusScore - a.focusScore), [members])

  const stats = [
    { label: t('team.stats.totalMembers'), value: members.length, icon: '👥' },
    { label: t('team.stats.activeNow'), value: activeCount, icon: '🟢' },
    { label: t('team.stats.weeklyHours'), value: `${totalHours}h`, icon: '⏱️' },
    { label: t('team.stats.avgEfficiency'), value: `${avgEfficiency}%`, icon: '⚡' },
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
          <span className="text-sm font-medium text-[var(--color-text-primary)]">🐾 {t('team.teamPet')}</span>
          <span className="text-xs text-[var(--color-text-muted)]">{petProgress}%</span>
        </div>
        <Progress value={petProgress} showLabel={false} />
        <p className="text-xs text-[var(--color-text-muted)] mt-2">{t('team.teamPetHint', { totalHours: totalHours })}</p>
      </Card>

      {/* Leaderboard + Member list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Card padding="sm">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">🏆 {t('team.leaderboard')}</h3>
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
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">👤 {t('team.memberList')}</h3>
          <div className="space-y-2">
            {members.map(m => {
              const sc = STATUS_CONFIG[m.status]
              return (
                <div key={m.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-[var(--color-bg-surface-2)] transition-colors">
                  <span className="text-lg">{m.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">{m.name}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">{t(ROLE_LABELS[m.role])} · {m.weeklyHours}{t('common.hours')}/{t('team.week')}</div>
                  </div>
                  <Badge variant={sc.variant} size="sm">{t(sc.labelKey)}</Badge>
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
  const { t } = useTranslation()
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
            {active ? t('team.focus.active') : t('team.focus.idle')}
          </p>
          {active ? (
            <Button variant="danger" size="md" onClick={stopFocus}>{t('team.focus.end')}</Button>
          ) : (
            <Button variant="primary" size="md" onClick={startTeamFocus}>🎯 {t('team.focus.startTeamFocus')}</Button>
          )}
        </div>
      </Card>

      {/* Member status grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusGroup label={`🔥 ${t('team.statusGroups.focusing')}`} members={focusingMembers} />
        <StatusGroup label={`🟢 ${t('team.statusGroups.online')}`} members={onlineMembers} />
        <StatusGroup label={`💤 ${t('team.statusGroups.awayOffline')}`} members={awayMembers} />
      </div>

      {/* Active sessions */}
      <Card padding="sm">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">📋 {t('team.focus.activeSessions')}</h3>
        {sessions.length === 0 ? (
          <EmptyState icon="🎯" title={t('team.focus.noActiveSessions')} description={t('team.focus.noActiveSessionsHint')} />
        ) : (
          <div className="space-y-2">
            {sessions.map(s => {
              const m = getMember(s.memberId)
              const elapsed = Math.round((Date.now() - new Date(s.startedAt).getTime()) / 60000)
              return (
                <div key={s.id} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: 'var(--color-bg-surface-2)' }}>
                  <span className="text-lg">{m?.emoji ?? '👤'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{m?.name ?? t('common.unknown')}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">{s.type === 'sync' ? t('team.focus.type.sync') : s.type === 'deep' ? t('team.focus.type.deep') : t('team.focus.type.solo')} · {elapsed}{t('common.minutes')}</div>
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
  const { t } = useTranslation()
  return (
    <Card padding="sm">
      <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">{label}</h4>
      {members.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)] py-2">{t('common.none')}</p>
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
  const { t } = useTranslation()
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

  const STATUS_BADGE: Record<string, { labelKey: string; variant: 'success' | 'warning' | 'danger' }> = {
    pending: { labelKey: 'team.weekly.status.pending', variant: 'warning' },
    approved: { labelKey: 'team.weekly.status.approved', variant: 'success' },
    rejected: { labelKey: 'team.weekly.status.rejected', variant: 'danger' },
  }

  return (
    <div className="space-y-6">
      {/* Week summary */}
      <Card padding="sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">📅 {t('team.weekly.weekOverview', { week: 'W15' })}</h3>
          <Badge variant="accent" size="md">{thisWeek.length} {t('team.weekly.reportsCount')}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-text-primary)]">{thisWeek.length}</div>
            <div className="text-[11px] text-[var(--color-text-muted)]">{t('team.weekly.submitted')}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-text-primary)]">{totalWeekHours}h</div>
            <div className="text-[11px] text-[var(--color-text-muted)]">{t('team.weekly.totalHours')}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-text-primary)]">{thisWeek.filter(r => r.status === 'approved').length}</div>
            <div className="text-[11px] text-[var(--color-text-muted)]">{t('team.weekly.approved')}</div>
          </div>
        </div>
      </Card>

      {/* Submission form */}
      <Card padding="sm">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">✍️ {t('team.weekly.submitReport')}</h3>
        <div className="space-y-3">
          <Input label={t('team.weekly.summaryLabel')} value={summary} onChange={setSummary} placeholder={t('team.weekly.summaryPlaceholder')} multiline rows={3} />
          <Input label={t('team.weekly.hoursLabel')} value={hours} onChange={setHours} placeholder={t('team.weekly.hoursPlaceholder')} type="number" />
          <Button variant="primary" size="sm" onClick={submit} disabled={!summary.trim()}>{t('team.weekly.submit')}</Button>
        </div>
      </Card>

      {/* Reports list */}
      <Card padding="sm">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">📋 {t('team.weekly.reportList')}</h3>
        {reports.length === 0 ? (
          <EmptyState icon="📝" title={t('team.weekly.noReports')} description={t('team.weekly.noReportsHint')} />
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
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{m?.name ?? t('common.unknown')}</span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">{r.week}</span>
                    </div>
                    <Badge variant={sb.variant} size="sm">{t(sb.labelKey)}</Badge>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">{r.summary}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--color-text-muted)]">{r.hours}{t('common.hours')} · {r.submittedAt}</span>
                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => handleApproval(r.id, 'approved')}>{t('team.weekly.approve')}</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleApproval(r.id, 'rejected')}>{t('team.weekly.reject')}</Button>
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
  const { t } = useTranslation()
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
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">🏢 {t('team.admin.teamSettings')}</h3>
        <div className="space-y-3">
          <Input label={t('team.admin.teamName')} value={teamName} onChange={setTeamName} placeholder={t('team.admin.teamNamePlaceholder')} />
          <div>
            <label className="text-[10px] font-medium text-[var(--color-text-muted)] block mb-1">{t('team.admin.privacyLevel')}</label>
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
                  {p === 'public' ? `🌐 ${t('team.admin.privacyPublic')}` : `🔒 ${t('team.admin.privacyPrivate')}`}
                </button>
              ))}
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={saveSettings}>{t('common.save')}</Button>
        </div>
      </Card>

      {/* Member management */}
      <Card padding="sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">👤 {t('team.admin.memberManagement')}</h3>
          <Button variant="secondary" size="sm" onClick={() => setShowAdd(true)}>+ {t('team.admin.addMember')}</Button>
        </div>
        <div className="space-y-2">
          {data.members.map(m => (
            <div key={m.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[var(--color-bg-surface-2)] transition-colors">
              <span className="text-lg">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--color-text-primary)]">{m.name}</div>
                <div className="text-[11px] text-[var(--color-text-muted)]">{t(ROLE_LABELS[m.role])} · {t('team.admin.joinedAt')} {m.joinedAt}</div>
              </div>
              <Badge variant={m.role === 'admin' ? 'accent' : m.role === 'lead' ? 'warning' : 'default'} size="sm">
                {t(ROLE_LABELS[m.role])}
              </Badge>
              {m.role !== 'admin' && (
                <button
                  onClick={() => removeMember(m.id)}
                  className="text-xs text-[var(--color-text-muted)] hover:text-red-500 transition-colors cursor-pointer px-1"
                  title={t('team.admin.removeMember')}
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
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">🔑 {t('team.admin.permissionsTitle')}</h3>
        <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <div className="flex gap-2"><Badge variant="accent" size="sm">{t('team.roles.admin')}</Badge> {t('team.admin.permissions.admin')}</div>
          <div className="flex gap-2"><Badge variant="warning" size="sm">{t('team.roles.lead')}</Badge> {t('team.admin.permissions.lead')}</div>
          <div className="flex gap-2"><Badge variant="default" size="sm">{t('team.roles.member')}</Badge> {t('team.admin.permissions.member')}</div>
        </div>
      </Card>

      {/* Add member modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={t('team.admin.addMember')} size="sm">
        <div className="space-y-3">
          <Input label={t('team.admin.name')} value={newName} onChange={setNewName} placeholder={t('team.admin.namePlaceholder')} />
          <Input label={t('team.admin.avatarEmoji')} value={newEmoji} onChange={setNewEmoji} placeholder={t('team.admin.avatarPlaceholder')} />
          <div>
            <label className="text-[10px] font-medium text-[var(--color-text-muted)] block mb-1">{t('team.admin.role')}</label>
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
                  {t(ROLE_LABELS[r])}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" onClick={addMember} disabled={!newName.trim()}>{t('team.admin.add')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
