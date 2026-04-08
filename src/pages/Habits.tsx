import { useState, useEffect, useMemo } from 'react'
import { Card, Modal, Button, Input } from '../components/ui'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import type { Habit } from '../services/dataService'

// ── Constants ──

const EMOJI_OPTIONS = [
  '📚', '🏃', '🧘', '💻', '🌍', '🌅', '✍️', '🎵',
  '💪', '🧠', '🎨', '🍎', '💤', '🚴', '📝', '🌿',
]

const COLOR_OPTIONS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
]

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Keyframes style injection ──

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
.habit-card-animated {
  animation: habitCardFadeIn 400ms ease-out both;
}
.habit-card-animated:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg, 0 12px 28px rgba(0,0,0,0.12));
}
.habit-streak-badge {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%);
  color: #fff;
  font-weight: 600;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  box-shadow: 0 2px 8px rgba(245,158,11,0.3);
}
.habit-quick-pill {
  border-radius: 999px;
  border: 1.5px solid var(--color-border-subtle, #e2e8f0);
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  color: var(--color-text-secondary, #64748b);
  cursor: pointer;
  transition: all 200ms ease;
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
  font-size: 24px;
  text-align: center;
  margin-top: 4px;
}
`
  document.head.appendChild(style)
}

// ── Circular Progress Ring ──

function ProgressRing({
  value,
  max,
  size = 80,
  strokeWidth = 6,
  color,
}: {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circumference * (1 - ratio)

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`${color}18`}
        strokeWidth={strokeWidth + 2}
        style={{ filter: `drop-shadow(0 0 3px ${color}15)` }}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 500ms ease-out', filter: `drop-shadow(0 0 4px ${color}40)` }}
      />
    </svg>
  )
}

// ── Heatmap Component ──

function HabitHeatmap({ habit }: { habit: Habit }) {
  const cells = useMemo(() => {
    const result: { date: string; label: string; ratio: number }[] = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const mins = habit.checkins[ds] || 0
      const ratio = habit.targetMinutes > 0 ? Math.min(mins / habit.targetMinutes, 1.5) : (mins > 0 ? 1 : 0)
      result.push({ date: ds, label: `${ds}: ${mins}分钟`, ratio })
    }
    return result
  }, [habit])

  const opacityLevels = [
    { threshold: 0, opacity: 0 },
    { threshold: 0.01, opacity: 0.1 },
    { threshold: 0.3, opacity: 0.3 },
    { threshold: 0.5, opacity: 0.5 },
    { threshold: 0.8, opacity: 0.8 },
    { threshold: 1.0, opacity: 1.0 },
  ]

  function getOpacity(ratio: number): number {
    let op = 0
    for (const level of opacityLevels) {
      if (ratio >= level.threshold) op = level.opacity
    }
    return op
  }

  return (
    <div>
      {/* Selected habit header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{
            background: `linear-gradient(135deg, ${habit.color}15 0%, ${habit.color}30 100%)`,
            boxShadow: `0 2px 8px ${habit.color}15`,
          }}
        >
          {habit.icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
            {habit.name}
          </h3>
          <p className="text-[11px] text-[var(--color-text-muted)]">30天打卡热力图</p>
        </div>
      </div>

      {/* Heatmap grid - 20px cells */}
      <div className="grid grid-cols-10 gap-2">
        {cells.map((cell) => {
          const op = getOpacity(cell.ratio)
          return (
            <div
              key={cell.date}
              title={cell.label}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                transition: 'all 200ms ease',
                backgroundColor: op > 0
                  ? `color-mix(in srgb, ${habit.color} ${Math.round(op * 100)}%, var(--color-bg-surface-2))`
                  : 'var(--color-bg-surface-2)',
                boxShadow: op > 0.5 ? `0 1px 4px ${habit.color}20` : 'none',
              }}
            />
          )
        })}
      </div>

      {/* Legend row */}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-[var(--color-text-muted)]">
        <span>少</span>
        <div className="flex gap-1">
          {[0, 0.1, 0.3, 0.5, 0.8, 1.0].map((o) => (
            <div
              key={o}
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                backgroundColor: o > 0
                  ? `color-mix(in srgb, ${habit.color} ${Math.round(o * 100)}%, var(--color-bg-surface-2))`
                  : 'var(--color-bg-surface-2)',
              }}
            />
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

  const [showHabitModal, setShowHabitModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [checkinTarget, setCheckinTarget] = useState<Habit | null>(null)
  const [checkinMinutes, setCheckinMinutes] = useState('')
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)

  // Form state for add/edit
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('📚')
  const [formTarget, setFormTarget] = useState('30')
  const [formColor, setFormColor] = useState(COLOR_OPTIONS[0])

  useEffect(() => {
    loadHabits()
  }, [loadHabits])

  useEffect(() => {
    injectStyles()
  }, [])

  const today = todayStr()

  // Open add modal
  const openAddModal = () => {
    setEditingHabit(null)
    setFormName('')
    setFormIcon('📚')
    setFormTarget('30')
    setFormColor(COLOR_OPTIONS[0])
    setShowHabitModal(true)
  }

  // Open edit modal
  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit)
    setFormName(habit.name)
    setFormIcon(habit.icon)
    setFormTarget(String(habit.targetMinutes))
    setFormColor(habit.color)
    setShowHabitModal(true)
  }

  // Save habit
  const handleSaveHabit = () => {
    const name = formName.trim()
    if (!name) return
    const target = parseInt(formTarget) || 0

    if (editingHabit) {
      updateHabit(editingHabit.id, {
        name,
        icon: formIcon,
        targetMinutes: target,
        color: formColor,
      })
    } else {
      addHabit({
        name,
        icon: formIcon,
        targetMinutes: target,
        color: formColor,
        streak: 0,
        checkins: {},
        createdAt: new Date().toISOString(),
      })
    }
    setShowHabitModal(false)
  }

  // Open checkin modal
  const openCheckinModal = (habit: Habit) => {
    setCheckinTarget(habit)
    setCheckinMinutes('')
    setShowCheckinModal(true)
  }

  // Confirm checkin
  const handleCheckin = () => {
    if (!checkinTarget) return
    const mins = parseInt(checkinMinutes) || 0
    if (mins <= 0) return
    checkinHabit(checkinTarget.id, today, mins)
    setShowCheckinModal(false)
  }

  // Delete with confirmation
  const handleDelete = (habit: Habit) => {
    deleteHabit(habit.id)
    setShowHabitModal(false)
    if (selectedHabitId === habit.id) setSelectedHabitId(null)
  }

  const selectedHabit = habits.find((h) => h.id === selectedHabitId) || null

  // Checkin progress calculation for modal
  const checkinProgressPct = checkinTarget && checkinTarget.targetMinutes > 0
    ? Math.min(100, (((checkinTarget.checkins[today] || 0) + (parseInt(checkinMinutes) || 0)) / checkinTarget.targetMinutes) * 100)
    : 0

  return (
    <div style={{ padding: '32px 40px' }} className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          习惯打卡
        </h1>
        <Button onClick={openAddModal} size="sm">
          添加习惯
        </Button>
      </div>

      {/* Habits Grid */}
      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-7xl mb-6" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))' }}>🎯</div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">开始追踪你的习惯</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-xs text-center">
            添加你想要养成的习惯，每天打卡追踪进度，一步步成为更好的自己
          </p>
          <Button onClick={openAddModal}>
            开始追踪第一个习惯
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8" style={{ gap: 20 }}>
            {habits.map((habit, index) => {
              const todayMins = habit.checkins[today] || 0
              const pct = habit.targetMinutes > 0
                ? Math.min(Math.round((todayMins / habit.targetMinutes) * 100), 100)
                : (todayMins > 0 ? 100 : 0)
              const isSelected = selectedHabitId === habit.id

              return (
                <div
                  key={habit.id}
                  className="habit-card-animated"
                  style={{
                    animationDelay: `${index * 60}ms`,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${habit.color}08 0%, ${habit.color}15 100%)`,
                    borderTop: `3px solid ${habit.color}`,
                    boxShadow: isSelected
                      ? `0 0 0 2px var(--color-accent), var(--shadow-md, 0 4px 16px rgba(0,0,0,0.08))`
                      : 'var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.06))',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    padding: '20px 16px 16px',
                  }}
                  onClick={() => setSelectedHabitId(isSelected ? null : habit.id)}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Large emoji in white circle */}
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: '#fff',
                        boxShadow: `0 4px 12px ${habit.color}18, 0 1px 3px rgba(0,0,0,0.06)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 32,
                        marginBottom: 12,
                      }}
                    >
                      {habit.icon}
                    </div>

                    {/* Name */}
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]" style={{ marginBottom: 6 }}>
                      {habit.name}
                    </span>

                    {/* Streak badge */}
                    {habit.streak > 0 && (
                      <span className="habit-streak-badge" style={{ marginBottom: 4 }}>
                        🔥 连续 {habit.streak} 天
                      </span>
                    )}

                    {/* Progress Ring */}
                    <div className="relative" style={{ margin: '12px 0' }}>
                      <ProgressRing
                        value={todayMins}
                        max={habit.targetMinutes || 1}
                        color={habit.color}
                        size={76}
                        strokeWidth={5}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-[var(--color-text-primary)] tabular-nums">
                          {todayMins}
                        </span>
                        <span className="text-[9px] text-[var(--color-text-muted)]">
                          /{habit.targetMinutes}分
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openCheckinModal(habit)
                        }}
                        style={{
                          background: pct >= 100 ? 'var(--color-bg-surface-2)' : habit.color,
                          color: pct >= 100 ? 'var(--color-text-secondary)' : '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 18px',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 200ms ease',
                          boxShadow: pct >= 100 ? 'none' : `0 3px 10px ${habit.color}35`,
                        }}
                      >
                        {pct >= 100 ? '✅ 已完成' : '打卡'}
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(habit)
                        }}
                      >
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
      <Modal
        isOpen={showHabitModal}
        onClose={() => setShowHabitModal(false)}
        title={editingHabit ? '编辑习惯' : '添加习惯'}
        size="sm"
        footer={
          <>
            {editingHabit && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(editingHabit)}
                className="mr-auto"
              >
                删除
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setShowHabitModal(false)}>
              取消
            </Button>
            <Button size="sm" onClick={handleSaveHabit} disabled={!formName.trim()}>
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Name */}
          <Input
            label="习惯名称"
            value={formName}
            onChange={setFormName}
            placeholder="例如：读书、运动"
          />

          {/* Emoji picker */}
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-2">
              图标
            </label>
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormIcon(emoji)}
                  className={[
                    'w-10 h-10 rounded-xl text-xl flex items-center justify-center',
                    'transition-all duration-150 cursor-pointer',
                    formIcon === emoji
                      ? 'bg-[var(--color-accent-soft)] ring-2 ring-[var(--color-accent)] scale-110'
                      : 'bg-[var(--color-bg-surface-2)] hover:bg-[var(--color-bg-surface-2)]/80',
                  ].join(' ')}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Target minutes */}
          <Input
            label="每日目标(分钟)"
            value={formTarget}
            onChange={setFormTarget}
            type="number"
            placeholder="30"
          />

          {/* Color picker */}
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-2">
              颜色
            </label>
            <div className="flex gap-2.5">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormColor(color)}
                  className={[
                    'w-8 h-8 rounded-full transition-all duration-150 cursor-pointer',
                    formColor === color ? 'ring-2 ring-offset-2 ring-offset-[var(--color-bg-surface-1)] scale-110' : '',
                  ].join(' ')}
                  style={{
                    backgroundColor: color,
                    ...(formColor === color ? { boxShadow: `0 0 0 2px ${color}` } : {}),
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Checkin Modal */}
      <Modal
        isOpen={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
        title="打卡"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowCheckinModal(false)}>
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleCheckin}
              disabled={!checkinMinutes || parseInt(checkinMinutes) <= 0}
            >
              确认打卡
            </Button>
          </>
        }
      >
        {checkinTarget && (
          <div className="space-y-5">
            {/* Habit info */}
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  background: `linear-gradient(135deg, ${checkinTarget.color}15 0%, ${checkinTarget.color}30 100%)`,
                }}
              >
                {checkinTarget.icon}
              </div>
              <div>
                <div className="font-semibold text-[var(--color-text-primary)]">
                  {checkinTarget.name}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  今日已打卡 {checkinTarget.checkins[today] || 0} / {checkinTarget.targetMinutes} 分钟
                </div>
              </div>
            </div>

            {/* Minutes input */}
            <Input
              label="本次完成分钟数"
              value={checkinMinutes}
              onChange={setCheckinMinutes}
              type="number"
              placeholder="输入分钟数"
            />

            {/* Quick pill buttons */}
            <div className="flex flex-wrap gap-2">
              {[15, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`habit-quick-pill${checkinMinutes === String(m) ? ' active' : ''}`}
                  onClick={() => setCheckinMinutes(String(m))}
                >
                  {m}分钟
                </button>
              ))}
            </div>

            {/* Today's progress bar with gradient */}
            <div>
              <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1.5">
                <span>今日进度</span>
                <span>
                  {(checkinTarget.checkins[today] || 0) + (parseInt(checkinMinutes) || 0)} / {checkinTarget.targetMinutes} 分钟
                </span>
              </div>
              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  overflow: 'hidden',
                  background: `${checkinTarget.color}15`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 999,
                    transition: 'width 300ms ease',
                    width: `${checkinProgressPct}%`,
                    background: `linear-gradient(90deg, ${checkinTarget.color}99, ${checkinTarget.color})`,
                    boxShadow: checkinProgressPct > 0 ? `0 1px 6px ${checkinTarget.color}40` : 'none',
                  }}
                />
              </div>

              {/* Celebration at 100% */}
              {checkinProgressPct >= 100 && (
                <div className="habit-celebration">
                  🎉 目标达成！
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
