import { useState, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import { Card, Button, Badge, Input, EmptyState, Modal } from '../components/ui'

/* ── Types ── */
interface BlockedSite {
  id: string
  domain: string
  enabled: boolean
}

type ScheduleMode = 'focus' | 'always' | 'custom'

const LS_KEY = 'merize-flow-blocks'
const LS_SCHEDULE_KEY = 'merize-flow-blocks-schedule'

/* ── Storage helpers ── */
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

/* ══════════════════════════════════════════════════
   Flow Blocks Page
   ══════════════════════════════════════════════════ */
export default function FlowBlocks() {
  useTheme() // hook must be called for theme reactivity
  const focusState = useAppStore((s) => s.focusState)
  const addToast = useAppStore((s) => s.addToast)

  const [sites, setSites] = useState<BlockedSite[]>(loadSites)
  const [schedule, setSchedule] = useState<ScheduleMode>(loadSchedule)
  const [addOpen, setAddOpen] = useState(false)
  const [newDomain, setNewDomain] = useState('')

  const isBlocking = focusState === 'working'

  /* ── CRUD ── */
  const persist = useCallback((next: BlockedSite[]) => {
    setSites(next)
    saveSites(next)
  }, [])

  const handleAdd = useCallback(() => {
    let domain = newDomain.trim().toLowerCase()
    if (!domain) return
    // Clean domain
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

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
            心流屏蔽
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            专注时自动屏蔽分心网站，帮你进入并保持心流状态
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
          + 添加
        </Button>
      </div>

      {/* ─── Current Status ─── */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={[
                'w-3 h-3 rounded-full',
                isBlocking ? 'bg-green-500 animate-pulse' : 'bg-[var(--color-border-subtle)]',
              ].join(' ')}
            />
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {isBlocking ? '屏蔽中' : '未激活'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {isBlocking
                  ? `正在屏蔽 ${enabledCount} 个网站`
                  : '开始专注后自动激活屏蔽'}
              </p>
            </div>
          </div>
          <Badge variant={isBlocking ? 'success' : 'default'} size="md">
            {isBlocking ? '已启用' : '待命'}
          </Badge>
        </div>
      </Card>

      {/* ─── Block List ─── */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          屏蔽列表
          <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">
            {enabledCount}/{sites.length} 已启用
          </span>
        </h3>

        {sites.length === 0 ? (
          <EmptyState
            icon="🛡️"
            title="暂无屏蔽规则"
            description="添加让你分心的网站，专注模式下会自动屏蔽它们。"
            action={
              <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
                添加网站
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {sites.map((site) => (
              <div
                key={site.id}
                className={[
                  'flex items-center justify-between px-4 py-3 rounded-xl',
                  'border border-[var(--color-border-subtle)]/40',
                  'transition-colors',
                  site.enabled
                    ? 'bg-[var(--color-accent-soft)]/30'
                    : 'bg-[var(--color-bg-surface-2)]/50 opacity-60',
                ].join(' ')}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm">🌐</span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {site.domain}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(site.id)}
                    className={[
                      'px-3 py-1 text-xs rounded-full font-medium transition-colors cursor-pointer',
                      site.enabled
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-surface-2)] text-[var(--color-text-muted)]',
                    ].join(' ')}
                  >
                    {site.enabled ? '已启用' : '已禁用'}
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
            ))}
          </div>
        )}
      </Card>

      {/* ─── Schedule ─── */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          屏蔽时机
        </h3>
        <div className="space-y-2">
          {SCHEDULE_OPTIONS.map((opt) => {
            const selected = schedule === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => handleScheduleChange(opt.value)}
                className={[
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer',
                  'border',
                  selected
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                    : 'border-[var(--color-border-subtle)]/50 hover:border-[var(--color-border-subtle)]',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                    selected
                      ? 'border-[var(--color-accent)]'
                      : 'border-[var(--color-border-subtle)]',
                  ].join(' ')}
                >
                  {selected && (
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {opt.label}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">{opt.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* ─── Desktop note ─── */}
      <Card padding="sm" className="text-center">
        <p className="text-xs text-[var(--color-text-muted)]">
          网站屏蔽功能在桌面端应用中通过系统级 DNS 拦截实现。Web 演示版仅展示配置界面。
        </p>
      </Card>

      {/* ─── Add Modal ─── */}
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
    </div>
  )
}
