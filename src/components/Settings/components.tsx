// Shared UI components for Settings page

/* ── Fade-in animation keyframes (injected once) ── */
const STYLE_ID = 'settings-animations'
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes settingsFadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .settings-section-fade {
      animation: settingsFadeInUp 0.45s ease-out both;
    }
    @keyframes settingsCheckPop {
      0%   { transform: scale(0); }
      60%  { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    .settings-check-pop {
      animation: settingsCheckPop 0.25s ease-out both;
    }
  `
  document.head.appendChild(style)
}

/* ── Section wrapper — warm gradient card ── */
export function Section({
  title,
  children,
  index = 0,
}: {
  title: string
  children: React.ReactNode
  index?: number
}) {
  return (
    <div
      className="settings-section-fade"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="!p-0 overflow-hidden" style={{
        background:
          'linear-gradient(135deg, var(--color-bg-surface-1) 0%, var(--color-bg-surface-2) 100%)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card), 0 2px 8px rgba(44,24,16,0.04)',
        padding: 0,
      }}>
        {/* Section title with accent left border */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 4,
                height: 22,
                borderRadius: 4,
                backgroundColor: 'var(--color-accent)',
                flexShrink: 0,
              }}
            />
            <h3
              className="text-base font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {title}
            </h3>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ── Toggle switch — pill-shaped with smooth transitions ── */
export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: 48,
        height: 26,
        borderRadius: 9999,
        cursor: 'pointer',
        border: 'none',
        padding: 0,
        backgroundColor: checked
          ? 'var(--color-accent)'
          : 'var(--color-border-subtle)',
        transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
        boxShadow: checked
          ? '0 0 0 2px rgba(44,24,16,0.04), inset 0 1px 2px rgba(44,24,16,0.08)'
          : 'inset 0 1px 3px rgba(44,24,16,0.1)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 24 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: '#fff',
          boxShadow: '0 1px 4px rgba(44,24,16,0.15)',
          transition: 'left 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      />
    </button>
  )
}

/* ── Number input helper — clean with accent focus ring ── */
export function NumberField({
  label,
  value,
  onChange,
  min = 1,
  max = 120,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  suffix?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className="text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10)
            if (!isNaN(n) && n >= min && n <= max) onChange(n)
          }}
          style={{
            width: 72,
            padding: '6px 10px',
            fontSize: 14,
            textAlign: 'center' as const,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-bg-surface-2)',
            color: 'var(--color-text-primary)',
            border: '1.5px solid var(--color-border-subtle)',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-accent)'
            e.currentTarget.style.boxShadow =
              '0 0 0 3px var(--color-accent-soft)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        {suffix && (
          <span
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}
