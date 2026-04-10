import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import dataService, { Activity, ActivityCategory, TimeBlock } from '../services/dataService'
import { CATEGORY_COLORS } from '../config/themes'
import { useToast } from '../components/ui/Toast'
import EmptyState from '../components/ui/EmptyState'

/* ── Helpers ── */
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtDuration(mins: number, t: (key: string) => string): string {
  if (mins < 60) return `${mins}${t('common.minutes')}`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}${t('common.hours')} ${m}${t('common.minutes')}` : `${h}${t('common.hours')}`
}

function minutesSinceMidnight(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

const HOUR_HEIGHT = 72 // px per hour

/* ── Granularity modes ── */
const GRANULARITY_MIN = 1
const GRANULARITY_MAX = 5
const GRANULARITY_LABELS: Record<number, { labelKey: string; descKey: string }> = {
  1: { labelKey: 'timeline.coarse', descKey: 'timeline.coarseDesc' },
  2: { labelKey: 'timeline.coarseMedium', descKey: 'timeline.coarseMediumDesc' },
  3: { labelKey: 'timeline.medium', descKey: 'timeline.mediumDesc' },
  4: { labelKey: 'timeline.fineMedium', descKey: 'timeline.fineMediumDesc' },
  5: { labelKey: 'timeline.fine', descKey: 'timeline.fineDesc' },
}

/* ── Work hours config ── */
const WORK_HOUR_START = 9
const WORK_HOUR_END = 18

/* ── Category picker modal ── */
// SECTION: CategoryPicker
function CategoryPicker({
  current,
  onSelect,
  onClose,
}: {
  current: ActivityCategory
  onSelect: (cat: ActivityCategory) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const categories = Object.keys(CATEGORY_COLORS) as ActivityCategory[]
  return (
    <div
      className="absolute left-full ml-2 top-0 z-50 rounded-[var(--radius-lg)] p-2 min-w-[140px]"
      style={{
        background: 'var(--color-bg-surface-1)',
        border: '1px solid var(--color-border-subtle)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div className="text-[11px] font-medium px-2 py-1 mb-1" style={{ color: 'var(--color-text-muted)' }}>
        {t('timeline.reclassify')}
      </div>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => { onSelect(cat); onClose() }}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-[var(--radius-sm)] text-left text-[13px] transition-colors"
          style={{
            background: cat === current ? 'var(--color-accent-soft)' : 'transparent',
            color: 'var(--color-text-primary)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-surface-2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = cat === current ? 'var(--color-accent-soft)' : 'transparent' }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: CATEGORY_COLORS[cat] || '#94a3b8' }}
          />
          {cat}
        </button>
      ))}
    </div>
  )
}

/* ── Inline activity block with category editing ── */
function TimelineActivityBlock({
  activity,
  adjustedTop,
  onCategoryChange,
  batchMode,
  isSelected,
  onToggleSelect,
  isPersonalTime,
}: {
  activity: Activity
  adjustedTop: number
  onCategoryChange: (id: string, cat: ActivityCategory) => void
  batchMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  isPersonalTime?: boolean
}) {
  const { t } = useTranslation()
  const [showPicker, setShowPicker] = useState(false)
  const color = CATEGORY_COLORS[activity.category] || '#94a3b8'
  const height = Math.max((activity.duration / 60) * HOUR_HEIGHT, 28)

  return (
    <div
      className="absolute left-[72px] right-4 group/block"
      style={{ top: `${adjustedTop}px`, height: `${height}px`, zIndex: 10 }}
    >
      <div
        className="relative flex h-full rounded-[var(--radius-md)] overflow-hidden cursor-pointer transition-shadow duration-150 hover:shadow-md"
        style={{
          background: `${color}14`,
          border: `1px solid ${isSelected ? 'var(--color-accent)' : `${color}30`}`,
          boxShadow: isSelected ? '0 0 0 2px var(--color-accent-soft)' : undefined,
        }}
        onClick={() => batchMode ? onToggleSelect?.(activity.id) : setShowPicker(!showPicker)}
      >
        {/* Batch checkbox */}
        {batchMode && (
          <div className="flex items-center pl-2 flex-shrink-0">
            <span
              className="w-4 h-4 rounded flex items-center justify-center border"
              style={{
                background: isSelected ? 'var(--color-accent)' : 'transparent',
                borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border-subtle)',
              }}
            >
              {isSelected && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
            </span>
          </div>
        )}
        {/* Personal time indicator */}
        {isPersonalTime && !batchMode && (
          <div
            className="flex items-center pl-1.5 flex-shrink-0"
            title={t('timeline.personalTime')}
          >
            <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: 'var(--color-bg-surface-2)', color: 'var(--color-text-muted)' }}>
              {t('timeline.personal')}
            </span>
          </div>
        )}
        <div className="w-[4px] flex-shrink-0 rounded-l-[var(--radius-md)]" style={{ background: color }} />
        <div className="flex-1 min-w-0 px-3 py-1.5 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
              {activity.name}
            </span>
            {activity.isManual && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'var(--color-bg-surface-2)', color: 'var(--color-text-muted)' }}
              >
                {t('timeline.manual')}
              </span>
            )}
          </div>
          {height >= 40 && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                {fmtTime(activity.startTime)} - {fmtTime(activity.endTime)}
              </span>
              <span className="text-[11px] font-medium" style={{ color }}>
                {fmtDuration(activity.duration, t)}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: `${color}18`, color }}
              >
                {activity.category}
              </span>
            </div>
          )}
        </div>
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-100 transition-opacity text-[11px] px-1.5 py-0.5 rounded"
          style={{ background: 'var(--color-bg-surface-2)', color: 'var(--color-text-muted)' }}
        >
          {t('timeline.clickToEdit')}
        </div>
      </div>
      {showPicker && (
        <CategoryPicker
          current={activity.category}
          onSelect={(cat) => onCategoryChange(activity.id, cat)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

/* ── Plan vs Actual comparison card ── */
// SECTION: PlanActualCard
function PlanActualCard({
  block,
  actual,
}: {
  block: TimeBlock
  actual: Activity | undefined
}) {
  const { t } = useTranslation()
  const planColor = CATEGORY_COLORS[block.category] || '#94a3b8'
  const actualColor = actual ? (CATEGORY_COLORS[actual.category] || '#94a3b8') : '#94a3b8'

  return (
    <div
      className="flex gap-3 p-3 rounded-[var(--radius-md)] mb-2"
      style={{ background: 'var(--color-bg-surface-2)', border: '1px solid var(--color-border-subtle)' }}
    >
      {/* Plan side */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
          {t('dashboard.planned')}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: planColor }} />
          <span className="text-[12px] truncate" style={{ color: 'var(--color-text-primary)' }}>{block.title}</span>
        </div>
        <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          {fmtTime(block.startTime)} - {fmtTime(block.endTime)}
        </span>
      </div>
      {/* Divider */}
      <div className="w-px" style={{ background: 'var(--color-border-subtle)' }} />
      {/* Actual side */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
          {t('dashboard.actual')}
        </div>
        {actual ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: actualColor }} />
              <span className="text-[12px] truncate" style={{ color: 'var(--color-text-primary)' }}>{actual.name}</span>
            </div>
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {fmtTime(actual.startTime)} - {fmtTime(actual.endTime)}
            </span>
          </>
        ) : (
          <span className="text-[12px] italic" style={{ color: 'var(--color-text-muted)' }}>{t('common.noData')}</span>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function Timeline() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const today = toDateStr(new Date())
  const [activities, setActivities] = useState<Activity[]>([])
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [now, setNow] = useState(new Date())
  const [privacyLevel, setPrivacyLevel] = useState<number>(2) // 0=public,1=team,2=private
  const [granularity, setGranularity] = useState<number>(3)
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBatchCategoryPicker, setShowBatchCategoryPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Load data
  useEffect(() => {
    setActivities(dataService.getActivities(today))
    setTimeBlocks(dataService.getTimeBlocks(today))
  }, [today])

  // Tick clock every 30s
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  // Scroll to current time on mount
  useEffect(() => {
    if (timelineRef.current) {
      const nowMins = now.getHours() * 60 + now.getMinutes()
      const scrollTarget = (nowMins / 60) * HOUR_HEIGHT - 200
      timelineRef.current.scrollTop = Math.max(0, scrollTarget)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities.length])

  // Category change handler
  const handleCategoryChange = useCallback(
    (id: string, cat: ActivityCategory) => {
      dataService.updateActivity(id, { category: cat })
      setActivities(dataService.getActivities(today))
    },
    [today],
  )

  // Sorted activities
  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [activities],
  )

  // Granularity-filtered activities
  // Level 1: hide activities <30 min; Level 2: hide <15 min; Level 3: show all >=5 min (standard)
  // Level 4: show all >=2 min; Level 5: show everything
  const filteredActivities = useMemo(() => {
    const thresholds: Record<number, number> = { 1: 30, 2: 15, 3: 5, 4: 2, 5: 0 }
    const minDuration = thresholds[granularity] ?? 5
    if (minDuration === 0) return sortedActivities
    return sortedActivities.filter((a) => a.duration >= minDuration)
  }, [sortedActivities, granularity])

  // Context switch counter — counts category transitions
  const contextSwitches = useMemo(() => {
    if (sortedActivities.length < 2) return 0
    let switches = 0
    for (let i = 1; i < sortedActivities.length; i++) {
      if (sortedActivities[i].category !== sortedActivities[i - 1].category) switches++
    }
    return switches
  }, [sortedActivities])

  // Batch selection handlers
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(filteredActivities.map((a) => a.id)))
  }, [filteredActivities])

  const handleBatchClear = useCallback(() => {
    setSelectedIds(new Set())
    setBatchMode(false)
  }, [])

  // Batch operations
  const handleBatchCategorize = useCallback((category: ActivityCategory) => {
    selectedIds.forEach((id) => {
      dataService.updateActivity(id, { category })
    })
    setActivities(dataService.getActivities(today))
    const count = selectedIds.size
    setSelectedIds(new Set())
    setShowBatchCategoryPicker(false)
    toast(t('timeline.categoryUpdated', { count }), 'success')
  }, [selectedIds, today, toast, t])

  const handleConfirmBatchDelete = useCallback(() => {
    selectedIds.forEach((id) => {
      dataService.deleteActivity(id)
    })
    setActivities(dataService.getActivities(today))
    const count = selectedIds.size
    setSelectedIds(new Set())
    setBatchMode(false)
    setShowDeleteConfirm(false)
    toast(t('timeline.deleteCompleted', { count }), 'success')
  }, [selectedIds, today, toast, t])

  // Current activity (simulated tracking)
  const currentActivity = useMemo(() => {
    const nowISO = now.toISOString().split('.')[0]
    return sortedActivities.find((a) => a.startTime <= nowISO && a.endTime >= nowISO)
  }, [sortedActivities, now])

  // Current hour's planned block
  const currentHour = now.getHours()
  const currentPlannedBlock = useMemo(
    () =>
      timeBlocks.find((b) => {
        const bHour = new Date(b.startTime).getHours()
        const bEndHour = new Date(b.endTime).getHours()
        return currentHour >= bHour && currentHour < bEndHour
      }),
    [timeBlocks, currentHour],
  )

  // Matching actual for plan
  const matchingActual = useMemo(() => {
    if (!currentPlannedBlock) return undefined
    return sortedActivities.find((a) => {
      const aStart = minutesSinceMidnight(a.startTime)
      const bStart = minutesSinceMidnight(currentPlannedBlock.startTime)
      const bEnd = minutesSinceMidnight(currentPlannedBlock.endTime)
      return aStart >= bStart - 30 && aStart <= bEnd
    })
  }, [currentPlannedBlock, sortedActivities])

  // Summary stats
  const totalMinutes = useMemo(() => activities.reduce((s, a) => s + a.duration, 0), [activities])
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    activities.forEach((a) => { map[a.category] = (map[a.category] || 0) + a.duration })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [activities])

  // Hours to render (6am - 23pm)
  const hours = useMemo(() => Array.from({ length: 18 }, (_, i) => i + 6), [])

  return (
    <div className="flex-1 max-w-5xl mx-auto px-6 py-6">
      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              ⏱️ {t('timeline.title')}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {today} — {t('timeline.activity')} {t('timeline.tracking')}
            </p>
          </div>
          {/* Privacy toggle */}
          <button
            onClick={() => setPrivacyLevel((p) => (p + 1) % 3)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-[12px] transition-colors"
            style={{
              background: 'var(--color-bg-surface-2)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <span>{['🌍', '👥', '🔒'][privacyLevel]}</span>
            {t(`timeline.${['basic', 'standard', 'detailed'][privacyLevel]}`)}
          </button>
        </div>
      </div>

      {/* ── Granularity slider & Batch toggle ── */}
      <div
        className="flex items-center gap-4 mb-4 p-3 rounded-[var(--radius-lg)]"
        style={{ background: 'var(--color-bg-surface-1)', border: '1px solid var(--color-border-subtle)' }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>{t('timeline.granularity')}</div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--color-text-muted)', width: 24 }}>{t('timeline.coarse')}</span>
            <input
              type="range"
              min={GRANULARITY_MIN}
              max={GRANULARITY_MAX}
              step={1}
              value={granularity}
              onChange={(e) => setGranularity(Number(e.target.value))}
              className="flex-1 cursor-pointer"
              style={{
                accentColor: 'var(--color-accent)',
                height: 4,
              }}
            />
            <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--color-text-muted)', width: 24 }}>{t('timeline.fine')}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--color-accent-soft)',
                color: 'var(--color-accent)',
              }}
            >
              {t(GRANULARITY_LABELS[granularity]?.labelKey)}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {t(GRANULARITY_LABELS[granularity]?.descKey)}
            </span>
          </div>
        </div>
        <div className="h-8 w-px" style={{ background: 'var(--color-border-subtle)' }} />
        <button
          onClick={() => { setBatchMode((v) => !v); if (batchMode) setSelectedIds(new Set()) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-[12px] transition-all"
          style={{
            background: batchMode ? 'var(--color-accent)' : 'var(--color-bg-surface-2)',
            color: batchMode ? '#fff' : 'var(--color-text-secondary)',
            border: `1px solid ${batchMode ? 'var(--color-accent)' : 'var(--color-border-subtle)'}`,
            fontWeight: batchMode ? 600 : 400,
          }}
        >
          {batchMode ? t('common.cancel') : t('timeline.batchActions')}
        </button>
      </div>

      {/* ── Currently tracking banner ── */}
      <div
        className="rounded-[var(--radius-lg)] p-4 mb-5"
        style={{
          background: currentActivity
            ? `${CATEGORY_COLORS[currentActivity.category] || '#94a3b8'}10`
            : 'var(--color-bg-surface-2)',
          border: `1px solid ${currentActivity ? `${CATEGORY_COLORS[currentActivity.category]}30` : 'var(--color-border-subtle)'}`,
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="relative flex h-3 w-3"
          >
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: currentActivity ? CATEGORY_COLORS[currentActivity.category] : 'var(--color-accent)' }}
            />
            <span
              className="relative inline-flex rounded-full h-3 w-3"
              style={{ background: currentActivity ? CATEGORY_COLORS[currentActivity.category] : 'var(--color-accent)' }}
            />
          </span>
          {currentActivity ? (
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {t('dashboard.tracking')}: {currentActivity.name}
              </span>
              <span className="text-[12px] ml-2" style={{ color: 'var(--color-text-muted)' }}>
                {fmtTime(currentActivity.startTime)} {t('dashboard.started')} · {currentActivity.category}
              </span>
            </div>
          ) : (
            <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
              {t('timeline.idle')}
            </span>
          )}
        </div>
      </div>

      {/* ── Top summary row ── */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {/* Total time */}
        <div
          className="rounded-[var(--radius-lg)] p-3"
          style={{ background: 'var(--color-bg-surface-1)', border: '1px solid var(--color-border-subtle)' }}
        >
          <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('timeline.total')}</div>
          <div className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>{fmtDuration(totalMinutes, t)}</div>
        </div>
        {/* Activity count */}
        <div
          className="rounded-[var(--radius-lg)] p-3"
          style={{ background: 'var(--color-bg-surface-1)', border: '1px solid var(--color-border-subtle)' }}
        >
          <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('timeline.activity')}</div>
          <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{activities.length}</div>
        </div>
        {/* Top category */}
        <div
          className="rounded-[var(--radius-lg)] p-3"
          style={{ background: 'var(--color-bg-surface-1)', border: '1px solid var(--color-border-subtle)' }}
        >
          <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('timeline.topCategory')}</div>
          {categoryBreakdown.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: CATEGORY_COLORS[categoryBreakdown[0][0]] || '#94a3b8' }}
              />
              <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {categoryBreakdown[0][0]}
              </span>
              <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                {fmtDuration(categoryBreakdown[0][1], t)}
              </span>
            </div>
          ) : (
            <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>--</span>
          )}
        </div>
        {/* Context switch counter */}
        <div
          className="rounded-[var(--radius-lg)] p-3"
          style={{ background: 'var(--color-bg-surface-1)', border: '1px solid var(--color-border-subtle)' }}
        >
          <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('timeline.contextSwitch')}</div>
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-bold"
              style={{ color: contextSwitches <= 5 ? 'var(--color-success, #22c55e)' : contextSwitches <= 12 ? 'var(--color-warning, #f59e0b)' : 'var(--color-error, #ef4444)' }}
            >
              {contextSwitches}
            </span>
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: contextSwitches <= 5 ? 'var(--color-success, #22c55e)' : contextSwitches <= 12 ? 'var(--color-warning, #f59e0b)' : 'var(--color-error, #ef4444)' }}
            />
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {contextSwitches <= 5 ? t('timeline.excellent') : contextSwitches <= 12 ? t('timeline.average') : t('timeline.high')}
            </span>
          </div>
        </div>
      </div>

      {/* ── Plan vs Actual (if there's a current planned block) ── */}
      {currentPlannedBlock && (
        <div className="mb-5">
          <div className="text-[12px] font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            📅 {t('timeline.currentPeriod')} · {t('dashboard.planned')} {t('common.vs')} {t('dashboard.actual')}
          </div>
          <PlanActualCard block={currentPlannedBlock} actual={matchingActual} />
        </div>
      )}

      {/* ── Category breakdown bar ── */}
      {categoryBreakdown.length > 0 && (
        <div className="mb-5">
          <div className="text-[12px] font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            {t('timeline.categoryDistribution')}
          </div>
          <div className="flex h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-surface-2)' }}>
            {categoryBreakdown.map(([cat, mins]) => (
              <div
                key={cat}
                className="h-full transition-all duration-300"
                style={{
                  width: `${(mins / totalMinutes) * 100}%`,
                  background: CATEGORY_COLORS[cat] || '#94a3b8',
                }}
                title={`${cat}: ${fmtDuration(mins, t)}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {categoryBreakdown.map(([cat, mins]) => (
              <div key={cat} className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] || '#94a3b8' }} />
                {cat} {fmtDuration(mins, t)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Vertical timeline ── */}
      <div className="text-[12px] font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        {t('timeline.title')}
      </div>
      {filteredActivities.length === 0 ? (
        <div
          className="rounded-[var(--radius-lg)]"
          style={{
            background: 'var(--color-bg-surface-1)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <EmptyState
            icon="⏱️"
            title={t('timeline.emptyTitle')}
            description={t('timeline.emptyDescription')}
          />
        </div>
      ) : (
        <div
          ref={timelineRef}
          className="relative overflow-y-auto rounded-[var(--radius-lg)]"
          style={{
            height: '520px',
            background: 'var(--color-bg-surface-1)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <div className="relative" style={{ height: `${hours.length * HOUR_HEIGHT}px` }}>
            {/* Work hours background shading (9:00-18:00) */}
            {(() => {
              const workStart = Math.max(WORK_HOUR_START - 6, 0)
              const workEnd = Math.min(WORK_HOUR_END - 6, hours.length)
              return (
                <div
                  className="absolute left-[60px] right-0 pointer-events-none"
                  style={{
                    top: `${workStart * HOUR_HEIGHT}px`,
                    height: `${(workEnd - workStart) * HOUR_HEIGHT}px`,
                    background: 'var(--color-accent-soft, rgba(99,102,241,0.04))',
                    borderLeft: '2px solid var(--color-accent-soft, rgba(99,102,241,0.12))',
                    zIndex: 1,
                  }}
                >
                  <span
                    className="absolute top-1 right-2 text-[9px] font-medium px-1.5 py-0.5 rounded"
                    style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-surface-2)', opacity: 0.7 }}
                  >
                    {t('timeline.workHours')} {WORK_HOUR_START}:00-{WORK_HOUR_END}:00
                  </span>
                </div>
              )
            })()}

            {/* Hour gridlines */}
            {hours.map((hour, i) => (
              <div
                key={hour}
                className="absolute left-0 right-0 flex items-start"
                style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              >
                <span
                  className="w-[60px] text-right pr-3 text-[11px] font-medium pt-0.5 select-none flex-shrink-0"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {String(hour).padStart(2, '0')}:00
                </span>
                <div className="flex-1 border-t" style={{ borderColor: 'var(--color-border-subtle)' }} />
              </div>
            ))}

            {/* Activity blocks */}
            {filteredActivities.map((activity) => {
              const aHour = new Date(activity.startTime).getHours()
              if (aHour < 6) return null
              const adjustedTop = ((minutesSinceMidnight(activity.startTime) - 360) / 60) * HOUR_HEIGHT
              const isPersonalTime = aHour < WORK_HOUR_START || aHour >= WORK_HOUR_END
              return (
                <TimelineActivityBlock
                  key={activity.id}
                  activity={activity}
                  adjustedTop={adjustedTop}
                  onCategoryChange={handleCategoryChange}
                  batchMode={batchMode}
                  isSelected={selectedIds.has(activity.id)}
                  onToggleSelect={handleToggleSelect}
                  isPersonalTime={isPersonalTime}
                />
              )
            })}

            {/* Now marker (adjusted for 6am base) */}
            {now.getHours() >= 6 && (
              <div
                className="absolute left-0 right-0 z-30 pointer-events-none"
                style={{ top: `${((now.getHours() * 60 + now.getMinutes() - 360) / 60) * HOUR_HEIGHT}px` }}
              >
                <div className="flex items-center">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1"
                    style={{ background: 'var(--color-accent)', color: '#fff' }}
                  >
                    NOW
                  </span>
                  <div className="flex-1 h-[2px]" style={{ background: 'var(--color-accent)' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Batch action floating bar ── */}
      {batchMode && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full"
          style={{
            background: 'var(--color-bg-surface-1)',
            border: '1px solid var(--color-border-subtle)',
            boxShadow: 'var(--shadow-lg, 0 8px 30px rgba(0,0,0,0.15))',
            backdropFilter: 'blur(12px)',
          }}
        >
          <span className="text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {t('timeline.selectedCount')} <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{selectedIds.size}</span> {t('timeline.items')}
          </span>
          <div className="h-4 w-px" style={{ background: 'var(--color-border-subtle)' }} />
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 rounded-full text-[12px] transition-colors"
            style={{ background: 'var(--color-bg-surface-2)', color: 'var(--color-text-secondary)' }}
          >
            {t('timeline.selectAll')}
          </button>
          <button
            onClick={() => setShowBatchCategoryPicker(true)}
            className="px-3 py-1 rounded-full text-[12px] font-medium transition-colors"
            style={{
              background: selectedIds.size > 0 ? 'var(--color-accent)' : 'var(--color-bg-surface-2)',
              color: selectedIds.size > 0 ? '#fff' : 'var(--color-text-muted)',
            }}
            disabled={selectedIds.size === 0}
          >
            {t('timeline.batchCategory')}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-1 rounded-full text-[12px] font-medium transition-colors"
            style={{
              background: selectedIds.size > 0 ? 'var(--color-error, #ef4444)' : 'var(--color-bg-surface-2)',
              color: selectedIds.size > 0 ? '#fff' : 'var(--color-text-muted)',
            }}
            disabled={selectedIds.size === 0}
          >
            {t('timeline.batchDelete')}
          </button>
          <button
            onClick={handleBatchClear}
            className="px-3 py-1 rounded-full text-[12px] transition-colors"
            style={{ background: 'var(--color-bg-surface-2)', color: 'var(--color-text-secondary)' }}
          >
            {t('common.cancel')}
          </button>
        </div>
      )}

      {/* Batch Category Picker Modal */}
      {showBatchCategoryPicker && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center"
          onClick={() => setShowBatchCategoryPicker(false)}
        >
          <div
            className="bg-[var(--color-bg-surface-1)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-4 min-w-[220px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[13px] font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              {t('timeline.batchCategorize')} · {t('timeline.selectedCount')} {selectedIds.size} {t('timeline.items')}
            </div>
            <div className="space-y-1">
              {(Object.keys(CATEGORY_COLORS) as ActivityCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleBatchCategorize(cat)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-[var(--radius-sm)] text-left text-[13px] transition-colors hover:bg-[var(--color-bg-surface-2)]"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: CATEGORY_COLORS[cat] || '#94a3b8' }}
                  />
                  {cat}
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
              <button
                onClick={() => setShowBatchCategoryPicker(false)}
                className="w-full px-3 py-2 rounded-[var(--radius-sm)] text-[13px] bg-[var(--color-bg-surface-2)] transition-colors hover:bg-[var(--color-bg-surface-3)]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-[var(--color-bg-surface-1)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-4 min-w-[280px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[13px] font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {t('timeline.confirmDelete')}
            </div>
            <div className="text-[13px] mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              {t('timeline.deleteSelectedConfirm', { count: selectedIds.size })}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-[var(--radius-sm)] text-[13px] bg-[var(--color-bg-surface-2)] transition-colors hover:bg-[var(--color-bg-surface-3)]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmBatchDelete}
                className="px-4 py-2 rounded-[var(--radius-sm)] text-[13px] font-medium transition-colors"
                style={{ background: 'var(--color-error, #ef4444)', color: '#fff' }}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
