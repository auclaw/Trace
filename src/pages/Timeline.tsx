import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import dataService, { Activity, ActivityCategory, TimeBlock } from '../services/dataService'
import { CATEGORY_COLORS } from '../config/themes'

/* ── Helpers ── */
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins}分钟`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function minutesSinceMidnight(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

const HOUR_HEIGHT = 72 // px per hour
const PRIVACY_LEVELS = ['完全公开', '仅团队', '仅自己'] as const

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
        更改分类
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
}: {
  activity: Activity
  adjustedTop: number
  onCategoryChange: (id: string, cat: ActivityCategory) => void
}) {
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
          border: `1px solid ${color}30`,
        }}
        onClick={() => setShowPicker(!showPicker)}
      >
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
                手动
              </span>
            )}
          </div>
          {height >= 40 && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                {fmtTime(activity.startTime)} - {fmtTime(activity.endTime)}
              </span>
              <span className="text-[11px] font-medium" style={{ color }}>
                {fmtDuration(activity.duration)}
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
          点击修改
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
          计划
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
          实际
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
          <span className="text-[12px] italic" style={{ color: 'var(--color-text-muted)' }}>暂无记录</span>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function Timeline() {
  const today = toDateStr(new Date())
  const [activities, setActivities] = useState<Activity[]>([])
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [now, setNow] = useState(new Date())
  const [privacyLevel, setPrivacyLevel] = useState<number>(2) // 0=public,1=team,2=private
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
              ⏱️ 时间线
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {today} — 活动追踪与回顾
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
            {PRIVACY_LEVELS[privacyLevel]}
          </button>
        </div>
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
                正在追踪: {currentActivity.name}
              </span>
              <span className="text-[12px] ml-2" style={{ color: 'var(--color-text-muted)' }}>
                {fmtTime(currentActivity.startTime)} 开始 · {currentActivity.category}
              </span>
            </div>
          ) : (
            <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
              当前无活动追踪 — 空闲中
            </span>
          )}
        </div>
      </div>

      {/* ── Top summary row ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {/* Total time */}
        <div
          className="rounded-[var(--radius-lg)] p-3"
          style={{ background: 'var(--color-bg-surface-1)', border: '1px solid var(--color-border-subtle)' }}
        >
          <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>今日总计</div>
          <div className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>{fmtDuration(totalMinutes)}</div>
        </div>
        {/* Activity count */}
        <div
          className="rounded-[var(--radius-lg)] p-3"
          style={{ background: 'var(--color-bg-surface-1)', border: '1px solid var(--color-border-subtle)' }}
        >
          <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>活动数</div>
          <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{activities.length}</div>
        </div>
        {/* Top category */}
        <div
          className="rounded-[var(--radius-lg)] p-3"
          style={{ background: 'var(--color-bg-surface-1)', border: '1px solid var(--color-border-subtle)' }}
        >
          <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>最多类别</div>
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
                {fmtDuration(categoryBreakdown[0][1])}
              </span>
            </div>
          ) : (
            <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>--</span>
          )}
        </div>
      </div>

      {/* ── Plan vs Actual (if there's a current planned block) ── */}
      {currentPlannedBlock && (
        <div className="mb-5">
          <div className="text-[12px] font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            📅 当前时段 · 计划 vs 实际
          </div>
          <PlanActualCard block={currentPlannedBlock} actual={matchingActual} />
        </div>
      )}

      {/* ── Category breakdown bar ── */}
      {categoryBreakdown.length > 0 && (
        <div className="mb-5">
          <div className="text-[12px] font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            分类分布
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
                title={`${cat}: ${fmtDuration(mins)}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {categoryBreakdown.map(([cat, mins]) => (
              <div key={cat} className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] || '#94a3b8' }} />
                {cat} {fmtDuration(mins)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Vertical timeline ── */}
      <div className="text-[12px] font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        时间线
      </div>
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
          {sortedActivities.map((activity) => {
            const aHour = new Date(activity.startTime).getHours()
            if (aHour < 6) return null
            const adjustedTop = ((minutesSinceMidnight(activity.startTime) - 360) / 60) * HOUR_HEIGHT
            return (
              <TimelineActivityBlock
                key={activity.id}
                activity={activity}
                adjustedTop={adjustedTop}
                onCategoryChange={handleCategoryChange}
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
    </div>
  )
}
