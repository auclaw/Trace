import { useState, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import { Button, Badge, Input, Modal } from '../components/ui'

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

/* ── Premium warm design styles ── */
const warmStyles = `
  :root {
    --fb-warm-shadow-sm: 0 1px 3px rgba(44, 24, 16, 0.06), 0 1px 2px rgba(44, 24, 16, 0.04);
    --fb-warm-shadow-md: 0 4px 12px rgba(44, 24, 16, 0.08), 0 2px 4px rgba(44, 24, 16, 0.04);
    --fb-warm-shadow-lg: 0 8px 24px rgba(44, 24, 16, 0.10), 0 4px 8px rgba(44, 24, 16, 0.05);
    --fb-warm-shadow-accent: 0 4px 16px rgba(217, 119, 52, 0.25);
    --fb-gradient-card: linear-gradient(135deg, #ffffff 0%, #fef8f0 100%);
    --fb-gradient-hero: linear-gradient(135deg, #fef8f0 0%, #fdf2e6 50%, #fef0db 100%);
    --fb-gradient-accent: linear-gradient(135deg, #e08a3a 0%, #d07030 100%);
    --fb-gradient-metric: linear-gradient(135deg, #c06020 0%, #e08a3a 100%);
    --fb-accent-glow: rgba(217, 119, 52, 0.15);
    --fb-border-warm: rgba(44, 24, 16, 0.08);
    --fb-radius-lg: 16px;
    --fb-radius-md: 12px;
  }

  @keyframes fb-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fb-pulse-warm {
    0%, 100% { box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.5); }
    50% { box-shadow: 0 0 0 6px rgba(72, 187, 120, 0); }
  }

  @keyframes fb-pulse-ring {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.8); opacity: 0; }
  }

  .fb-page-enter > * {
    animation: fb-fade-in 0.4s ease-out both;
  }
  .fb-page-enter > *:nth-child(1) { animation-delay: 0ms; }
  .fb-page-enter > *:nth-child(2) { animation-delay: 60ms; }
  .fb-page-enter > *:nth-child(3) { animation-delay: 120ms; }
  .fb-page-enter > *:nth-child(4) { animation-delay: 180ms; }
  .fb-page-enter > *:nth-child(5) { animation-delay: 240ms; }
  .fb-page-enter > *:nth-child(6) { animation-delay: 300ms; }
  .fb-page-enter > *:nth-child(7) { animation-delay: 360ms; }

  .fb-warm-card {
    background: var(--fb-gradient-card);
    border: 1px solid var(--fb-border-warm);
    border-radius: var(--fb-radius-lg);
    box-shadow: var(--fb-warm-shadow-sm);
    transition: box-shadow 0.25s ease, transform 0.25s ease;
  }
  .fb-warm-card:hover {
    box-shadow: var(--fb-warm-shadow-md);
  }

  .fb-hero-card {
    background: var(--fb-gradient-hero);
    border: 1px solid var(--fb-border-warm);
    border-radius: var(--fb-radius-lg);
    box-shadow: var(--fb-warm-shadow-md);
  }

  .fb-metric-value {
    background: var(--fb-gradient-metric);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 800;
  }

  .fb-site-row {
    transition: all 0.2s ease;
    border-radius: var(--fb-radius-md);
  }
  .fb-site-row:hover {
    background: rgba(254, 248, 240, 0.7);
    box-shadow: var(--fb-warm-shadow-sm);
    transform: translateX(2px);
  }

  .fb-toggle-track {
    position: relative;
    width: 40px;
    height: 22px;
    border-radius: 11px;
    transition: background 0.25s ease, box-shadow 0.25s ease;
    cursor: pointer;
    flex-shrink: 0;
  }
  .fb-toggle-track.enabled {
    background: var(--fb-gradient-accent);
    box-shadow: 0 2px 8px rgba(217, 119, 52, 0.3);
  }
  .fb-toggle-track.disabled {
    background: rgba(44, 24, 16, 0.12);
  }
  .fb-toggle-thumb {
    position: absolute;
    top: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(44, 24, 16, 0.15);
    transition: left 0.25s ease;
  }
  .fb-toggle-track.enabled .fb-toggle-thumb { left: 20px; }
  .fb-toggle-track.disabled .fb-toggle-thumb { left: 2px; }

  .fb-schedule-opt {
    border-radius: var(--fb-radius-md);
    border: 1.5px solid var(--fb-border-warm);
    transition: all 0.2s ease;
  }
  .fb-schedule-opt:hover {
    border-color: rgba(217, 119, 52, 0.3);
    background: rgba(254, 248, 240, 0.5);
  }
  .fb-schedule-opt.selected {
    border-color: var(--color-accent);
    background: linear-gradient(135deg, rgba(254, 248, 240, 0.8) 0%, rgba(253, 242, 230, 0.6) 100%);
    box-shadow: 0 0 0 3px var(--fb-accent-glow);
  }

  .fb-radio-outer {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--fb-border-warm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s ease;
    flex-shrink: 0;
  }
  .fb-radio-outer.selected {
    border-color: var(--color-accent);
  }
  .fb-radio-inner {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--fb-gradient-accent);
    transform: scale(0);
    transition: transform 0.2s ease;
  }
  .fb-radio-outer.selected .fb-radio-inner {
    transform: scale(1);
  }

  .fb-add-btn {
    background: var(--fb-gradient-accent);
    color: white;
    border: none;
    border-radius: var(--fb-radius-md);
    box-shadow: var(--fb-warm-shadow-accent);
    font-weight: 600;
    font-size: 14px;
    padding: 8px 20px;
    cursor: pointer;
    transition: all 0.25s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .fb-add-btn:hover {
    box-shadow: 0 6px 20px rgba(217, 119, 52, 0.35);
    transform: translateY(-1px);
  }
  .fb-add-btn:active {
    transform: translateY(0);
  }

  .fb-status-dot {
    position: relative;
  }
  .fb-status-dot .dot-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid currentColor;
    opacity: 0;
  }
  .fb-status-dot.blocking .dot-ring {
    animation: fb-pulse-ring 2s ease-in-out infinite;
    opacity: 1;
  }

  .fb-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, var(--fb-border-warm) 20%, var(--fb-border-warm) 80%, transparent 100%);
  }

  .fb-empty-state {
    padding: 40px 20px;
    text-align: center;
  }
  .fb-empty-state .fb-shield {
    font-size: 48px;
    margin-bottom: 12px;
    filter: drop-shadow(0 4px 8px rgba(44, 24, 16, 0.1));
  }

  .fb-modal-input:focus {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--fb-accent-glow);
  }

  .fb-stats-row {
    display: flex;
    gap: 16px;
    justify-content: center;
  }
  .fb-stat-item {
    text-align: center;
  }
`

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
    <>
      <style>{warmStyles}</style>
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6 fb-page-enter">
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
          <button className="fb-add-btn" onClick={() => setAddOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M7 1v12M1 7h12" />
            </svg>
            添加
          </button>
        </div>

        {/* ─── Hero Status Card ─── */}
        <div className="fb-hero-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`fb-status-dot ${isBlocking ? 'blocking' : ''}`}>
                <div
                  className="rounded-full"
                  style={{
                    width: 14,
                    height: 14,
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
                  {isBlocking
                    ? `正在屏蔽 ${enabledCount} 个网站`
                    : '开始专注后自动激活屏蔽'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="fb-stats-row" style={{ marginRight: 8 }}>
                <div className="fb-stat-item">
                  <span className="fb-metric-value text-xl">{enabledCount}</span>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">已启用</p>
                </div>
                <div className="fb-stat-item">
                  <span className="fb-metric-value text-xl">{sites.length}</span>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">总规则</p>
                </div>
              </div>
              <Badge variant={isBlocking ? 'success' : 'default'} size="md">
                {isBlocking ? '已启用' : '待命'}
              </Badge>
            </div>
          </div>
        </div>

        {/* ─── Block List ─── */}
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
            <div className="fb-empty-state">
              <div className="fb-shield">🛡️</div>
              <h4 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                暂无屏蔽规则
              </h4>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                添加让你分心的网站，专注模式下会自动屏蔽它们。
              </p>
              <button className="fb-add-btn" onClick={() => setAddOpen(true)}>
                添加网站
              </button>
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
                          width: 32,
                          height: 32,
                          background: site.enabled
                            ? 'linear-gradient(135deg, rgba(254,248,240,1) 0%, rgba(253,242,230,1) 100%)'
                            : 'rgba(44, 24, 16, 0.04)',
                          boxShadow: site.enabled ? 'var(--fb-warm-shadow-sm)' : 'none',
                        }}
                      >
                        🌐
                      </span>
                      <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {site.domain}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Toggle switch */}
                      <button
                        onClick={() => handleToggle(site.id)}
                        className={`fb-toggle-track ${site.enabled ? 'enabled' : 'disabled'}`}
                        aria-label={site.enabled ? '禁用' : '启用'}
                      >
                        <div className="fb-toggle-thumb" />
                      </button>
                      {/* Delete */}
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

        {/* ─── Schedule ─── */}
        <div className="fb-warm-card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
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
                    'fb-schedule-opt w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer',
                    selected && 'selected',
                  ].filter(Boolean).join(' ')}
                >
                  <div className={`fb-radio-outer ${selected ? 'selected' : ''}`}>
                    <div className="fb-radio-inner" />
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
        </div>

        {/* ─── Desktop note ─── */}
        <div
          className="text-center py-3 px-4"
          style={{
            background: 'linear-gradient(135deg, rgba(254,248,240,0.5) 0%, rgba(253,242,230,0.3) 100%)',
            borderRadius: 'var(--fb-radius-lg)',
            border: '1px dashed var(--fb-border-warm)',
          }}
        >
          <p className="text-xs text-[var(--color-text-muted)]">
            网站屏蔽功能在桌面端应用中通过系统级 DNS 拦截实现。Web 演示版仅展示配置界面。
          </p>
        </div>

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
    </>
  )
}
