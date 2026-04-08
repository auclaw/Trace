import { useState, useEffect, useMemo } from 'react'
import { Card, Modal, Button, Badge, EmptyState, Input } from '../components/ui'
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
        stroke="var(--color-border-subtle)"
        strokeOpacity={0.25}
        strokeWidth={strokeWidth}
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
        className="transition-[stroke-dashoffset] duration-500 ease-out"
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
      result.push({
        date: ds,
        label: `${ds}: ${mins}分钟`,
        ratio,
      })
    }
    return result
  }, [habit])

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
        {habit.icon} {habit.name} - 30天打卡热力图
      </h3>
      <div className="grid grid-cols-10 gap-1.5">
        {cells.map((cell) => {
          let opacity = 0
          if (cell.ratio > 0 && cell.ratio < 0.5) opacity = 0.25
          else if (cell.ratio >= 0.5 && cell.ratio < 1) opacity = 0.5
          else if (cell.ratio >= 1 && cell.ratio < 1.25) opacity = 0.75
          else if (cell.ratio >= 1.25) opacity = 1

          return (
            <div
              key={cell.date}
              title={cell.label}
              className="aspect-square rounded-sm transition-colors"
              style={{
                backgroundColor: opacity > 0
                  ? `color-mix(in srgb, ${habit.color} ${Math.round(opacity * 100)}%, var(--color-bg-surface-2))`
                  : 'var(--color-bg-surface-2)',
              }}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--color-text-muted)]">
        <span>浅(未打卡)</span>
        <div className="flex gap-0.5">
          {[0, 0.25, 0.5, 0.75, 1].map((o) => (
            <div
              key={o}
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: o > 0
                  ? `color-mix(in srgb, ${habit.color} ${Math.round(o * 100)}%, var(--color-bg-surface-2))`
                  : 'var(--color-bg-surface-2)',
              }}
            />
          ))}
        </div>
        <span>深(超额完成)</span>
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

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
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
        <EmptyState
          icon="🎯"
          title="还没有任何习惯"
          description="添加你想要养成的习惯，每天打卡追踪进度"
          action={<Button onClick={openAddModal}>添加第一个习惯</Button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {habits.map((habit) => {
              const todayMins = habit.checkins[today] || 0
              const pct = habit.targetMinutes > 0
                ? Math.min(Math.round((todayMins / habit.targetMinutes) * 100), 100)
                : (todayMins > 0 ? 100 : 0)
              const isSelected = selectedHabitId === habit.id

              return (
                <Card
                  key={habit.id}
                  hover
                  padding="sm"
                  className={isSelected ? 'ring-2 ring-[var(--color-accent)]' : ''}
                  onClick={() => setSelectedHabitId(isSelected ? null : habit.id)}
                >
                  <div className="flex flex-col items-center text-center pt-3 pb-2">
                    {/* Emoji Icon */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-3"
                      style={{ backgroundColor: `${habit.color}20` }}
                    >
                      {habit.icon}
                    </div>

                    {/* Name */}
                    <span className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                      {habit.name}
                    </span>

                    {/* Streak */}
                    {habit.streak > 0 && (
                      <Badge variant="accent" size="sm">
                        🔥 连续 {habit.streak} 天
                      </Badge>
                    )}

                    {/* Progress Ring */}
                    <div className="relative my-3">
                      <ProgressRing
                        value={todayMins}
                        max={habit.targetMinutes || 1}
                        color={habit.color}
                        size={72}
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
                      <Button
                        size="sm"
                        variant={pct >= 100 ? 'secondary' : 'primary'}
                        onClick={(e) => {
                          e.stopPropagation()
                          openCheckinModal(habit)
                        }}
                      >
                        {pct >= 100 ? '已完成' : '打卡'}
                      </Button>
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
                </Card>
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
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${checkinTarget.color}20` }}
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

            {/* Quick buttons */}
            <div className="flex flex-wrap gap-2">
              {[15, 30, 45, 60].map((m) => (
                <Button
                  key={m}
                  variant={checkinMinutes === String(m) ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setCheckinMinutes(String(m))}
                >
                  {m}分钟
                </Button>
              ))}
            </div>

            {/* Today's progress bar */}
            <div>
              <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1.5">
                <span>今日进度</span>
                <span>
                  {(checkinTarget.checkins[today] || 0) + (parseInt(checkinMinutes) || 0)} / {checkinTarget.targetMinutes} 分钟
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden bg-[var(--color-border-subtle)]/25">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      checkinTarget.targetMinutes > 0
                        ? (((checkinTarget.checkins[today] || 0) + (parseInt(checkinMinutes) || 0)) / checkinTarget.targetMinutes) * 100
                        : 0
                    )}%`,
                    backgroundColor: checkinTarget.color,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
