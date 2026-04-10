// Circular progress ring with glow effect
// Splitted from Dashboard.tsx

interface ProgressRingProps {
  value: number
  size?: number
  stroke?: number
  color: string
  onClick?: () => void
  children?: React.ReactNode
}

export default function ProgressRing({
  value,
  size = 88,
  stroke = 7,
  color,
  onClick,
  children,
}: ProgressRingProps) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  const offset = c - (clamped / 100) * c

  return (
    <div
      className={`relative inline-flex items-center justify-center ${onClick ? 'cursor-pointer' : ''}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
    >
      {/* Glow behind progress */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-30"
        style={{ background: color }}
      />
      <svg width={size} height={size} className="-rotate-90 relative z-10">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth={stroke}
          opacity={0.15}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 2px 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        {children}
      </div>
    </div>
  )
}
