import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { AppState } from '../store/useAppStore'
import { colorThemeConfigs } from '../config/themes'
import type { ColorTheme } from '../config/themes'

const THEME_KEYS = Object.keys(colorThemeConfigs) as ColorTheme[]

export default function ThemeSelector() {
  const currentColorTheme = useAppStore((s: AppState) => s.colorTheme)
  const setColorTheme = useAppStore((s: AppState) => s.setColorTheme)
  const completeFirstLaunch = useAppStore((s: AppState) => s.completeFirstLaunch)
  const [selected, setSelected] = useState<ColorTheme>(currentColorTheme)

  const handleSelect = (theme: ColorTheme) => {
    setSelected(theme)
    setColorTheme(theme)
  }

  const handleConfirm = () => {
    setColorTheme(selected)
    completeFirstLaunch()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(44, 24, 16, 0.5)', backdropFilter: 'blur(12px)' }}>
      <div
        className="relative w-full max-w-xl mx-4 overflow-hidden animate-scale-in"
        style={{
          background: 'var(--color-bg-surface-1)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        {/* Decorative top gradient bar */}
        <div className="h-1.5" style={{
          background: `linear-gradient(90deg, ${THEME_KEYS.map(k => colorThemeConfigs[k].accent).join(', ')})`,
        }} />

        {/* Header */}
        <div className="px-8 pt-8 pb-2 text-center">
          <div className="text-3xl mb-3">🎨</div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            选择你的主题色
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            挑选一个最适合你的颜色，随时可在设置中更改
          </p>
        </div>

        {/* Theme grid */}
        <div className="px-6 py-5 grid grid-cols-5 gap-3">
          {THEME_KEYS.map((key) => {
            const config = colorThemeConfigs[key]
            const isSel = selected === key

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelect(key)}
                className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-[var(--radius-lg)] transition-all duration-200 cursor-pointer"
                style={{
                  background: isSel ? config.accentSoft : 'transparent',
                  border: isSel ? `2px solid ${config.accent}` : '2px solid transparent',
                  transform: isSel ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                {/* Color circle with gradient */}
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-full transition-shadow duration-200"
                    style={{
                      background: `linear-gradient(135deg, ${config.accent}, color-mix(in srgb, ${config.accent} 70%, #fff))`,
                      boxShadow: isSel ? `0 4px 14px ${config.accent}44` : 'var(--shadow-sm)',
                    }}
                  />
                  {isSel && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 10l4 4 6-7" />
                      </svg>
                    </span>
                  )}
                </div>

                {/* Name */}
                <span className="text-xs font-medium text-center leading-tight"
                  style={{ color: isSel ? config.accent : 'var(--color-text-secondary)' }}>
                  {config.name}
                </span>
              </button>
            )
          })}
        </div>

        {/* Confirm */}
        <div className="px-8 pb-8 pt-2 flex justify-center">
          <button
            type="button"
            onClick={handleConfirm}
            className="px-10 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${colorThemeConfigs[selected].accent}, color-mix(in srgb, ${colorThemeConfigs[selected].accent} 75%, #fff))`,
              boxShadow: `0 4px 16px ${colorThemeConfigs[selected].accent}40`,
            }}
          >
            开始使用 时迹
          </button>
        </div>
      </div>
    </div>
  )
}
