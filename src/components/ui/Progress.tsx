interface ProgressProps {
  value: number;
  color?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const trackHeight: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
};

export default function Progress({
  value,
  color = 'var(--color-accent)',
  size = 'md',
  showLabel = false,
  animated = true,
  className = '',
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={[
          'flex-1 rounded-full overflow-hidden',
          'bg-[var(--color-border-subtle)]/25',
          trackHeight[size],
        ].join(' ')}
      >
        <div
          className={[
            'h-full rounded-full',
            animated ? 'transition-[width] duration-500 ease-out' : '',
          ].join(' ')}
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium tabular-nums text-[var(--color-text-muted)] min-w-[2.5rem] text-right">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
