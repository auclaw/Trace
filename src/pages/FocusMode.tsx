import { useState, useEffect, useMemo } from 'react'
import { Card, Button, EmptyState } from '../components/ui'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import dataService from '../services/dataService'
import type { FocusSession } from '../services/dataService'

// --- helpers ---

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

// --- constants ---

const STATE_LABELS: Record<string, string> = {
  idle: '准备就绪',
  working: '专注中',
  break: '休息中',
  longBreak: '长休息',
}

const RING_RADIUS = 120
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

// --- component ---

export default function FocusMode() {
  const { accentColor } = useTheme()

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

  const [showSettings, setShowSettings] = useState(false)
  const [todaySessions, setTodaySessions] = useState<FocusSession[]>([])

  // --- tick interval ---
  useEffect(() => {
    if (focusState === 'idle') return
    const id = setInterval(() => tickFocus(), 1000)
    return () => clearInterval(id)
  }, [focusState, tickFocus])

  // --- load today sessions ---
  useEffect(() => {
    setTodaySessions(
      dataService.getFocusSessions(todayStr()).filter((s) => s.type === 'work' && s.completed)
    )
  }, [focusSessions])

  // --- progress fraction (0..1) ---
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

  // --- ring color per state ---
  const ringColor =
    focusState === 'working'
      ? accentColor
      : isBreak
        ? 'var(--color-success, #22c55e)'
        : 'var(--color-text-muted)'

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-10 select-none">
      {/* ── Timer Display ── */}
      <div className="relative flex items-center justify-center mb-8">
        {/* SVG ring */}
        <svg
          width="280"
          height="280"
          viewBox="0 0 280 280"
          className={focusState === 'working' ? 'animate-breathe' : ''}
        >
          {/* track */}
          <circle
            cx="140"
            cy="140"
            r={RING_RADIUS}
            fill="none"
            stroke="var(--color-border-subtle)"
            strokeWidth="8"
            opacity="0.25"
          />
          {/* progress arc */}
          <circle
            cx="140"
            cy="140"
            r={RING_RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 140 140)"
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        {/* center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-6xl font-light tracking-widest tabular-nums text-[var(--color-text-primary)]"
          >
            {formatMM_SS(focusTimeLeft)}
          </span>
          <span className="mt-2 text-sm font-medium text-[var(--color-text-secondary)]">
            {STATE_LABELS[focusState]}
          </span>
          <span className="mt-1 text-xs text-[var(--color-text-muted)]">
            第 {focusSessions} 轮
          </span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-3 mb-8">
        {!isActive && (
          <Button size="lg" onClick={startFocus}>
            开始专注
          </Button>
        )}
        {isActive && !isBreak && (
          <Button size="lg" variant="secondary" onClick={pauseFocus}>
            暂停
          </Button>
        )}
        {isBreak && (
          <Button size="lg" variant="ghost" onClick={skipBreak}>
            跳过休息
          </Button>
        )}
        <Button size="lg" variant="secondary" onClick={resetFocus}>
          重置
        </Button>
      </div>

      {/* ── Settings toggle ── */}
      <button
        onClick={() => setShowSettings((v) => !v)}
        className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-6 cursor-pointer"
      >
        {showSettings ? '收起设置' : '调整设置'}
      </button>

      {/* ── Settings Panel ── */}
      {showSettings && (
        <Card className="w-full max-w-md mb-8">
          <div className="space-y-5">
            <SliderSetting
              label="工作时长"
              value={focusSettings.workMinutes}
              min={15}
              max={60}
              step={5}
              unit="分钟"
              onChange={(v) => updateFocusSettings({ workMinutes: v })}
            />
            <SliderSetting
              label="休息时长"
              value={focusSettings.breakMinutes}
              min={3}
              max={15}
              step={1}
              unit="分钟"
              onChange={(v) => updateFocusSettings({ breakMinutes: v })}
            />
            <SliderSetting
              label="长休息时长"
              value={focusSettings.longBreakMinutes}
              min={10}
              max={30}
              step={5}
              unit="分钟"
              onChange={(v) => updateFocusSettings({ longBreakMinutes: v })}
            />
            <SliderSetting
              label="长休息间隔"
              value={focusSettings.longBreakInterval}
              min={2}
              max={8}
              step={1}
              unit="轮"
              onChange={(v) => updateFocusSettings({ longBreakInterval: v })}
            />
          </div>
        </Card>
      )}

      {/* ── Today's completed sessions ── */}
      {todaySessions.length > 0 ? (
        <Card className="w-full max-w-md" padding="sm">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            今日专注记录
          </h3>
          <ul className="space-y-1.5 max-h-40 overflow-y-auto">
            {todaySessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]"
              >
                <span>
                  {formatTime(s.startTime)} - {formatTime(s.endTime)}
                </span>
                <span className="font-medium">{s.duration} 分钟</span>
              </li>
            ))}
          </ul>
        </Card>
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

      {/* breathing keyframes */}
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .animate-breathe {
          animation: breathe 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// --- Slider sub-component ---

function SliderSetting({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">{label}</span>
        <span className="text-sm tabular-nums text-[var(--color-text-secondary)]">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-accent)] cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-0.5">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}
