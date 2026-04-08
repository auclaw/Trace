import { useState, useEffect, useMemo } from 'react'
import { Button, EmptyState } from '../components/ui'
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

const RING_RADIUS = 90
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const SVG_SIZE = 220

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

  // --- session dots ---
  const completedSessions = todaySessions.length
  const totalDots = Math.max(focusSettings.longBreakInterval, completedSessions + (isActive && !isBreak ? 1 : 0))

  // --- background state class ---
  const bgClass =
    focusState === 'working'
      ? 'focus-bg-warm'
      : isBreak
        ? 'focus-bg-cool'
        : 'focus-bg-idle'

  const center = SVG_SIZE / 2

  return (
    <div className={`focus-page ${bgClass} flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 select-none`}>
      {/* ── Timer Display ── */}
      <div className="relative flex items-center justify-center mb-10 flex-1 min-h-0 max-h-[360px]">
        {/* Gradient glow behind ring */}
        <div
          className={`absolute rounded-full ${focusState === 'working' ? 'focus-glow-breathe' : ''}`}
          style={{
            width: SVG_SIZE + 60,
            height: SVG_SIZE + 60,
            background: `radial-gradient(circle, ${ringColor} 0%, transparent 70%)`,
            opacity: 0.15,
            filter: 'blur(30px)',
            transition: 'background 0.8s ease, opacity 0.8s ease',
          }}
        />

        {/* SVG ring */}
        <svg
          width={SVG_SIZE}
          height={SVG_SIZE}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="relative z-10"
        >
          {/* track */}
          <circle
            cx={center}
            cy={center}
            r={RING_RADIUS}
            fill="none"
            stroke="var(--color-border-subtle)"
            strokeWidth="6"
            opacity="0.2"
          />
          {/* progress arc */}
          <circle
            cx={center}
            cy={center}
            r={RING_RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        {/* center text */}
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
                  width: 6,
                  height: 6,
                  backgroundColor:
                    i < completedSessions
                      ? accentColor
                      : 'var(--color-border-subtle)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-3 mb-8">
        {!isActive && (
          <Button
            size="lg"
            onClick={startFocus}
            className="!h-14 !px-10 !text-base !rounded-full focus-btn-start"
          >
            开始专注
          </Button>
        )}
        {isActive && !isBreak && (
          <Button
            size="md"
            variant="secondary"
            onClick={pauseFocus}
            className="active:!scale-95"
          >
            暂停
          </Button>
        )}
        {isBreak && (
          <Button
            size="md"
            variant="ghost"
            onClick={skipBreak}
            className="active:!scale-95"
          >
            跳过休息
          </Button>
        )}
        {isActive && (
          <Button
            size="md"
            variant="secondary"
            onClick={resetFocus}
            className="active:!scale-95"
          >
            重置
          </Button>
        )}
      </div>

      {/* ── Settings toggle ── */}
      <button
        onClick={() => setShowSettings((v) => !v)}
        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-6 cursor-pointer"
        style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
      >
        {showSettings ? '收起设置' : '调整设置'}
      </button>

      {/* ── Settings Panel (floating card, 2x2 grid) ── */}
      {showSettings && (
        <div
          className="w-full max-w-md mb-6 rounded-2xl p-5"
          style={{
            background: 'var(--color-bg-surface-1)',
            border: '1px solid var(--color-border-subtle)',
            boxShadow: 'var(--shadow-lg, 0 8px 30px rgba(0,0,0,0.12))',
          }}
        >
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
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
        </div>
      )}

      {/* ── Today's completed sessions (horizontal scroll) ── */}
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
                  background: s.type === 'work'
                    ? `color-mix(in srgb, ${accentColor} 12%, transparent)`
                    : 'color-mix(in srgb, var(--color-success, #22c55e) 12%, transparent)',
                  border: `1px solid ${s.type === 'work'
                    ? `color-mix(in srgb, ${accentColor} 25%, transparent)`
                    : 'color-mix(in srgb, var(--color-success, #22c55e) 25%, transparent)'}`,
                }}
              >
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {formatTime(s.startTime)}
                </span>
                <span className="text-xs font-semibold text-[var(--color-text-primary)] mt-0.5">
                  {s.duration}分钟
                </span>
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

      {/* ── Inline styles ── */}
      <style>{`
        /* Background state transitions */
        .focus-page {
          transition: background-color 1.2s ease;
        }
        .focus-bg-idle {
          background-color: var(--color-bg-primary);
        }
        .focus-bg-warm {
          background-color: color-mix(in srgb, var(--color-bg-primary) 94%, #f59e0b);
        }
        .focus-bg-cool {
          background-color: color-mix(in srgb, var(--color-bg-primary) 94%, #22c55e);
        }

        /* Breathing glow animation */
        @keyframes glowBreathe {
          0%, 100% { transform: scale(1); opacity: 0.12; }
          50% { transform: scale(1.12); opacity: 0.22; }
        }
        .focus-glow-breathe {
          animation: glowBreathe 4s ease-in-out infinite;
        }

        /* Start button gradient & shadow */
        .focus-btn-start {
          background: linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 80%, #000)) !important;
          box-shadow: 0 4px 20px color-mix(in srgb, var(--color-accent) 35%, transparent) !important;
        }
        .focus-btn-start:hover {
          box-shadow: 0 6px 28px color-mix(in srgb, var(--color-accent) 45%, transparent) !important;
        }
        .focus-btn-start:active {
          transform: scale(0.95) !important;
        }

        /* Hide scrollbar for session history */
        .focus-hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .focus-hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Range input styling */
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 2px;
          background: var(--color-border-subtle);
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--color-accent);
          cursor: pointer;
          border: 2px solid var(--color-bg-surface-1);
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--color-accent);
          cursor: pointer;
          border: 2px solid var(--color-bg-surface-1);
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
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
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-[var(--color-text-primary)]">{label}</span>
        <span className="text-xs tabular-nums text-[var(--color-text-secondary)]">
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
        className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5"
      />
    </div>
  )
}
