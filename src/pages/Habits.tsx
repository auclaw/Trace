import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, Modal, Button, Input } from '../components/ui'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import type { Habit, HabitCategory } from '../services/dataService'

// ── Constants ──

const EMOJI_OPTIONS = [
  '📚', '🏃', '🧘', '💻', '🌍', '🌅', '✍️', '🎵',
  '💪', '🧠', '🎨', '🍎', '💤', '🚴', '📝', '🌿',
  '💧', '🎯', '🧃', '🍵', '🥗', '🛌', '🎹', '🐾',
]

const COLOR_OPTIONS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
]

const CATEGORY_OPTIONS: { value: HabitCategory; label: string }[] = [
  { value: 'health', label: '健康' },
  { value: 'learning', label: '学习' },
  { value: 'fitness', label: '健身' },
  { value: 'mindfulness', label: '正念' },
  { value: 'other', label: '其他' },
]

const REMINDER_OPTIONS = [
  '06:00', '06:30', '07:00', '08:00', '09:00', '10:00',
  '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
]

const ENCOURAGEMENTS = [
  '太棒了！继续保持！💪',
  '你的小猫咪为你骄傲！🐱',
  '你真是太厉害了！✨',
  '坚持就是胜利！🏆',
  '每一步都算数！🌟',
  '好习惯正在养成中～🌱',
]

function getEncouragement(habit: Habit, today: string): string {
  const todayCount = habit.checkins[today] || 0
  const isMulti = habit.targetCount > 1
  const target = isMulti ? habit.targetCount : (habit.targetMinutes || 1)
  const remaining = target - todayCount

  if (habit.streak >= 7) {
    return `已经连续${habit.streak}天了，别断了哦～🔥`
  }
  if (isMulti && remaining === 1) {
    return '再来一次就完成目标啦！🎯'
  }
  if (isMulti && remaining <= 0) {
    return '今日目标已达成！你太棒了！🎉'
  }
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Style injection ──

const STYLE_ID = 'habits-premium-styles'

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
@keyframes habitCardFadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes celebrationPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
@keyframes bubbleIn {
  0% { opacity: 0; transform: translateY(8px) scale(0.9); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes bubbleOut {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-8px) scale(0.9); }
}
.habit-card-animated {
  animation: habitCardFadeIn 400ms ease-out both;
}
.habit-card-animated:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg, 0 12px 28px rgba(0,0,0,0.12));
}
.habit-streak-badge {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%);
  color: #fff; font-weight: 600; font-size: 11px;
  padding: 3px 10px; border-radius: 999px;
  display: inline-flex; align-items: center; gap: 3px;
  box-shadow: 0 2px 8px rgba(245,158,11,0.3);
}
.habit-streak-golden {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 30%, #d97706 60%, #fbbf24 100%);
  background-size: 200% 200%;
  animation: goldenShimmer 2s ease-in-out infinite;
  padding: 4px 12px; font-size: 12px;
  box-shadow: 0 3px 12px rgba(245,158,11,0.45);
}
@keyframes goldenShimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.habit-quick-pill {
  border-radius: 999px;
  border: 1.5px solid var(--color-border-subtle, #e2e8f0);
  padding: 6px 16px; font-size: 13px; font-weight: 500;
  background: transparent; color: var(--color-text-secondary, #64748b);
  cursor: pointer; transition: all 200ms ease;
}
.habit-quick-pill:hover {
  border-color: var(--color-accent, #6366f1);
  color: var(--color-accent, #6366f1);
}
.habit-quick-pill.active {
  background: var(--color-accent, #6366f1);
  border-color: var(--color-accent, #6366f1);
  color: #fff;
}
.habit-celebration {
  animation: celebrationPulse 600ms ease-in-out;
  font-size: 24px; text-align: center; margin-top: 4px;
}
.encourage-bubble {
  animation: bubbleIn 300ms ease-out forwards;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e; border-radius: 16px; padding: 10px 16px;
  font-size: 13px; font-weight: 500;
  box-shadow: 0 4px 16px rgba(245,158,11,0.2);
  position: absolute; bottom: 100%; left: 50%;
  transform: translateX(-50%); white-space: nowrap;
  margin-bottom: 8px; z-index: 10;
  pointer-events: none;
}
.encourage-bubble.fade-out {
  animation: bubbleOut 300ms ease-in forwards;
}
`
  document.head.appendChild(style)
}

// ── ProgressRing ──

function ProgressRing({
  value, max, size = 80, strokeWidth = 6, color,
}: {
  value: number; max: number; size?: number; strokeWidth?: number; color: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circumference * (1 - ratio)

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={`${color}18`} strokeWidth={strokeWidth + 2}
        style={{ filter: `drop-shadow(0 0 3px ${color}15)` }} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 500ms ease-out', filter: `drop-shadow(0 0 4px ${color}40)` }} />
    </svg>
  )
}

// ── EncouragementBubble ──

function EncouragementBubble({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null
  return <div className={`encourage-bubble${visible ? '' : ' fade-out'}`}>{message}</div>
}

// ── HabitHeatmap ──

function HabitHeatmap({ habit }: { habit: Habit }) {
  const isMulti = habit.targetCount > 1

  const cells = useMemo(() => {
    const result: { date: string; label: string; ratio: number }[] = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const val = habit.checkins[ds] || 0
      let ratio: number
      if (isMulti) {
        ratio = habit.targetCount > 0 ? Math.min(val / habit.targetCount, 1.5) : (val > 0 ? 1 : 0)
      } else {
        ratio = habit.targetMinutes > 0 ? Math.min(val / habit.targetMinutes, 1.5) : (val > 0 ? 1 : 0)
      }
      const unit = isMulti ? '次' : '分钟'
      result.push({ date: ds, label: `${ds}: ${val}${unit}`, ratio })
    }
    return result
  }, [habit, isMulti])

  function getOpacity(ratio: number): number {
    if (ratio >= 1.0) return 1.0
    if (ratio >= 0.8) return 0.8
    if (ratio >= 0.5) return 0.5
    if (ratio >= 0.3) return 0.3
    if (ratio >= 0.01) return 0.1
    return 0
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{
            background: `linear-gradient(135deg, ${habit.color}15 0%, ${habit.color}30 100%)`,
            boxShadow: `0 2px 8px ${habit.color}15`,
          }}>
          {habit.icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{habit.name}</h3>
          <p className="text-[11px] text-[var(--color-text-muted)]">30天打卡热力图</p>
        </div>
      </div>
      <div className="grid grid-cols-10 gap-2">
        {cells.map((cell) => {
          const op = getOpacity(cell.ratio)
          return (
            <div key={cell.date} title={cell.label}
              style={{
                width: 20, height: 20, borderRadius: 5,
                transition: 'all 200ms ease',
                backgroundColor: op > 0
                  ? `color-mix(in srgb, ${habit.color} ${Math.round(op * 100)}%, var(--color-bg-surface-2))`
                  : 'var(--color-bg-surface-2)',
                boxShadow: op > 0.5 ? `0 1px 4px ${habit.color}20` : 'none',
              }} />
          )
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] text-[var(--color-text-muted)]">
        <span>少</span>
        <div className="flex gap-1">
          {[0, 0.1, 0.3, 0.5, 0.8, 1.0].map((o) => (
            <div key={o} style={{
              width: 14, height: 14, borderRadius: 3,
              backgroundColor: o > 0
                ? `color-mix(in srgb, ${habit.color} ${Math.round(o * 100)}%, var(--color-bg-surface-2))`
                : 'var(--color-bg-surface-2)',
            }} />
          ))}
        </div>
        <span>多</span>
      </div>
    </div>
  )
}

// ── Main Component ──

export default function Habits() {
  const { isDark: _ } = useTheme()
  void _

  const habits = useAppStore((s) => s.habits)
  const loadHabits = useAppStore((s) => s.loadHabits)
  const addHabit = useAppStore((s) => s.addHabit)
  const updateHabit = useAppStore((s) => s.updateHabit)
  const deleteHabit = useAppStore((s) => s.deleteHabit)
  const checkinHabit = useAppStore((s) => s.checkinHabit)
  const addToast = useAppStore((s) => s.addToast)

  const [showHabitModal, setShowHabitModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [checkinTarget, setCheckinTarget] = useState<Habit | null>(null)
  const [checkinMinutes, setCheckinMinutes] = useState('')
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [encourageMap, setEncourageMap] = useState<Record<string, string>>({})

  // Form state
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('📚')
  const [formTarget, setFormTarget] = useState('30')
  const [formTargetCount, setFormTargetCount] = useState('1')
  const [formColor, setFormColor] = useState(COLOR_OPTIONS[0])
  const [formCategory, setFormCategory] = useState<HabitCategory>('other')
  const [formReminders, setFormReminders] = useState<string[]>([])

  useEffect(() => { loadHabits() }, [loadHabits])
  useEffect(() => { injectStyles() }, [])

  const today = todayStr()

  const showEncouragement = useCallback((habitId: string, msg: string) => {
    setEncourageMap((prev) => ({ ...prev, [habitId]: msg }))
    setTimeout(() => {
      setEncourageMap((prev) => {
        const next = { ...prev }
        delete next[habitId]
        return next
      })
    }, 2500)
  }, [])

  // ── Modal openers ──
  const openAddModal = () => {
    setEditingHabit(null)
    setFormName(''); setFormIcon('📚'); setFormTarget('30')
    setFormTargetCount('1'); setFormColor(COLOR_OPTIONS[0])
    setFormCategory('other'); setFormReminders([])
    setShowHabitModal(true)
  }

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit)
    setFormName(habit.name); setFormIcon(habit.icon)
    setFormTarget(String(habit.targetMinutes))
    setFormTargetCount(String(habit.targetCount))
    setFormColor(habit.color)
    setFormCategory(habit.category || 'other')
    setFormReminders(habit.reminders || [])
    setShowHabitModal(true)
  }

  const handleSaveHabit = () => {
    const name = formName.trim()
    if (!name) return
    const targetMinutes = parseInt(formTarget) || 0
    const targetCount = Math.max(1, parseInt(formTargetCount) || 1)

    if (editingHabit) {
      updateHabit(editingHabit.id, {
        name, icon: formIcon, targetMinutes, targetCount,
        color: formColor, category: formCategory, reminders: formReminders,
      })
    } else {
      addHabit({
        name, icon: formIcon, targetMinutes, targetCount,
        color: formColor, streak: 0, checkins: {},
        createdAt: new Date().toISOString(),
        category: formCategory, reminders: formReminders,
      })
    }
    setShowHabitModal(false)
  }

  // ── Quick checkin (for multi-check habits) ──
  const handleQuickCheckin = (habit: Habit) => {
    const isMulti = habit.targetCount > 1
    const currentVal = habit.checkins[today] || 0

    if (isMulti) {
      if (currentVal >= habit.targetCount) {
        addToast('info', '今日目标已完成！')
        return
      }
      checkinHabit(habit.id, today, 1)
      const msg = getEncouragement(habit, today)
      showEncouragement(habit.id, msg)
    } else if (habit.targetMinutes === 0) {
      // Boolean habit (e.g., 早起)
      if (currentVal > 0) {
        addToast('info', '今天已经打卡了！')
        return
      }
      checkinHabit(habit.id, today, 1)
      const msg = getEncouragement(habit, today)
      showEncouragement(habit.id, msg)
    } else {
      // Minutes-based: open checkin modal
      openCheckinModal(habit)
    }
  }

  // ── Checkin modal (for minutes-based habits) ──
  const openCheckinModal = (habit: Habit) => {
    setCheckinTarget(habit)
    setCheckinMinutes('')
    setShowCheckinModal(true)
  }

  const handleCheckin = () => {
    if (!checkinTarget) return
    const mins = parseInt(checkinMinutes) || 0
    if (mins <= 0) return
    checkinHabit(checkinTarget.id, today, mins)
    const msg = getEncouragement(checkinTarget, today)
    addToast('success', msg)
    setShowCheckinModal(false)
  }

  const handleDelete = (habit: Habit) => {
    deleteHabit(habit.id)
    setShowHabitModal(false)
    if (selectedHabitId === habit.id) setSelectedHabitId(null)
  }

  const toggleReminder = (time: string) => {
    setFormReminders((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time].sort()
    )
  }

  const selectedHabit = habits.find((h) => h.id === selectedHabitId) || null

  const checkinProgressPct = checkinTarget && checkinTarget.targetMinutes > 0
    ? Math.min(100, (((checkinTarget.checkins[today] || 0) + (parseInt(checkinMinutes) || 0)) / checkinTarget.targetMinutes) * 100)
    : 0

  // ── Render helpers ──
  function renderStreakBadge(habit: Habit) {
    if (habit.streak <= 0) return null
    const isGolden = habit.streak >= 7
    return (
      <span className={`habit-streak-badge${isGolden ? ' habit-streak-golden' : ''}`} style={{ marginBottom: 4 }}>
        🔥 连续 {habit.streak} 天
      </span>
    )
  }

  function renderProgressCenter(habit: Habit) {
    const isMulti = habit.targetCount > 1
    const currentVal = habit.checkins[today] || 0

    if (isMulti) {
      return (
        <>
          <span className="text-xs font-bold text-[var(--color-text-primary)] tabular-nums">
            {currentVal}/{habit.targetCount}
          </span>
          <span className="text-[9px] text-[var(--color-text-muted)]">次</span>
        </>
      )
    }
    if (habit.targetMinutes === 0) {
      return (
        <span className="text-lg">
          {currentVal > 0 ? '✅' : '○'}
        </span>
      )
    }
    return (
      <>
        <span className="text-xs font-bold text-[var(--color-text-primary)] tabular-nums">
          {currentVal}
        </span>
        <span className="text-[9px] text-[var(--color-text-muted)]">/{habit.targetMinutes}分</span>
      </>
    )
  }

  function getHabitProgress(habit: Habit): number {
    const currentVal = habit.checkins[today] || 0
    if (habit.targetCount > 1) {
      return habit.targetCount > 0 ? Math.min(Math.round((currentVal / habit.targetCount) * 100), 100) : 0
    }
    if (habit.targetMinutes > 0) {
      return Math.min(Math.round((currentVal / habit.targetMinutes) * 100), 100)
    }
    return currentVal > 0 ? 100 : 0
  }

  function getProgressMax(habit: Habit): number {
    if (habit.targetCount > 1) return habit.targetCount
    if (habit.targetMinutes > 0) return habit.targetMinutes
    return 1
  }

  return (
    <div style={{ padding: '32px 40px' }} className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">习惯打卡</h1>
        <Button onClick={openAddModal} size="sm">添加习惯</Button>
      </div>

      {/* Habits Grid */}
      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-7xl mb-6" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))' }}>🎯</div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">开始追踪你的习惯</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-xs text-center">
            添加你想要养成的习惯，每天打卡追踪进度，一步步成为更好的自己
          </p>
          <Button onClick={openAddModal}>开始追踪第一个习惯</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8" style={{ gap: 20 }}>
            {habits.map((habit, index) => {
              const pct = getHabitProgress(habit)
              const isSelected = selectedHabitId === habit.id
              const currentVal = habit.checkins[today] || 0
              const hasReminders = habit.reminders && habit.reminders.length > 0

              return (
                <div key={habit.id} className="habit-card-animated"
                  style={{
                    animationDelay: `${index * 60}ms`, borderRadius: 16,
                    background: `linear-gradient(135deg, ${habit.color}08 0%, ${habit.color}15 100%)`,
                    borderTop: `3px solid ${habit.color}`,
                    boxShadow: isSelected
                      ? `0 0 0 2px var(--color-accent), var(--shadow-md, 0 4px 16px rgba(0,0,0,0.08))`
                      : 'var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.06))',
                    cursor: 'pointer', transition: 'all 200ms ease',
                    padding: '20px 16px 16px', position: 'relative',
                  }}
                  onClick={() => setSelectedHabitId(isSelected ? null : habit.id)}>
                  <div className="flex flex-col items-center text-center">
                    {/* Reminder bell */}
                    {hasReminders && (
                      <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 14 }}
                        title={`提醒: ${habit.reminders.join(', ')}`}>
                        🔔
                      </div>
                    )}

                    {/* Emoji circle */}
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%', background: '#fff',
                      boxShadow: `0 4px 12px ${habit.color}18, 0 1px 3px rgba(0,0,0,0.06)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 32, marginBottom: 12,
                    }}>
                      {habit.icon}
                    </div>

                    {/* Name */}
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]" style={{ marginBottom: 6 }}>
                      {habit.name}
                    </span>

                    {/* Streak badge */}
                    {renderStreakBadge(habit)}

                    {/* Multi-check progress bar */}
                    {habit.targetCount > 1 && (
                      <div style={{ width: '100%', marginTop: 8, marginBottom: 4 }}>
                        <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mb-1">
                          <span>今日进度</span>
                          <span className="tabular-nums">{currentVal}/{habit.targetCount}</span>
                        </div>
                        <div style={{
                          height: 6, borderRadius: 999, overflow: 'hidden',
                          background: `${habit.color}15`,
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 999,
                            transition: 'width 400ms ease',
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${habit.color}99, ${habit.color})`,
                            boxShadow: pct > 0 ? `0 1px 4px ${habit.color}30` : 'none',
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Progress Ring (for non-multi-check) */}
                    {habit.targetCount <= 1 && (
                      <div className="relative" style={{ margin: '12px 0' }}>
                        <ProgressRing
                          value={currentVal}
                          max={getProgressMax(habit)}
                          color={habit.color} size={76} strokeWidth={5}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          {renderProgressCenter(habit)}
                        </div>
                      </div>
                    )}

                    {/* Actions + encouragement bubble */}
                    <div className="relative flex gap-2 mt-1">
                      <EncouragementBubble message={encourageMap[habit.id] || ''} visible={!!encourageMap[habit.id]} />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleQuickCheckin(habit) }}
                        style={{
                          background: pct >= 100 ? 'var(--color-bg-surface-2)' : habit.color,
                          color: pct >= 100 ? 'var(--color-text-secondary)' : '#fff',
                          border: 'none', borderRadius: 8, padding: '6px 18px',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          transition: 'all 200ms ease',
                          boxShadow: pct >= 100 ? 'none' : `0 3px 10px ${habit.color}35`,
                        }}>
                        {pct >= 100 ? '✅ 已完成' : (habit.targetCount > 1 ? '+1' : '打卡')}
                      </button>
                      <Button size="sm" variant="ghost"
                        onClick={(e) => { e.stopPropagation(); openEditModal(habit) }}>
                        编辑
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Heatmap Section */}
          {selectedHabit && (
            <Card padding="md" className="mb-8">
              <HabitHeatmap habit={selectedHabit} />
            </Card>
          )}
        </>
      )}

      {/* Add/Edit Habit Modal */}
      <Modal isOpen={showHabitModal} onClose={() => setShowHabitModal(false)}
        title={editingHabit ? '编辑习惯' : '添加习惯'} size="sm"
        footer={
          <>
            {editingHabit && (
              <Button variant="danger" size="sm" onClick={() => handleDelete(editingHabit)} className="mr-auto">
                删除
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setShowHabitModal(false)}>取消</Button>
            <Button size="sm" onClick={handleSaveHabit} disabled={!formName.trim()}>保存</Button>
          </>
        }>
        <div className="space-y-5">
          <Input label="习惯名称" value={formName} onChange={setFormName} placeholder="例如：读书、喝水" />

          {/* Emoji picker */}
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-2">图标</label>
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => setFormIcon(emoji)}
                  className={[
                    'w-10 h-10 rounded-xl text-xl flex items-center justify-center',
                    'transition-all duration-150 cursor-pointer',
                    formIcon === emoji
                      ? 'bg-[var(--color-accent-soft)] ring-2 ring-[var(--color-accent)] scale-110'
                      : 'bg-[var(--color-bg-surface-2)] hover:bg-[var(--color-bg-surface-2)]/80',
                  ].join(' ')}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-2">分类</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button key={cat.value} type="button"
                  className={`habit-quick-pill${formCategory === cat.value ? ' active' : ''}`}
                  onClick={() => setFormCategory(cat.value)}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target count */}
          <Input label="每日目标次数" value={formTargetCount} onChange={setFormTargetCount}
            type="number" placeholder="1（多次打卡如喝水设为8）" />

          {/* Target minutes (only when count is 1) */}
          {(parseInt(formTargetCount) || 1) <= 1 && (
            <Input label="每日目标(分钟)" value={formTarget} onChange={setFormTarget}
              type="number" placeholder="30（设0表示仅打卡）" />
          )}

          {/* Color picker */}
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-2">颜色</label>
            <div className="flex gap-2.5">
              {COLOR_OPTIONS.map((color) => (
                <button key={color} type="button" onClick={() => setFormColor(color)}
                  className={[
                    'w-8 h-8 rounded-full transition-all duration-150 cursor-pointer',
                    formColor === color ? 'ring-2 ring-offset-2 ring-offset-[var(--color-bg-surface-1)] scale-110' : '',
                  ].join(' ')}
                  style={{
                    backgroundColor: color,
                    ...(formColor === color ? { boxShadow: `0 0 0 2px ${color}` } : {}),
                  }} />
              ))}
            </div>
          </div>

          {/* Reminder times */}
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-2">
              提醒时间 🔔 {formReminders.length > 0 && `(已选${formReminders.length}个)`}
            </label>
            <div className="flex flex-wrap gap-1.5" style={{ maxHeight: 100, overflowY: 'auto' }}>
              {REMINDER_OPTIONS.map((time) => (
                <button key={time} type="button"
                  className={`habit-quick-pill${formReminders.includes(time) ? ' active' : ''}`}
                  style={{ padding: '4px 10px', fontSize: 12 }}
                  onClick={() => toggleReminder(time)}>
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Checkin Modal (minutes-based) */}
      <Modal isOpen={showCheckinModal} onClose={() => setShowCheckinModal(false)}
        title="打卡" size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowCheckinModal(false)}>取消</Button>
            <Button size="sm" onClick={handleCheckin}
              disabled={!checkinMinutes || parseInt(checkinMinutes) <= 0}>
              确认打卡
            </Button>
          </>
        }>
        {checkinTarget && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                background: `linear-gradient(135deg, ${checkinTarget.color}15 0%, ${checkinTarget.color}30 100%)`,
              }}>
                {checkinTarget.icon}
              </div>
              <div>
                <div className="font-semibold text-[var(--color-text-primary)]">{checkinTarget.name}</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  今日已打卡 {checkinTarget.checkins[today] || 0} / {checkinTarget.targetMinutes} 分钟
                </div>
              </div>
            </div>

            <Input label="本次完成分钟数" value={checkinMinutes} onChange={setCheckinMinutes}
              type="number" placeholder="输入分钟数" />

            <div className="flex flex-wrap gap-2">
              {[15, 30, 45, 60].map((m) => (
                <button key={m} type="button"
                  className={`habit-quick-pill${checkinMinutes === String(m) ? ' active' : ''}`}
                  onClick={() => setCheckinMinutes(String(m))}>
                  {m}分钟
                </button>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1.5">
                <span>今日进度</span>
                <span>{(checkinTarget.checkins[today] || 0) + (parseInt(checkinMinutes) || 0)} / {checkinTarget.targetMinutes} 分钟</span>
              </div>
              <div style={{
                height: 10, borderRadius: 999, overflow: 'hidden',
                background: `${checkinTarget.color}15`, position: 'relative',
              }}>
                <div style={{
                  height: '100%', borderRadius: 999, transition: 'width 300ms ease',
                  width: `${checkinProgressPct}%`,
                  background: `linear-gradient(90deg, ${checkinTarget.color}99, ${checkinTarget.color})`,
                  boxShadow: checkinProgressPct > 0 ? `0 1px 6px ${checkinTarget.color}40` : 'none',
                }} />
              </div>
              {checkinProgressPct >= 100 && (
                <div className="habit-celebration">🎉 目标达成！</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
