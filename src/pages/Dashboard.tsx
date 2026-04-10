import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { Card, Button, EmptyState } from '../components/ui'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useAppStore } from '../store/useAppStore'
import type { Activity, TimeBlock } from '../services/dataService'
import useTheme from '../hooks/useTheme'
import { CATEGORY_COLORS } from '../config/themes'
import dataService from '../services/dataService'
import DailySummary from '../components/DailySummary'
import { trackingService } from '../services/trackingService'

// Import split components
import ActiveTrackingCard from '../components/Dashboard/ActiveTrackingCard'
import DailyInsightsCard from '../components/Dashboard/DailyInsightsCard'
import EditActivityModal from '../components/Dashboard/EditActivityModal'
import QuickActions from '../components/Dashboard/QuickActions'
import SortableWidget from '../components/Dashboard/SortableWidget'
import TodayStatsCards from '../components/Dashboard/TodayStatsCards'
import { TRANSITION_ALL } from '../components/Dashboard/constants'

// ── Helpers ──

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtTime(iso: string): string {
  return iso.slice(11, 16)
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function greeting(t: (key: string) => string): string {
  const h = new Date().getHours()
  if (h < 6) return t('dashboard.greeting.night')
  if (h < 12) return t('dashboard.greeting.morning')
  if (h < 14) return t('dashboard.greeting.noon')
  if (h < 18) return t('dashboard.greeting.afternoon')
  return t('dashboard.greeting.evening')
}

// ── Main Dashboard ──

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { accentColor } = useTheme()

  const activities = useAppStore((s) => s.activities)
  const loadActivities = useAppStore((s) => s.loadActivities)
  const updateActivity = useAppStore((s) => s.updateActivity)
  const deleteActivity = useAppStore((s) => s.deleteActivity)

  const tasks = useAppStore((s) => s.tasks)
  const loadTasks = useAppStore((s) => s.loadTasks)
  const updateTask = useAppStore((s) => s.updateTask)

  const habits = useAppStore((s) => s.habits)
  const loadHabits = useAppStore((s) => s.loadHabits)
  const checkinHabit = useAppStore((s) => s.checkinHabit)

  const dailyGoalMinutes = useAppStore((s) => s.dailyGoalMinutes)
  const dashboardWidgetOrder = useAppStore((s) => s.dashboardWidgetOrder)
  const setDashboardWidgetOrder = useAppStore((s) => s.setDashboardWidgetOrder)

  const pet = useAppStore((s) => s.pet)
  const loadPet = useAppStore((s) => s.loadPet)
  const feedPet = useAppStore((s) => s.feedPet)
  const interactPet = useAppStore((s) => s.interactPet)
  const addTask = useAppStore((s) => s.addTask)

  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({})
  const [checkedHabits, setCheckedHabits] = useState<Record<string, boolean>>({})
  const [showSummary, setShowSummary] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement needed to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = dashboardWidgetOrder.indexOf(active.id as string)
      const newIndex = dashboardWidgetOrder.indexOf(over.id as string)
      setDashboardWidgetOrder(arrayMove(dashboardWidgetOrder, oldIndex, newIndex))
    }
    setActiveId(null)
  }
  const [currentTracking, setCurrentTracking] = useState(trackingService.getCurrentActivity())
  const [showQuickTask, setShowQuickTask] = useState(false)
  const [quickTaskTitle, setQuickTaskTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const habitsRef = useRef<HTMLDivElement>(null)

  // Load data on mount
  useEffect(() => {
    Promise.all([
      loadActivities(),
      loadTasks(),
      loadHabits(),
      loadPet(),
    ]).finally(() => {
      setLoading(false)
    })
  }, [loadActivities, loadTasks, loadHabits, loadPet])

  // Subscribe to tracking service for live updates
  useEffect(() => {
    const unsub = trackingService.subscribe(() => {
      setCurrentTracking(trackingService.getCurrentActivity())
      loadActivities() // refresh activities when new ones are generated
    })
    return unsub
  }, [loadActivities])

  // Derived stats
  const today = todayStr()
  const dailyStats = useMemo(() => dataService.getDailyStats(today), [today, activities])

  const totalHours = Math.floor(dailyStats.totalMinutes / 60)
  const totalMins = dailyStats.totalMinutes % 60
  const goalPct = Math.min(100, (dailyStats.totalMinutes / dailyGoalMinutes) * 100)

  // Streak: consecutive days with > 60 min of activity
  const streak = useMemo(() => {
    let count = 0
    const d = new Date()
    for (let i = 0; i < 365; i++) {
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const stats = dataService.getDailyStats(ds)
      if (stats.totalMinutes >= 60) {
        count++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }
    return count
  }, [activities])

  // Sorted activities for timeline
  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [activities],
  )

  // AI classification approval quick toggle
  const handleAiApprovalToggle = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't open edit modal
    const activity = activities.find(a => a.id === id);
    if (!activity) return;
    // Cycle: null → approved → rejected → null
    let nextApproved: boolean | null = null;
    if (activity.aiApproved === null || activity.aiApproved === undefined) {
      nextApproved = true;
    } else if (activity.aiApproved === true) {
      nextApproved = false;
    } else {
      nextApproved = null;
    }
    dataService.updateActivity(id, { aiApproved: nextApproved });
    // Refresh activities
    window.location.reload();
  }, [activities]);

  // Pending tasks (top 5)
  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'completed').slice(0, 5),
    [tasks],
  )

  // Category bar data
  const categoryBar = useMemo(() => {
    const entries = Object.entries(dailyStats.categories).sort((a, b) => b[1] - a[1])
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1
    return entries.map(([cat, mins]) => ({ cat, mins, pct: (mins / total) * 100 }))
  }, [dailyStats])

  // Quick task handler
  const handleQuickAddTask = useCallback(() => {
    const title = quickTaskTitle.trim()
    if (!title) return
    addTask({
      title,
      priority: 3,
      status: 'pending',
      estimatedMinutes: 30,
      actualMinutes: 0,
      project: '',
      subtasks: [],
      dueDate: todayStr(),
      repeatType: 'none',
      createdAt: new Date().toISOString(),
    })
    setQuickTaskTitle('')
    setShowQuickTask(false)
  }, [quickTaskTitle, addTask])

  // ── Plan vs Actual comparison ──
  const timeBlocks = useMemo(() => dataService.getTimeBlocks(today), [today, activities])

  const planComparison = useMemo(() => {
    if (timeBlocks.length === 0) return { items: [] as { block: TimeBlock; actual: Activity | null; match: 'full' | 'partial' | 'miss' }[], adherencePct: 0 }

    const items = timeBlocks.map((block) => {
      const blockStart = new Date(`${block.date}T${block.startTime}`).getTime()
      const blockEnd = new Date(`${block.date}T${block.endTime}`).getTime()

      // Find overlapping activities
      const overlapping = sortedActivities.filter((act) => {
        const aStart = new Date(act.startTime).getTime()
        const aEnd = new Date(act.endTime).getTime()
        return aStart < blockEnd && aEnd > blockStart
      })

      if (overlapping.length === 0) {
        return { block, actual: null as Activity | null, match: 'miss' as const }
      }

      // Best match: same category => full, any overlap => partial
      const categoryMatch = overlapping.find((a) => a.category === block.category)
      if (categoryMatch) {
        return { block, actual: categoryMatch, match: 'full' as const }
      }
      return { block, actual: overlapping[0], match: 'partial' as const }
    })

    const matched = items.filter((i) => i.match === 'full').length
    const partial = items.filter((i) => i.match === 'partial').length
    const adherencePct = items.length > 0 ? Math.round(((matched + partial * 0.5) / items.length) * 100) : 0

    return { items, adherencePct }
  }, [timeBlocks, sortedActivities])

  // ── Focus Quality Score ──
  const focusQualityScore = useMemo(() => {
    const cats = dailyStats.categories
    const totalMinsAll = dailyStats.totalMinutes || 1

    // Deep work percentage (40% weight)
    const deepWorkCats = ['开发', '学习', '工作']
    const deepMins = deepWorkCats.reduce((s, c) => s + (cats[c] || 0), 0)
    const deepPct = deepMins / totalMinsAll
    const deepScore = Math.min(1, deepPct / 0.6)

    // Plan adherence (30% weight)
    const adherence = planComparison.items.length > 0 ? planComparison.adherencePct / 100 : 0.5

    // Break regularity (15% weight)
    const restMins = cats['休息'] || 0
    const restPct = restMins / totalMinsAll
    const breakScore = totalMinsAll > 30
      ? restPct >= 0.05 && restPct <= 0.2 ? 1 : restPct > 0 ? 0.5 : 0.2
      : 0.5

    // Category diversity (15% weight)
    const catCount = Object.keys(cats).length
    const diversityScore = catCount >= 2 && catCount <= 5 ? 1 : catCount === 1 ? 0.5 : catCount > 5 ? 0.7 : 0.3

    const raw = deepScore * 40 + adherence * 30 + breakScore * 15 + diversityScore * 15
    return Math.round(Math.max(0, Math.min(100, raw)))
  }, [dailyStats, planComparison])

  const focusScoreColor = focusQualityScore > 70
    ? '#22c55e'
    : focusQualityScore >= 40
      ? '#eab308'
      : '#ef4444'

  const focusScoreGradient = focusQualityScore > 70
    ? 'linear-gradient(135deg, #22c55e, #4ade80)'
    : focusQualityScore >= 40
      ? 'linear-gradient(135deg, #eab308, #facc15)'
      : 'linear-gradient(135deg, #ef4444, #f87171)'

  const aiSuggestions = useMemo(() => {
    const suggestions: string[] = []
    const cats = dailyStats.categories
    const deepWorkCats = ['开发', '学习', '工作']
    const deepMins = deepWorkCats.reduce((s, c) => s + (cats[c] || 0), 0)
    const totalMinsAll = dailyStats.totalMinutes || 1
    const deepPct = Math.round((deepMins / totalMinsAll) * 100)

    // Suggestion based on adherence
    if (planComparison.items.length > 0) {
      const misses = planComparison.items.filter((i) => i.match === 'miss')
      if (misses.length > 0) {
        const missBlocks = misses.slice(0, 2).map((m) => m.block.startTime.slice(0, 5)).join('、')
        suggestions.push(t('dashboard.aiSuggestionMiss', { blocks: missBlocks }))
      }
      if (planComparison.adherencePct >= 80) {
        suggestions.push(t('dashboard.aiSuggestionAdherenceGood', { pct: planComparison.adherencePct }))
      }
    }

    // Deep work ratio
    suggestions.push(deepPct >= 50 ? t('dashboard.aiSuggestionDeepGood', { pct: deepPct }) : t('dashboard.aiSuggestionDeepBad', { pct: deepPct }))

    // Rest suggestion
    const restMins = cats['休息'] || 0
    if (totalMinsAll > 180 && restMins < 20) {
      suggestions.push(t('dashboard.aiSuggestionRest'))
    } else if (suggestions.length < 3) {
      suggestions.push(t('dashboard.aiSuggestionGeneral'))
    }

    return suggestions.slice(0, 3)
  }, [dailyStats, planComparison, t])

  // Format today's date
  const dateLabel = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const handleTaskToggle = useCallback(
    (id: string, currentStatus: string) => {
      setCheckedTasks((prev) => ({ ...prev, [id]: true }))
      setTimeout(() => {
        updateTask(id, { status: currentStatus === 'completed' ? 'pending' : 'completed' })
        setCheckedTasks((prev) => ({ ...prev, [id]: false }))
      }, 350)
    },
    [updateTask],
  )

  const handleCheckin = useCallback(
    (habitId: string) => {
      setCheckedHabits((prev) => ({ ...prev, [habitId]: true }))
      setTimeout(() => {
        checkinHabit(habitId, today, 1)
        setCheckedHabits((prev) => ({ ...prev, [habitId]: false }))
      }, 400)
    },
    [checkinHabit, today],
  )


  // ── Render ──

  return (
    <div style={{ padding: '32px 40px' }} className="max-w-6xl mx-auto space-y-6">
      {/* Edit Modal */}
      {editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={(id, updates) => {
            updateActivity(id, updates)
            setEditingActivity(null)
          }}
          onDelete={(id) => {
            deleteActivity(id)
            setEditingActivity(null)
          }}
        />
      )}

      {/* Daily Summary Modal */}
      <DailySummary isOpen={showSummary} onClose={() => setShowSummary(false)} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            {t('dashboard.todayTimeline')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {dateLabel} &middot; {greeting(t)}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowSummary(true)}>
          {t('dashboard.generateSummary')}
        </Button>
      </div>

      {/* ── Loading Skeleton ── */}
      {loading ? (
        <div className="space-y-6">
          <SkeletonCard lines={4} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} lines={2} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SkeletonCard lines={5} />
            <SkeletonCard lines={5} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3"><SkeletonCard lines={8} /></div>
            <div className="lg:col-span-2 space-y-4">
              <SkeletonCard lines={5} />
              <SkeletonCard lines={3} />
              <SkeletonCard lines={4} />
            </div>
          </div>
        </div>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={dashboardWidgetOrder} strategy={rectSortingStrategy}>
            <div className="space-y-6">
              {/* Widgets rendered in custom order */}
              {dashboardWidgetOrder.map((widgetId) => {
                switch (widgetId) {
                  case 'trackingBanner':
                    return trackingService.isTracking() ? (
                      <SortableWidget key="trackingBanner" id="trackingBanner">
                        <ActiveTrackingCard
                          currentTracking={currentTracking}
                          onNavigateToTimeline={() => navigate('/timeline')}
                          fmtTime={fmtTime}
                        />
                      </SortableWidget>
                    ) : null;

                  case 'quickActions':
                    return (
                      <SortableWidget key="quickActions" id="quickActions">
                        <QuickActions
                          onStartFocus={() => navigate('/focus')}
                          onToggleQuickTask={() => setShowQuickTask((v) => !v)}
                          onFocusCheckinHabits={() => habitsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                          showQuickTask={showQuickTask}
                          quickTaskTitle={quickTaskTitle}
                          onQuickTaskTitleChange={setQuickTaskTitle}
                          onAddQuickTask={handleQuickAddTask}
                        />
                      </SortableWidget>
                    );

                  case 'statsRow':
                    return (
                      <SortableWidget key="statsRow" id="statsRow">
                        <TodayStatsCards
                          focusQualityScore={focusQualityScore}
                          focusScoreColor={focusScoreColor}
                          focusScoreGradient={focusScoreGradient}
                          dailyGoalMinutes={dailyGoalMinutes}
                          goalPct={goalPct}
                          totalHours={totalHours}
                          totalMins={totalMins}
                          accentColor={accentColor}
                          dailyStats={{
                            activityCount: dailyStats.activityCount,
                            totalMinutes: dailyStats.totalMinutes,
                          }}
                          streak={streak}
                        />
                      </SortableWidget>
                    );

                  case 'planComparison':
                    return (
                      <SortableWidget key="planComparison" id="planComparison">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Plan vs Actual comparison card */}
                          <div
                            className="rounded-2xl overflow-hidden"
                            style={{
                              background: 'linear-gradient(135deg, #ffffff 0%, #fef8f0 50%, #fdf2e9 100%)',
                              border: '1px solid var(--color-border-subtle)',
                              boxShadow: 'var(--shadow-card)',
                            }}
                          >
                            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-base" style={{ color: 'var(--color-accent)' }}><BarChart3 size={18} /></span>
                                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                  {t('dashboard.plannedVsActual')}
                                </h3>
                              </div>
                              {planComparison.items.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-1.5 w-16 rounded-full overflow-hidden"
                                    style={{ background: 'var(--color-border-subtle)', opacity: 0.3 }}
                                  >
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${planComparison.adherencePct}%`,
                                        background: planComparison.adherencePct >= 70
                                          ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                                          : planComparison.adherencePct >= 40
                                            ? 'linear-gradient(90deg, #eab308, #facc15)'
                                            : 'linear-gradient(90deg, #ef4444, #f87171)',
                                        transition: 'width 700ms ease-out',
                                      }}
                                    />
                                  </div>
                                  <span
                                    className="text-xs font-bold tabular-nums"
                                    style={{
                                      color: planComparison.adherencePct >= 70
                                        ? '#22c55e'
                                        : planComparison.adherencePct >= 40
                                          ? '#eab308'
                                          : '#ef4444',
                                    }}
                                  >
                                    {planComparison.adherencePct}%
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="px-5 pb-4">
                              {planComparison.items.length === 0 ? (
                                <div className="text-center py-6">
                                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                    {t('dashboard.noPlannedBlocks')}
                                  </p>
                                  <button
                                    onClick={() => navigate('/planner')}
                                    className="text-xs mt-2 px-3 py-1 rounded-full"
                                    style={{
                                      background: 'var(--color-accent-soft)',
                                      color: 'var(--color-accent)',
                                    }}
                                  >
                                    {t('dashboard.goPlan')}
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {planComparison.items.map(({ block, actual, match }) => {
                                    const matchColor = match === 'full'
                                      ? '#22c55e'
                                      : match === 'partial'
                                        ? '#eab308'
                                        : '#ef4444'
                                    const matchBg = match === 'full'
                                      ? 'rgba(34,197,94,0.08)'
                                      : match === 'partial'
                                        ? 'rgba(234,179,8,0.08)'
                                        : 'rgba(239,68,68,0.06)'
                                    const planColor = CATEGORY_COLORS[block.category] || 'var(--color-accent)'

                                    return (
                                      <div
                                        key={block.id}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                        style={{
                                          background: matchBg,
                                          borderLeft: `3px solid ${matchColor}`,
                                          transition: TRANSITION_ALL,
                                        }}
                                      >
                                        {/* Time slot */}
                                        <span
                                          className="text-[10px] tabular-nums shrink-0 w-[72px]"
                                          style={{ color: 'var(--color-text-muted)' }}
                                        >
                                          {block.startTime.slice(0, 5)}–{block.endTime.slice(0, 5)}
                                        </span>

                                        {/* Planned */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span
                                              className="w-1.5 h-1.5 rounded-full shrink-0"
                                              style={{ background: planColor }}
                                            />
                                            <span
                                              className="text-[11px] font-medium truncate"
                                              style={{ color: 'var(--color-text-primary)' }}
                                            >
                                              {block.title}
                                            </span>
                                          </div>
                                          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                            {t('dashboard.planned')} · {block.category}
                                          </span>
                                        </div>

                                        {/* Arrow */}
                                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}>→</span>

                                        {/* Actual */}
                                        <div className="flex-1 min-w-0">
                                          {actual ? (
                                            <>
                                              <div className="flex items-center gap-1.5">
                                                <span
                                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                                  style={{ background: CATEGORY_COLORS[actual.category] || 'var(--color-accent)' }}
                                                />
                                                <span
                                                  className="text-[11px] font-medium truncate"
                                                  style={{ color: 'var(--color-text-primary)' }}
                                                >
                                                  {actual.name}
                                                </span>
                                              </div>
                                              <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                                {t('dashboard.actual')} · {actual.category}
                                              </span>
                                            </>
                                          ) : (
                                            <span className="text-[11px]" style={{ color: '#ef4444', opacity: 0.7 }}>
                                              {t('dashboard.notExecuted')}
                                            </span>
                                          )}
                                        </div>

                                        {/* Match indicator */}
                                        <span
                                          className="text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded-full"
                                          style={{
                                            color: matchColor,
                                            background: `${matchColor}15`,
                                          }}
                                        >
                                          {match === 'full' ? t('dashboard.matched') : match === 'partial' ? t('dashboard.partial') : t('dashboard.missed')}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* AI Optimization Suggestions card */}
                          <div
                            className="rounded-2xl overflow-hidden"
                            style={{
                              background: 'linear-gradient(135deg, #fffbf5 0%, #fef3e2 50%, #fdf0db 100%)',
                              border: '1px solid var(--color-border-subtle)',
                              boxShadow: 'var(--shadow-card)',
                            }}
                          >
                            <div className="px-5 pt-4 pb-3 flex items-center gap-2">
                              <span className="text-base" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.4))' }}>✨</span>
                              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                {t('dashboard.aiSuggestions')}
                              </h3>
                              <span
                                className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium"
                                style={{
                                  background: 'linear-gradient(135deg, var(--color-accent), #f59e0b)',
                                  color: '#fff',
                                }}
                              >
                                {t('dashboard.aiAnalysis')}
                              </span>
                            </div>

                            <div className="px-5 pb-5 space-y-3">
                              {aiSuggestions.map((suggestion, i) => (
                                <div
                                  key={i}
                                  className="flex gap-3 items-start px-3.5 py-3 rounded-xl"
                                  style={{
                                    background: 'rgba(255,255,255,0.65)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255,255,255,0.5)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                    transition: TRANSITION_ALL,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateX(4px)'
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateX(0)'
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'
                                  }}
                                >
                                  <span
                                    className="flex items-center justify-center w-5 h-5 rounded-full shrink-0 text-[10px] font-bold mt-0.5"
                                    style={{
                                      background: 'linear-gradient(135deg, var(--color-accent), #f59e0b)',
                                      color: '#fff',
                                      boxShadow: '0 2px 6px rgba(245,158,11,0.25)',
                                    }}
                                  >
                                    {i + 1}
                                  </span>
                                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                    {suggestion}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* AI Productivity Coach - Personalized Insights */}
                          <DailyInsightsCard dailyStats={{ date: today, ...dailyStats }} today={today} />
                        </div>
                    </SortableWidget>
                  );

                  case 'mainTimeline':
                    return (
                      <SortableWidget key="mainTimeline" id="mainTimeline">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                          {/* Left: Activity Timeline */}
                          <div className="lg:col-span-3">
                            <Card padding="sm">
                              <h2 className="text-sm font-semibold px-2 pt-2 pb-3" style={{ color: 'var(--color-text-primary)' }}>
                                {t('dashboard.todayTimeline')}
                              </h2>
                              {sortedActivities.length === 0 ? (
                                <EmptyState
                                  icon="📋"
                                  title={t('dashboard.noActivities')}
                                  description={t('dashboard.noActivitiesHint')}
                                />
                              ) : (
                                <div className="relative pl-6 pr-2 pb-2 space-y-0.5">
                                  {/* Timeline gradient line */}
                                  <div
                                    className="absolute left-[17px] top-0 bottom-0 w-px"
                                    style={{
                                      background: 'linear-gradient(180deg, var(--color-border-subtle) 0%, transparent 100%)',
                                      opacity: 0.4,
                                    }}
                                  />
                                  {sortedActivities.map((act) => {
                                    const catColor = CATEGORY_COLORS[act.category] || CATEGORY_COLORS['其他']
                                    return (
                                      <div
                                        key={act.id}
                                        className="relative flex items-start gap-3 py-2.5 px-2 rounded-xl cursor-pointer group"
                                        style={{
                                          borderLeft: `3px solid ${catColor}`,
                                          marginLeft: '-3px',
                                          transition: TRANSITION_ALL,
                                        }}
                                        onClick={() => setEditingActivity(act)}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = `${catColor}0D`
                                          e.currentTarget.style.transform = 'translateX(2px)'
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'transparent'
                                          e.currentTarget.style.transform = 'translateX(0)'
                                        }}
                                      >
                                        {/* Dot on timeline */}
                                        <div
                                          className="absolute -left-[20px] top-[18px] w-2.5 h-2.5 rounded-full ring-2 ring-[var(--color-bg-surface-1)] z-10"
                                          style={{ background: catColor }}
                                        />
                                        {/* Time */}
                                        <span className="text-[11px] tabular-nums w-24 shrink-0 pt-0.5" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>
                                          {fmtTime(act.startTime)} – {fmtTime(act.endTime)}
                                        </span>
                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                                            {act.name}
                                          </p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span
                                              className="inline-block w-1.5 h-1.5 rounded-full"
                                              style={{ background: catColor }}
                                            />
                                            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                                              {act.category}
                                            </span>
                                            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                                              {fmtDuration(act.duration)}
                                            </span>
                                            {act.isAiClassified && (
                                              <button
                                                onClick={(e) => handleAiApprovalToggle(act.id, e)}
                                                className={`text-[9px] px-1.5 py-0.5 rounded-full border transition-colors ${
                                                  act.aiApproved === true
                                                    ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                                                    : act.aiApproved === false
                                                    ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700'
                                                    : 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700'
                                                }`}
                                                title={
                                                  act.aiApproved === true
                                                    ? t('timeline.aiApproved')
                                                    : act.aiApproved === false
                                                    ? t('timeline.aiRejected')
                                                    : t('timeline.aiPendingReview')
                                                }
                                              >
                                                {act.aiApproved === true ? '✓ AI' : act.aiApproved === false ? '✗ AI' : '🤖 AI'}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        {/* Edit hint */}
                                        <span className="text-[10px] opacity-0 group-hover:opacity-100 pt-1" style={{ color: 'var(--color-text-muted)', transition: 'opacity 200ms' }}>
                                          {t('common.edit')}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </Card>
                          </div>

                          {/* Right column - tasks, pet, habits */}
                          <div className="lg:col-span-2 space-y-4" ref={habitsRef}>
                            {/* Quick tasks */}
                            <Card padding="sm">
                              <h2 className="text-sm font-semibold px-2 pt-2 pb-3" style={{ color: 'var(--color-text-primary)' }}>
                                {t('tasks.title')}
                              </h2>
                              {pendingTasks.length === 0 ? (
                                <p className="text-xs px-2 pb-3" style={{ color: 'var(--color-text-muted)' }}>{t('tasks.allCompleted')}</p>
                              ) : (
                                <ul className="space-y-0.5 pb-1">
                                  {pendingTasks.map((task) => {
                                    const done = task.status === 'completed'
                                    const animating = checkedTasks[task.id]
                                    return (
                                      <li
                                        key={task.id}
                                        className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer"
                                        style={{ transition: TRANSITION_ALL }}
                                        onClick={() => handleTaskToggle(task.id, task.status)}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = 'var(--color-bg-surface-2)'
                                          e.currentTarget.style.transform = 'translateY(-1px)'
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'transparent'
                                          e.currentTarget.style.transform = 'translateY(0)'
                                        }}
                                      >
                                        {/* Circular checkbox with bounce */}
                                        <span
                                          className="flex items-center justify-center w-[18px] h-[18px] rounded-full border-2 shrink-0"
                                          style={{
                                            borderColor: done || animating ? 'var(--color-accent)' : 'var(--color-border-subtle)',
                                            backgroundColor: done || animating ? 'var(--color-accent)' : 'transparent',
                                            transition: TRANSITION_ALL,
                                            transform: animating ? 'scale(1.3)' : 'scale(1)',
                                          }}
                                        >
                                          {(done || animating) && (
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M2 5l2.5 2.5L8 3" />
                                            </svg>
                                          )}
                                        </span>
                                        <span
                                          className="text-sm truncate"
                                          style={{
                                            color: done ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                                            textDecoration: done ? 'line-through' : 'none',
                                            transition: TRANSITION_ALL,
                                          }}
                                        >
                                          {task.title}
                                        </span>
                                      </li>
                                    )
                                  })}
                                </ul>
                              )}
                            </Card>

                            {/* Pet Status Mini Card */}
                            <div
                              className="rounded-2xl cursor-pointer overflow-hidden"
                              onClick={() => navigate('/pet')}
                              style={{
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 40%, #fbbf24 100%)',
                                border: '1px solid rgba(251,191,36,0.3)',
                                boxShadow: '0 2px 12px rgba(251,191,36,0.15)',
                                padding: '16px 20px',
                                transition: TRANSITION_ALL,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(251,191,36,0.25)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 2px 12px rgba(251,191,36,0.15)'
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">
                                  {pet.type === 'cat' ? '🐱' : pet.type === 'dog' ? '🐶' : '🐰'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold" style={{ color: '#78350f' }}>{pet.name}</span>
                                    <span
                                      className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                                      style={{ background: 'rgba(120,53,15,0.12)', color: '#78350f' }}
                                    >
                                      Lv.{pet.level}
                                    </span>
                                  </div>
                                  {/* Mood bar */}
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px]" style={{ color: '#92400e' }}>{t('pet.mood')}</span>
                                    <div
                                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                                      style={{ background: 'rgba(120,53,15,0.15)' }}
                                    >
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${pet.mood}%`,
                                          background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                                          transition: 'width 500ms ease-out',
                                        }}
                                      />
                                    </div>
                                    <span className="text-[10px] tabular-nums" style={{ color: '#92400e' }}>{pet.mood}%</span>
                                  </div>
                                </div>
                              </div>
                              {/* Action buttons */}
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); feedPet() }}
                                  className="flex-1 text-[12px] font-medium py-1.5 rounded-xl cursor-pointer"
                                  style={{
                                    background: 'rgba(255,255,255,0.6)',
                                    color: '#92400e',
                                    border: '1px solid rgba(255,255,255,0.7)',
                                    backdropFilter: 'blur(4px)',
                                    transition: TRANSITION_ALL,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.85)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.6)'
                                  }}
                                >
                                  🍖 {t('pet.feed')}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); interactPet() }}
                                  className="flex-1 text-[12px] font-medium py-1.5 rounded-xl cursor-pointer"
                                  style={{
                                    background: 'rgba(255,255,255,0.6)',
                                    color: '#92400e',
                                    border: '1px solid rgba(255,255,255,0.7)',
                                    backdropFilter: 'blur(4px)',
                                    transition: TRANSITION_ALL,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.85)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.6)'
                                  }}
                                >
                                  🤗 {t('pet.interact')}
                                </button>
                              </div>
                            </div>

                            {/* Habits */}
                            <Card padding="sm">
                              <h2 className="text-sm font-semibold px-2 pt-2 pb-3" style={{ color: 'var(--color-text-primary)' }}>
                                {t('habits.today')}
                              </h2>
                              {habits.length === 0 ? (
                                <p className="text-xs px-2 pb-3" style={{ color: 'var(--color-text-muted)' }}>{t('habits.noHabits')}</p>
                              ) : (
                                <div className="grid grid-cols-2 gap-2 px-1 pb-2">
                                  {habits.map((habit) => {
                                    const done = habit.checkins[today] && habit.checkins[today] > 0
                                    const animating = checkedHabits[habit.id]
                                    const habitColor = (habit as any).color || 'var(--color-accent)'
                                    return (
                                      <button
                                        key={habit.id}
                                        onClick={() => handleCheckin(habit.id)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-left cursor-pointer"
                                        style={{
                                          transition: TRANSITION_ALL,
                                          background: done
                                            ? `${habitColor}18`
                                            : 'var(--color-bg-surface-2)',
                                          border: done ? `1px solid ${habitColor}30` : '1px solid transparent',
                                          transform: animating ? 'scale(0.95)' : 'scale(1)',
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!done) e.currentTarget.style.opacity = '0.85'
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.opacity = '1'
                                        }}
                                      >
                                        <span className="text-base">{habit.icon}</span>
                                        <span
                                          className="text-xs font-medium truncate"
                                          style={{ color: done ? habitColor : 'var(--color-text-secondary)' }}
                                        >
                                          {habit.name}
                                        </span>
                                        {(done || animating) && (
                                          <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 12 12"
                                            fill="none"
                                            className="ml-auto shrink-0"
                                            style={{
                                              transition: TRANSITION_ALL,
                                              transform: animating ? 'scale(1.4)' : 'scale(1)',
                                            }}
                                          >
                                            <path
                                              d="M2.5 6l2.5 2.5L9.5 4"
                                              stroke={habitColor}
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </Card>
                          </div>
                        </div>
                      </SortableWidget>
                    );

                  case 'sidebarWidgets':
                    return (
                      <SortableWidget key="sidebarWidgets" id="sidebarWidgets">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                          <div className="lg:col-span-3" />
                          <div className="lg:col-span-2 space-y-4" ref={habitsRef}>
                            {/* Quick tasks */}
                            <Card padding="sm">
                              <h2 className="text-sm font-semibold px-2 pt-2 pb-3" style={{ color: 'var(--color-text-primary)' }}>
                                {t('tasks.title')}
                              </h2>
                              {pendingTasks.length === 0 ? (
                                <p className="text-xs px-2 pb-3" style={{ color: 'var(--color-text-muted)' }}>{t('tasks.allCompleted')}</p>
                              ) : (
                                <ul className="space-y-0.5 pb-1">
                                  {pendingTasks.map((task) => {
                                    const done = task.status === 'completed'
                                    const animating = checkedTasks[task.id]
                                    return (
                                      <li
                                        key={task.id}
                                        className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer"
                                        style={{ transition: TRANSITION_ALL }}
                                        onClick={() => handleTaskToggle(task.id, task.status)}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = 'var(--color-bg-surface-2)'
                                          e.currentTarget.style.transform = 'translateY(-1px)'
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'transparent'
                                          e.currentTarget.style.transform = 'translateY(0)'
                                        }}
                                      >
                                        {/* Circular checkbox with bounce */}
                                        <span
                                          className="flex items-center justify-center w-[18px] h-[18px] rounded-full border-2 shrink-0"
                                          style={{
                                            borderColor: done || animating ? 'var(--color-accent)' : 'var(--color-border-subtle)',
                                            backgroundColor: done || animating ? 'var(--color-accent)' : 'transparent',
                                            transition: TRANSITION_ALL,
                                            transform: animating ? 'scale(1.3)' : 'scale(1)',
                                          }}
                                        >
                                          {(done || animating) && (
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M2 5l2.5 2.5L8 3" />
                                            </svg>
                                          )}
                                        </span>
                                        <span
                                          className="text-sm truncate"
                                          style={{
                                            color: done ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                                            textDecoration: done ? 'line-through' : 'none',
                                            transition: TRANSITION_ALL,
                                          }}
                                        >
                                          {task.title}
                                        </span>
                                      </li>
                                    )
                                  })}
                                </ul>
                              )}
                            </Card>

                            {/* Pet Status Mini Card */}
                            <div
                              className="rounded-2xl cursor-pointer overflow-hidden"
                              onClick={() => navigate('/pet')}
                              style={{
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 40%, #fbbf24 100%)',
                                border: '1px solid rgba(251,191,36,0.3)',
                                boxShadow: '0 2px 12px rgba(251,191,36,0.15)',
                                padding: '16px 20px',
                                transition: TRANSITION_ALL,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(251,191,36,0.25)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 2px 12px rgba(251,191,36,0.15)'
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">
                                  {pet.type === 'cat' ? '🐱' : pet.type === 'dog' ? '🐶' : '🐰'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold" style={{ color: '#78350f' }}>{pet.name}</span>
                                    <span
                                      className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                                      style={{ background: 'rgba(120,53,15,0.12)', color: '#78350f' }}
                                    >
                                      Lv.{pet.level}
                                    </span>
                                  </div>
                                  {/* Mood bar */}
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px]" style={{ color: '#92400e' }}>{t('pet.mood')}</span>
                                    <div
                                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                                      style={{ background: 'rgba(120,53,15,0.15)' }}
                                    >
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${pet.mood}%`,
                                          background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                                          transition: 'width 500ms ease-out',
                                        }}
                                      />
                                    </div>
                                    <span className="text-[10px] tabular-nums" style={{ color: '#92400e' }}>{pet.mood}%</span>
                                  </div>
                                </div>
                              </div>
                              {/* Action buttons */}
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); feedPet() }}
                                  className="flex-1 text-[12px] font-medium py-1.5 rounded-xl cursor-pointer"
                                  style={{
                                    background: 'rgba(255,255,255,0.6)',
                                    color: '#92400e',
                                    border: '1px solid rgba(255,255,255,0.7)',
                                    backdropFilter: 'blur(4px)',
                                    transition: TRANSITION_ALL,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.85)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.6)'
                                  }}
                                >
                                  🍖 {t('pet.feed')}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); interactPet() }}
                                  className="flex-1 text-[12px] font-medium py-1.5 rounded-xl cursor-pointer"
                                  style={{
                                    background: 'rgba(255,255,255,0.6)',
                                    color: '#92400e',
                                    border: '1px solid rgba(255,255,255,0.7)',
                                    backdropFilter: 'blur(4px)',
                                    transition: TRANSITION_ALL,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.85)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.6)'
                                  }}
                                >
                                  🤗 {t('pet.interact')}
                                </button>
                              </div>
                            </div>

                            {/* Habits */}
                            <Card padding="sm">
                              <h2 className="text-sm font-semibold px-2 pt-2 pb-3" style={{ color: 'var(--color-text-primary)' }}>
                                {t('habits.today')}
                              </h2>
                              {habits.length === 0 ? (
                                <p className="text-xs px-2 pb-3" style={{ color: 'var(--color-text-muted)' }}>{t('habits.noHabits')}</p>
                              ) : (
                                <div className="grid grid-cols-2 gap-2 px-1 pb-2">
                                  {habits.map((habit) => {
                                    const done = habit.checkins[today] && habit.checkins[today] > 0
                                    const animating = checkedHabits[habit.id]
                                    const habitColor = (habit as any).color || 'var(--color-accent)'
                                    return (
                                      <button
                                        key={habit.id}
                                        onClick={() => handleCheckin(habit.id)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-left cursor-pointer"
                                        style={{
                                          transition: TRANSITION_ALL,
                                          background: done
                                            ? `${habitColor}18`
                                            : 'var(--color-bg-surface-2)',
                                          border: done ? `1px solid ${habitColor}30` : '1px solid transparent',
                                          transform: animating ? 'scale(0.95)' : 'scale(1)',
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!done) e.currentTarget.style.opacity = '0.85'
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.opacity = '1'
                                        }}
                                      >
                                        <span className="text-base">{habit.icon}</span>
                                        <span
                                          className="text-xs font-medium truncate"
                                          style={{ color: done ? habitColor : 'var(--color-text-secondary)' }}
                                        >
                                          {habit.name}
                                        </span>
                                        {(done || animating) && (
                                          <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 12 12"
                                            fill="none"
                                            className="ml-auto shrink-0"
                                            style={{
                                              transition: TRANSITION_ALL,
                                              transform: animating ? 'scale(1.4)' : 'scale(1)',
                                            }}
                                          >
                                            <path
                                              d="M2.5 6l2.5 2.5L9.5 4"
                                              stroke={habitColor}
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </Card>
                          </div>
                        </div>
                      </SortableWidget>
                    );

                  case 'categoryBreakdown':
                    return categoryBar.length > 0 ? (
                      <SortableWidget key="categoryBreakdown" id="categoryBreakdown">
                        <Card padding="sm">
                          <h2 className="text-sm font-semibold px-2 pt-2 pb-3" style={{ color: 'var(--color-text-primary)' }}>
                            {t('dashboard.categoryBreakdown')}
                          </h2>
                          <div className="px-2 pb-3 space-y-2">
                            {/* Stacked bar with rounded segments and gradients */}
                            <div className="flex h-7 rounded-full overflow-hidden gap-[2px]">
                              {categoryBar.map(({ cat, pct, mins }) => {
                                const baseColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS['其他']
                                const isWide = pct >= 15
                                return (
                                  <div
                                    key={cat}
                                    className="relative flex items-center justify-center overflow-hidden first:rounded-l-full last:rounded-r-full"
                                    style={{
                                      width: `${Math.max(pct, 2)}%`,
                                      background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}CC 100%)`,
                                      transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                    title={`${cat}: ${pct.toFixed(1)}%`}
                                  >
                                    {isWide && (
                                      <span className="text-[10px] font-medium text-white truncate px-1.5">
                                        {cat} {fmtDuration(mins)}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                            {/* Legend — show labels below for narrow segments */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {categoryBar.map(({ cat, mins, pct }) => (
                                <div key={cat} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                                  <span
                                    className="w-2 h-2 rounded-sm shrink-0"
                                    style={{ background: CATEGORY_COLORS[cat] || CATEGORY_COLORS['其他'] }}
                                  />
                                  {cat} {fmtDuration(mins)} ({pct.toFixed(0)}%)
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      </SortableWidget>
                    ) : null;

                  default:
                    return null;
                }
              })}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <SortableWidget id={activeId} isOverlay>
                <div className="opacity-90 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 min-w-[200px]">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{activeId}</div>
                </div>
              </SortableWidget>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}