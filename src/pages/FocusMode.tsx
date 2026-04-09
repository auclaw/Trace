import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button, Badge, Input, Modal, EmptyState } from '../components/ui'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import dataService from '../services/dataService'
import { PetMiniWidget } from './VirtualPet'
import { PetDialogue } from '../components/PetDialogue'
import type { FocusSession } from '../services/dataService'

// ── Helpers ──

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatMM_SS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ── Constants ──

const STATE_LABELS: Record<string, string> = {
  idle: '准备就绪',
  working: '专注中',
  break: '休息中',
  longBreak: '长休息',
}

const RING_RADIUS = 90
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const SVG_SIZE = 220

const MOTIVATIONAL_MSGS = [
  '保持专注，你做得很好！',
  '深呼吸，继续前行。',
  '每一分钟都在积累价值。',
  '心流状态中，不要停下来！',
  '你正在超越昨天的自己。',
  '专注是最好的投资。',
  '坚持住，休息马上到来。',
  '此刻的努力，未来的回报。',
]

const AMBIENT_SOUNDS = [
  { id: 'none', label: '无声', icon: '🔇' },
  { id: 'white-noise', label: '白噪音', icon: '📻' },
  { id: 'rain', label: '雨声', icon: '🌧️' },
  { id: 'cafe', label: '咖啡厅', icon: '☕' },
] as const

const LS_AMBIENT_KEY = 'merize-ambient-sound'
const URGENT_BREAK_THRESHOLD = 50 * 60 // 50 minutes in seconds — second, more urgent reminder

const BREAK_PET_MESSAGES = [
  '休息一下吧！你已经很棒了～',
  '该让眼睛放松一会儿了！',
  '站起来走走，对身体好哦～',
  '你的专注力让我佩服！但也要休息呀～',
  '休息是为了走更长的路！',
  '喝杯水，伸个懒腰吧！',
]

const URGENT_BREAK_PET_MESSAGES = [
  '主人！你已经超时工作了！必须休息！',
  '太久不休息会影响效率的！快停下来！',
  '我都替你累了...拜托休息一下！',
  '健康第一！现在就休息吧！',
]

function pickBreakMessage(isUrgent: boolean): string {
  const pool = isUrgent ? URGENT_BREAK_PET_MESSAGES : BREAK_PET_MESSAGES
  return pool[Math.floor(Math.random() * pool.length)]
}

type TabKey = 'timer' | 'shield'

// ── FlowBlocks types & helpers ──

interface BlockedSite {
  id: string
  domain: string
  enabled: boolean
}

type ScheduleMode = 'focus' | 'always' | 'custom'

const LS_KEY = 'merize-flow-blocks'
const LS_SCHEDULE_KEY = 'merize-flow-blocks-schedule'

function loadSites(): BlockedSite[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : defaultSites()
  } catch {
    return defaultSites()
  }
}

function saveSites(sites: BlockedSite[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(sites))
}

function loadSchedule(): ScheduleMode {
  return (localStorage.getItem(LS_SCHEDULE_KEY) as ScheduleMode) || 'focus'
}

function saveSchedule(mode: ScheduleMode): void {
  localStorage.setItem(LS_SCHEDULE_KEY, mode)
}

function defaultSites(): BlockedSite[] {
  return [
    { id: crypto.randomUUID(), domain: 'weibo.com', enabled: true },
    { id: crypto.randomUUID(), domain: 'twitter.com', enabled: true },
    { id: crypto.randomUUID(), domain: 'douyin.com', enabled: true },
    { id: crypto.randomUUID(), domain: 'bilibili.com', enabled: false },
    { id: crypto.randomUUID(), domain: 'zhihu.com', enabled: false },
  ]
}

const SCHEDULE_OPTIONS: { value: ScheduleMode; label: string; desc: string }[] = [
  { value: 'focus', label: '专注时屏蔽', desc: '仅在专注模式激活期间屏蔽' },
  { value: 'always', label: '始终屏蔽', desc: '无论是否在专注模式都会屏蔽' },
  { value: 'custom', label: '自定义时间', desc: '设定每日自动屏蔽时间段（桌面端）' },
]

// ══════════════════════════════════════════════════
//  Main Component
// ══════════════════════════════════════════════════

export default function FocusMode() {
  const { accentColor } = useTheme()

  // ── Store ──
  const focusState = useAppStore((s) => s.focusState)
  const focusTimeLeft = useAppStore((s) => s.focusTimeLeft)
  const focusSessions = useAppStore((s) => s.focusSessions)
  const focusSettings = useAppStore((s) => s.focusSettings)
  const startFocus = useAppStore((s) => s.startFocus)
  const pauseFocus = useAppStore((s) => s.pauseFocus)
  const resetFocus = useAppStore((s) => s.resetFocus)
  const tickFocus = useAppStore((s) => s.tickFocus)
  const skipBreak = useAppStore((s) => s.skipBreak)
  const updateFocusSettings = useAppStore((s) => s.updateFocusSettings)
  const addToast = useAppStore((s) => s.addToast)

  // ── Local state ──
  const [activeTab, setActiveTab] = useState<TabKey>('timer')
  const [showSettings, setShowSettings] = useState(false)
  const [todaySessions, setTodaySessions] = useState<FocusSession[]>([])
  const [ambientSound, setAmbientSound] = useState<string | null>(() => {
    try { return localStorage.getItem(LS_AMBIENT_KEY) } catch { return null }
  })
  const [motivIdx, setMotivIdx] = useState(0)
  const [breakReminderDismissed, setBreakReminderDismissed] = useState(false)
  const [urgentReminderDismissed, setUrgentReminderDismissed] = useState(false)
  const [continuousFocusSeconds, setContinuousFocusSeconds] = useState(0)
  const [breakTimerActive, setBreakTimerActive] = useState(false)
  const [breakTimeLeft, setBreakTimeLeft] = useState(5 * 60) // 5 minutes break
  const [breakPetMessage, setBreakPetMessage] = useState('')

  // ── FlowBlocks state ──
  const [sites, setSites] = useState<BlockedSite[]>(loadSites)
  const [schedule, setSchedule] = useState<ScheduleMode>(loadSchedule)
  const [addOpen, setAddOpen] = useState(false)
  const [newDomain, setNewDomain] = useState('')

  // ── Tick interval ──
  useEffect(() => {
    if (focusState === 'idle') return
    const id = setInterval(() => tickFocus(), 1000)
    return () => clearInterval(id)
  }, [focusState, tickFocus])

  // ── Load today sessions ──
  useEffect(() => {
    setTodaySessions(
      dataService.getFocusSessions(todayStr()).filter((s) => s.type === 'work' && s.completed)
    )
  }, [focusSessions])

  // ── Rotate motivational message every 30s ──
  useEffect(() => {
    if (focusState !== 'working') return
    const id = setInterval(() => setMotivIdx((i) => (i + 1) % MOTIVATIONAL_MSGS.length), 30000)
    return () => clearInterval(id)
  }, [focusState])

  // ── Track continuous focus time for break reminder ──
  useEffect(() => {
    if (focusState !== 'working') {
      setContinuousFocusSeconds(0)
      setBreakReminderDismissed(false)
      setUrgentReminderDismissed(false)
      return
    }
    const id = setInterval(() => setContinuousFocusSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [focusState])

  // Break reminder threshold = user-configured workMinutes
  const breakReminderThreshold = focusSettings.workMinutes * 60

  // Show first reminder at workMinutes, second (urgent) at 50 min
  const showBreakReminderModal =
    focusState === 'working' &&
    continuousFocusSeconds >= breakReminderThreshold &&
    !breakReminderDismissed &&
    !breakTimerActive

  const showUrgentBreakReminderModal =
    focusState === 'working' &&
    continuousFocusSeconds >= URGENT_BREAK_THRESHOLD &&
    !urgentReminderDismissed &&
    breakReminderDismissed && // only show after first was dismissed
    !breakTimerActive

  // Generate pet message when modal opens
  useEffect(() => {
    if (showBreakReminderModal || showUrgentBreakReminderModal) {
      setBreakPetMessage(pickBreakMessage(showUrgentBreakReminderModal))
    }
  }, [showBreakReminderModal, showUrgentBreakReminderModal])

  // Break timer countdown
  useEffect(() => {
    if (!breakTimerActive) return
    if (breakTimeLeft <= 0) {
      setBreakTimerActive(false)
      setBreakTimeLeft(5 * 60)
      addToast('success', '休息结束！继续加油吧~')
      return
    }
    const id = setInterval(() => setBreakTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [breakTimerActive, breakTimeLeft, addToast])

  // Handlers for break reminder modal
  const handleTakeBreak = useCallback(() => {
    pauseFocus()
    setBreakTimerActive(true)
    setBreakTimeLeft(5 * 60)
    setBreakReminderDismissed(true)
    setUrgentReminderDismissed(true)
  }, [pauseFocus])

  const handleContinueFocus = useCallback(() => {
    if (showUrgentBreakReminderModal) {
      setUrgentReminderDismissed(true)
    } else {
      setBreakReminderDismissed(true)
    }
  }, [showUrgentBreakReminderModal])

  const handleEndSession = useCallback(() => {
    resetFocus()
    setBreakReminderDismissed(true)
    setUrgentReminderDismissed(true)
  }, [resetFocus])

  // ── Persist ambient sound selection ──
  const handleAmbientChange = useCallback((id: string | null) => {
    setAmbientSound(id)
    try {
      if (id) localStorage.setItem(LS_AMBIENT_KEY, id)
      else localStorage.removeItem(LS_AMBIENT_KEY)
    } catch { /* noop */ }
  }, [])

  // ── Progress ──
  const totalSeconds = useMemo(() => {
    if (focusState === 'working') return focusSettings.workMinutes * 60
    if (focusState === 'break') return focusSettings.breakMinutes * 60
    if (focusState === 'longBreak') return focusSettings.longBreakMinutes * 60
    return focusSettings.workMinutes * 60
  }, [focusState, focusSettings])

  const progress = totalSeconds > 0 ? 1 - focusTimeLeft / totalSeconds : 0
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress)
  const isActive = focusState === 'working' || focusState === 'break' || focusState === 'longBreak'
  const isBreak = focusState === 'break' || focusState === 'longBreak'
  const isBlocking = focusState === 'working'

  const ringColor =
    focusState === 'working'
      ? accentColor
      : isBreak
        ? 'var(--color-success, #22c55e)'
        : 'var(--color-text-muted)'

  const completedSessions = todaySessions.length
  const totalDots = Math.max(focusSettings.longBreakInterval, completedSessions + (isActive && !isBreak ? 1 : 0))

  const bgClass =
    focusState === 'working'
      ? 'focus-bg-warm'
      : isBreak
        ? 'focus-bg-cool'
        : 'focus-bg-idle'

  const center = SVG_SIZE / 2

  // ── FlowBlocks CRUD ──
  const persist = useCallback((next: BlockedSite[]) => {
    setSites(next)
    saveSites(next)
  }, [])

  const handleAdd = useCallback(() => {
    let domain = newDomain.trim().toLowerCase()
    if (!domain) return
    domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
    if (sites.some((s) => s.domain === domain)) {
      addToast('warning', '该域名已存在')
      return
    }
    const entry: BlockedSite = { id: crypto.randomUUID(), domain, enabled: true }
    persist([...sites, entry])
    setNewDomain('')
    setAddOpen(false)
    addToast('success', `已添加 ${domain}`)
  }, [newDomain, sites, persist, addToast])

  const handleToggle = useCallback(
    (id: string) => {
      persist(sites.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)))
    },
    [sites, persist],
  )

  const handleDelete = useCallback(
    (id: string) => {
      persist(sites.filter((s) => s.id !== id))
      addToast('info', '已删除')
    },
    [sites, persist, addToast],
  )

  const handleScheduleChange = useCallback(
    (mode: ScheduleMode) => {
      setSchedule(mode)
      saveSchedule(mode)
    },
    [],
  )

  const enabledCount = sites.filter((s) => s.enabled).length

  // ── Computed stats ──
  const totalFocusToday = todaySessions.reduce((sum, s) => sum + s.duration, 0)

  return (
    <>
      <style>{FOCUS_STYLES}</style>
      <div className={`focus-page ${bgClass} min-h-[calc(100vh-4rem)] flex flex-col`}>
        {/* ── Tab switcher ── */}
        <div className="focus-tab-bar">
          <button
            className={`focus-tab ${activeTab === 'timer' ? 'active' : ''}`}
            onClick={() => setActiveTab('timer')}
          >
            专注计时器
          </button>
          <button
            className={`focus-tab ${activeTab === 'shield' ? 'active' : ''}`}
            onClick={() => setActiveTab('shield')}
          >
            专注屏蔽
            {isBlocking && (
              <span
                className="inline-block ml-1.5 w-2 h-2 rounded-full"
                style={{ background: '#48bb78', verticalAlign: 'middle' }}
              />
            )}
          </button>
        </div>

        {/* ── Tab content ── */}
        {activeTab === 'timer' ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 select-none pb-6">
            {/* ── Motivational message ── */}
            {focusState === 'working' && (
              <p className="motiv-msg text-xs text-[var(--color-text-muted)] mb-4 text-center" style={{ letterSpacing: '0.05em' }}>
                {MOTIVATIONAL_MSGS[motivIdx]}
              </p>
            )}

            {/* ── Break timer overlay (5 min rest countdown) ── */}
            {breakTimerActive && (
              <div
                className="w-full max-w-md mb-4 px-5 py-4 rounded-2xl text-center break-reminder-enter"
                style={{
                  background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-success, #22c55e) 12%, transparent), color-mix(in srgb, var(--color-success, #22c55e) 6%, transparent))',
                  border: '1px solid color-mix(in srgb, var(--color-success, #22c55e) 25%, transparent)',
                }}
              >
                <span style={{ fontSize: 24 }}>🧘</span>
                <p className="text-[14px] font-semibold text-[var(--color-text-primary)] mt-1">
                  休息中...
                </p>
                <p className="text-2xl font-bold tabular-nums text-[var(--color-text-primary)] mt-1">
                  {formatMM_SS(breakTimeLeft)}
                </p>
                <p className="text-[12px] text-[var(--color-text-muted)] mt-1">放松一下，闭目养神</p>
                <button
                  onClick={() => { setBreakTimerActive(false); setBreakTimeLeft(5 * 60); startFocus() }}
                  className="mt-3 px-4 py-1.5 rounded-full text-[12px] font-medium transition-all"
                  style={{ background: 'var(--color-bg-surface-2)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-subtle)' }}
                >
                  跳过休息，继续专注
                </button>
              </div>
            )}

            {/* ── Timer ring + Pet widget row ── */}
            <div className="flex items-center justify-center gap-6 mb-8 flex-1 min-h-0 max-h-[380px]">
              {/* Pet mini widget during focus */}
              {isActive && (
                <div className="hidden sm:block" style={{ opacity: 0.9 }}>
                  <PetMiniWidget />
                </div>
              )}

              {/* Timer display */}
              <div className="relative flex items-center justify-center">
                {/* Gradient glow */}
                <div
                  className={`absolute rounded-full ${focusState === 'working' ? 'focus-glow-breathe' : ''}`}
                  style={{
                    width: SVG_SIZE + 60, height: SVG_SIZE + 60,
                    background: `radial-gradient(circle, ${ringColor} 0%, transparent 70%)`,
                    opacity: 0.15, filter: 'blur(30px)',
                    transition: 'background 0.8s ease, opacity 0.8s ease',
                  }}
                />

                {/* SVG ring */}
                <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="relative z-10">
                  <circle cx={center} cy={center} r={RING_RADIUS} fill="none" stroke="var(--color-border-subtle)" strokeWidth="6" opacity="0.2" />
                  <circle
                    cx={center} cy={center} r={RING_RADIUS} fill="none"
                    stroke={ringColor} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={dashOffset}
                    transform={`rotate(-90 ${center} ${center})`}
                    className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                  />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <span
                    className="tabular-nums text-[var(--color-text-primary)]"
                    style={{ fontSize: 48, fontWeight: 300, letterSpacing: '0.08em' }}
                  >
                    {formatMM_SS(focusTimeLeft)}
                  </span>
                  <span
                    className="mt-2 text-[var(--color-text-muted)]"
                    style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em' }}
                  >
                    {STATE_LABELS[focusState]}
                  </span>
                  {/* Session dots */}
                  <div className="flex items-center gap-1.5 mt-3">
                    {Array.from({ length: totalDots }).map((_, i) => (
                      <span
                        key={i}
                        className="block rounded-full transition-colors duration-300"
                        style={{
                          width: 6, height: 6,
                          backgroundColor: i < completedSessions ? accentColor : 'var(--color-border-subtle)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Controls ── */}
            <div className="flex items-center gap-3 mb-6">
              {!isActive && (
                <Button size="lg" onClick={startFocus} className="!h-14 !px-10 !text-base !rounded-full focus-btn-start">
                  开始专注
                </Button>
              )}
              {isActive && !isBreak && (
                <Button size="md" variant="secondary" onClick={pauseFocus} className="active:!scale-95">暂停</Button>
              )}
              {isBreak && (
                <Button size="md" variant="ghost" onClick={skipBreak} className="active:!scale-95">跳过休息</Button>
              )}
              {isActive && (
                <Button size="md" variant="secondary" onClick={resetFocus} className="active:!scale-95">重置</Button>
              )}
            </div>

            {/* ── Ambient sounds ── */}
            <div className="flex items-center gap-2 mb-5">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase mr-1" style={{ letterSpacing: '0.1em' }}>
                环境音
              </span>
              {AMBIENT_SOUNDS.map((s) => (
                <button
                  key={s.id}
                  className={`ambient-chip ${ambientSound === s.id ? 'active' : ''}`}
                  onClick={() => handleAmbientChange(ambientSound === s.id ? null : s.id)}
                >
                  {s.icon} {s.label}
                  {ambientSound === s.id && s.id !== 'none' && ' ♪'}
                </button>
              ))}
            </div>

            {/* ── Settings toggle ── */}
            <button
              onClick={() => setShowSettings((v) => !v)}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-5 cursor-pointer"
              style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              {showSettings ? '收起设置' : '调整设置'}
            </button>

            {/* ── Settings Panel ── */}
            {showSettings && (
              <div
                className="w-full max-w-md mb-5 rounded-2xl p-5"
                style={{
                  background: 'var(--color-bg-surface-1)',
                  border: '1px solid var(--color-border-subtle)',
                  boxShadow: 'var(--shadow-lg, 0 8px 30px rgba(0,0,0,0.12))',
                }}
              >
                <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                  <SliderSetting label="工作时长" value={focusSettings.workMinutes} min={15} max={60} step={5} unit="分钟" onChange={(v) => updateFocusSettings({ workMinutes: v })} />
                  <SliderSetting label="休息时长" value={focusSettings.breakMinutes} min={3} max={15} step={1} unit="分钟" onChange={(v) => updateFocusSettings({ breakMinutes: v })} />
                  <SliderSetting label="长休息时长" value={focusSettings.longBreakMinutes} min={10} max={30} step={5} unit="分钟" onChange={(v) => updateFocusSettings({ longBreakMinutes: v })} />
                  <SliderSetting label="长休息间隔" value={focusSettings.longBreakInterval} min={2} max={8} step={1} unit="轮" onChange={(v) => updateFocusSettings({ longBreakInterval: v })} />
                </div>
              </div>
            )}

            {/* ── Today's stats summary ── */}
            {todaySessions.length > 0 && (
              <div className="flex items-center gap-6 mb-4 text-center">
                <div>
                  <span className="text-2xl font-bold text-[var(--color-text-primary)]">{todaySessions.length}</span>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 uppercase" style={{ letterSpacing: '0.1em' }}>完成番茄</p>
                </div>
                <div style={{ width: 1, height: 28, background: 'var(--color-border-subtle)' }} />
                <div>
                  <span className="text-2xl font-bold text-[var(--color-text-primary)]">{totalFocusToday}</span>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 uppercase" style={{ letterSpacing: '0.1em' }}>专注分钟</p>
                </div>
              </div>
            )}

            {/* ── Today's completed sessions ── */}
            {todaySessions.length > 0 ? (
              <div className="w-full max-w-md mb-4">
                <h3
                  className="text-[var(--color-text-muted)] mb-2"
                  style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em' }}
                >
                  今日记录
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2 focus-hide-scrollbar">
                  {todaySessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex-shrink-0 rounded-xl px-3 py-2 flex flex-col items-center"
                      style={{
                        minWidth: 80,
                        background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)`,
                      }}
                    >
                      <span className="text-[10px] text-[var(--color-text-muted)]">{formatTime(s.startTime)}</span>
                      <span className="text-xs font-semibold text-[var(--color-text-primary)] mt-0.5">{s.duration}分钟</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              !isActive && (
                <EmptyState
                  icon="🍅"
                  title="今天还没有专注记录"
                  description="点击「开始专注」来记录你的第一个番茄钟"
                  className="w-full max-w-md"
                />
              )
            )}
          </div>
        ) : (
          <div className="flex-1 p-6 md:p-8 max-w-3xl mx-auto w-full space-y-6 fb-page-enter">
            {/* ── Header ── */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">专注屏蔽</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  专注时自动屏蔽分心网站，帮你进入并保持心流状态
                </p>
              </div>
              <button className="fb-add-btn" onClick={() => setAddOpen(true)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M7 1v12M1 7h12" />
                </svg>
                添加
              </button>
            </div>

            {/* ── Hero Status Card ── */}
            <div className="fb-hero-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`fb-status-dot ${isBlocking ? 'blocking' : ''}`}>
                    <div
                      className="rounded-full"
                      style={{
                        width: 14, height: 14,
                        background: isBlocking ? '#48bb78' : 'var(--color-border-subtle)',
                        boxShadow: isBlocking ? '0 0 0 3px rgba(72, 187, 120, 0.2)' : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    />
                    <div className="dot-ring" style={{ color: '#48bb78' }} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[var(--color-text-primary)]">
                      {isBlocking ? '屏蔽中' : '未激活'}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {isBlocking ? `正在屏蔽 ${enabledCount} 个网站` : '开始专注后自动激活屏蔽'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-4" style={{ marginRight: 8 }}>
                    <div className="text-center">
                      <span className="fb-metric-value text-xl">{enabledCount}</span>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">已启用</p>
                    </div>
                    <div className="text-center">
                      <span className="fb-metric-value text-xl">{todaySessions.length}</span>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">今日屏蔽</p>
                    </div>
                    <div className="text-center">
                      <span className="fb-metric-value text-xl">{totalFocusToday}</span>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">节省分钟</p>
                    </div>
                  </div>
                  <Badge variant={isBlocking ? 'success' : 'default'} size="md">
                    {isBlocking ? '已启用' : '待命'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* ── Block List ── */}
            <div className="fb-warm-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  屏蔽列表
                  <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">
                    {enabledCount}/{sites.length} 已启用
                  </span>
                </h3>
              </div>

              {sites.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="text-5xl mb-3" style={{ filter: 'drop-shadow(0 4px 8px rgba(44, 24, 16, 0.1))' }}>🛡️</div>
                  <h4 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">暂无屏蔽规则</h4>
                  <p className="text-sm text-[var(--color-text-muted)] mb-4">
                    添加让你分心的网站，专注模式下会自动屏蔽它们。
                  </p>
                  <button className="fb-add-btn" onClick={() => setAddOpen(true)}>添加网站</button>
                </div>
              ) : (
                <div>
                  {sites.map((site, idx) => (
                    <div key={site.id}>
                      {idx > 0 && <div className="fb-divider my-0.5" />}
                      <div
                        className={[
                          'fb-site-row flex items-center justify-between px-4 py-3',
                          !site.enabled && 'opacity-50',
                        ].filter(Boolean).join(' ')}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="flex items-center justify-center rounded-lg text-sm"
                            style={{
                              width: 32, height: 32,
                              background: site.enabled
                                ? 'linear-gradient(135deg, rgba(254,248,240,1) 0%, rgba(253,242,230,1) 100%)'
                                : 'rgba(44, 24, 16, 0.04)',
                              boxShadow: site.enabled ? '0 1px 3px rgba(44, 24, 16, 0.06)' : 'none',
                            }}
                          >
                            🌐
                          </span>
                          <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{site.domain}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            onClick={() => handleToggle(site.id)}
                            className={`fb-toggle-track ${site.enabled ? 'enabled' : 'disabled'}`}
                            aria-label={site.enabled ? '禁用' : '启用'}
                          >
                            <div className="fb-toggle-thumb" />
                          </button>
                          <button
                            onClick={() => handleDelete(site.id)}
                            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            aria-label="删除"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M3 3l8 8M11 3l-8 8" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Schedule ── */}
            <div className="fb-warm-card p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">屏蔽时机</h3>
              <div className="space-y-2">
                {SCHEDULE_OPTIONS.map((opt) => {
                  const selected = schedule === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleScheduleChange(opt.value)}
                      className={[
                        'fb-schedule-opt w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer',
                        selected && 'selected',
                      ].filter(Boolean).join(' ')}
                    >
                      <div className={`fb-radio-outer ${selected ? 'selected' : ''}`}>
                        <div className="fb-radio-inner" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{opt.label}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{opt.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Desktop note ── */}
            <div
              className="text-center py-3 px-4"
              style={{
                background: 'linear-gradient(135deg, rgba(254,248,240,0.5) 0%, rgba(253,242,230,0.3) 100%)',
                borderRadius: 16, border: '1px dashed rgba(44, 24, 16, 0.08)',
              }}
            >
              <p className="text-xs text-[var(--color-text-muted)]">
                网站屏蔽功能在桌面端应用中通过系统级 DNS 拦截实现。Web 演示版仅展示配置界面。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Add site modal ── */}
      <Modal
        isOpen={addOpen}
        onClose={() => { setAddOpen(false); setNewDomain('') }}
        title="添加屏蔽网站"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setAddOpen(false); setNewDomain('') }}>
              取消
            </Button>
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={!newDomain.trim()}>
              添加
            </Button>
          </>
        }
      >
        <Input
          label="网站域名"
          value={newDomain}
          onChange={setNewDomain}
          placeholder="例如：weibo.com"
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          不需要输入 http:// 或 www.，会自动清理。
        </p>
      </Modal>

      {/* ── Break Reminder Modal ── */}
      <Modal
        isOpen={showBreakReminderModal || showUrgentBreakReminderModal}
        onClose={handleContinueFocus}
        title={showUrgentBreakReminderModal ? '⚠️ 紧急休息提醒' : '☕ 休息一下吧！'}
        size="sm"
      >
        <div className="text-center py-2">
          {/* Urgency-based styling */}
          <div
            className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: showUrgentBreakReminderModal
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08))'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.08))',
              fontSize: 32,
            }}
          >
            {showUrgentBreakReminderModal ? '🚨' : '☕'}
          </div>

          <p
            className="text-base font-semibold mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            休息一下吧！你已经专注了 {Math.floor(continuousFocusSeconds / 60)} 分钟
          </p>

          {/* Pet dialogue integration */}
          {breakPetMessage && (
            <div className="mb-4">
              <PetDialogue
                message={breakPetMessage}
                mood={showUrgentBreakReminderModal ? 'sad' : 'happy'}
                visible={true}
                autoHide={0}
              />
            </div>
          )}

          {showUrgentBreakReminderModal && (
            <p
              className="text-sm mb-4 px-3 py-2 rounded-lg"
              style={{
                background: 'color-mix(in srgb, var(--color-error, #ef4444) 8%, transparent)',
                color: 'var(--color-error, #ef4444)',
              }}
            >
              长时间不休息会降低专注力和效率，强烈建议休息！
            </p>
          )}

          <div className="flex flex-col gap-2 mt-4">
            <Button
              variant="primary"
              size="md"
              onClick={handleTakeBreak}
              className="!w-full !rounded-xl"
            >
              🧘 休息5分钟
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleContinueFocus}
              className="!w-full !rounded-xl"
            >
              💪 继续专注
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEndSession}
              className="!w-full !rounded-xl"
            >
              结束专注
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ── Slider sub-component ──

function SliderSetting({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-[var(--color-text-primary)]">{label}</span>
        <span className="text-xs tabular-nums text-[var(--color-text-secondary)]">
          {value} {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5"
      />
    </div>
  )
}

// ── Styles constant ──

const FOCUS_STYLES = `
  .focus-page { transition: background-color 1.2s ease; }
  .focus-bg-idle { background-color: var(--color-bg-primary); }
  .focus-bg-warm { background-color: color-mix(in srgb, var(--color-bg-primary) 94%, #f59e0b); }
  .focus-bg-cool { background-color: color-mix(in srgb, var(--color-bg-primary) 94%, #22c55e); }

  @keyframes glowBreathe {
    0%, 100% { transform: scale(1); opacity: 0.12; }
    50% { transform: scale(1.12); opacity: 0.22; }
  }
  .focus-glow-breathe { animation: glowBreathe 4s ease-in-out infinite; }

  .focus-btn-start {
    background: linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 80%, #000)) !important;
    box-shadow: 0 4px 20px color-mix(in srgb, var(--color-accent) 35%, transparent) !important;
  }
  .focus-btn-start:hover {
    box-shadow: 0 6px 28px color-mix(in srgb, var(--color-accent) 45%, transparent) !important;
  }
  .focus-btn-start:active { transform: scale(0.95) !important; }

  .focus-hide-scrollbar::-webkit-scrollbar { display: none; }
  .focus-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  input[type="range"] {
    -webkit-appearance: none; appearance: none;
    height: 4px; border-radius: 2px;
    background: var(--color-border-subtle); outline: none;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 14px; height: 14px; border-radius: 50%;
    background: var(--color-accent); cursor: pointer;
    border: 2px solid var(--color-bg-surface-1);
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  }
  input[type="range"]::-moz-range-thumb {
    width: 14px; height: 14px; border-radius: 50%;
    background: var(--color-accent); cursor: pointer;
    border: 2px solid var(--color-bg-surface-1);
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  }

  @keyframes motivFade {
    0% { opacity: 0; transform: translateY(4px); }
    15% { opacity: 1; transform: translateY(0); }
    85% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-4px); }
  }
  .motiv-msg { animation: motivFade 30s ease-in-out infinite; }

  .ambient-chip {
    padding: 4px 12px; border-radius: 999px; font-size: 12px; cursor: pointer;
    border: 1px solid var(--color-border-subtle);
    background: var(--color-bg-surface-1);
    transition: all 0.2s ease;
  }
  .ambient-chip.active {
    border-color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 15%, transparent);
  }

  @keyframes fb-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fb-page-enter > * { animation: fb-fade-in 0.4s ease-out both; }
  .fb-page-enter > *:nth-child(1) { animation-delay: 0ms; }
  .fb-page-enter > *:nth-child(2) { animation-delay: 60ms; }
  .fb-page-enter > *:nth-child(3) { animation-delay: 120ms; }
  .fb-page-enter > *:nth-child(4) { animation-delay: 180ms; }
  .fb-page-enter > *:nth-child(5) { animation-delay: 240ms; }

  .fb-warm-card {
    background: linear-gradient(135deg, #ffffff 0%, #fef8f0 100%);
    border: 1px solid rgba(44, 24, 16, 0.08);
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(44, 24, 16, 0.06), 0 1px 2px rgba(44, 24, 16, 0.04);
    transition: box-shadow 0.25s ease;
  }
  .fb-warm-card:hover { box-shadow: 0 4px 12px rgba(44, 24, 16, 0.08), 0 2px 4px rgba(44, 24, 16, 0.04); }

  .fb-hero-card {
    background: linear-gradient(135deg, #fef8f0 0%, #fdf2e6 50%, #fef0db 100%);
    border: 1px solid rgba(44, 24, 16, 0.08);
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(44, 24, 16, 0.08), 0 2px 4px rgba(44, 24, 16, 0.04);
  }

  .fb-metric-value {
    background: linear-gradient(135deg, #c06020 0%, #e08a3a 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; font-weight: 800;
  }

  .fb-site-row {
    transition: all 0.2s ease; border-radius: 12px;
  }
  .fb-site-row:hover {
    background: rgba(254, 248, 240, 0.7);
    box-shadow: 0 1px 3px rgba(44, 24, 16, 0.06);
    transform: translateX(2px);
  }

  .fb-toggle-track {
    position: relative; width: 40px; height: 22px; border-radius: 11px;
    transition: background 0.25s ease, box-shadow 0.25s ease; cursor: pointer; flex-shrink: 0;
  }
  .fb-toggle-track.enabled {
    background: linear-gradient(135deg, #e08a3a 0%, #d07030 100%);
    box-shadow: 0 2px 8px rgba(217, 119, 52, 0.3);
  }
  .fb-toggle-track.disabled { background: rgba(44, 24, 16, 0.12); }
  .fb-toggle-thumb {
    position: absolute; top: 2px; width: 18px; height: 18px; border-radius: 50%;
    background: white; box-shadow: 0 1px 3px rgba(44, 24, 16, 0.15);
    transition: left 0.25s ease;
  }
  .fb-toggle-track.enabled .fb-toggle-thumb { left: 20px; }
  .fb-toggle-track.disabled .fb-toggle-thumb { left: 2px; }

  .fb-schedule-opt {
    border-radius: 12px; border: 1.5px solid rgba(44, 24, 16, 0.08);
    transition: all 0.2s ease;
  }
  .fb-schedule-opt:hover { border-color: rgba(217, 119, 52, 0.3); background: rgba(254, 248, 240, 0.5); }
  .fb-schedule-opt.selected {
    border-color: var(--color-accent);
    background: linear-gradient(135deg, rgba(254, 248, 240, 0.8) 0%, rgba(253, 242, 230, 0.6) 100%);
    box-shadow: 0 0 0 3px rgba(217, 119, 52, 0.15);
  }

  .fb-radio-outer {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid rgba(44, 24, 16, 0.08);
    display: flex; align-items: center; justify-content: center;
    transition: border-color 0.2s ease; flex-shrink: 0;
  }
  .fb-radio-outer.selected { border-color: var(--color-accent); }
  .fb-radio-inner {
    width: 8px; height: 8px; border-radius: 50%;
    background: linear-gradient(135deg, #e08a3a 0%, #d07030 100%);
    transform: scale(0); transition: transform 0.2s ease;
  }
  .fb-radio-outer.selected .fb-radio-inner { transform: scale(1); }

  .fb-add-btn {
    background: linear-gradient(135deg, #e08a3a 0%, #d07030 100%);
    color: white; border: none; border-radius: 12px;
    box-shadow: 0 4px 16px rgba(217, 119, 52, 0.25);
    font-weight: 600; font-size: 14px; padding: 8px 20px; cursor: pointer;
    transition: all 0.25s ease; display: inline-flex; align-items: center; gap: 6px;
  }
  .fb-add-btn:hover { box-shadow: 0 6px 20px rgba(217, 119, 52, 0.35); transform: translateY(-1px); }
  .fb-add-btn:active { transform: translateY(0); }

  .fb-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(44, 24, 16, 0.08) 20%, rgba(44, 24, 16, 0.08) 80%, transparent 100%);
  }

  @keyframes fb-pulse-ring {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.8); opacity: 0; }
  }
  .fb-status-dot { position: relative; }
  .fb-status-dot .dot-ring {
    position: absolute; inset: -4px; border-radius: 50%;
    border: 2px solid currentColor; opacity: 0;
  }
  .fb-status-dot.blocking .dot-ring { animation: fb-pulse-ring 2s ease-in-out infinite; opacity: 1; }

  .focus-tab-bar {
    display: flex; gap: 0; border-bottom: 1px solid var(--color-border-subtle);
    background: var(--color-bg-surface-1);
    position: sticky; top: 0; z-index: 20;
  }
  .focus-tab {
    flex: 1; padding: 14px 0; text-align: center; font-size: 14px; font-weight: 600;
    color: var(--color-text-muted); cursor: pointer; position: relative;
    transition: color 0.2s ease; border: none; background: none;
  }
  .focus-tab.active { color: var(--color-text-primary); }
  .focus-tab.active::after {
    content: ''; position: absolute; bottom: -1px; left: 20%; right: 20%;
    height: 2px; border-radius: 1px; background: var(--color-accent);
  }
  .focus-tab:hover:not(.active) { color: var(--color-text-secondary); }

  @keyframes breakReminderSlide {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .break-reminder-enter { animation: breakReminderSlide 0.4s ease-out; }
`
