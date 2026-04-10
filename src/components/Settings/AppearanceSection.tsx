// Appearance Settings Section - theme, color, background skin

import { useTranslation } from 'react-i18next'
import {
  colorThemeConfigs,
  backgroundSkinConfigs,
} from '../../config/themes'
import type { ColorTheme, BackgroundSkin } from '../../config/themes'
import { Section, Toggle } from './components'

interface AppearanceSectionProps {
  index: number
  isDark: boolean
  colorTheme: ColorTheme
  backgroundSkin: BackgroundSkin
  setTheme: (theme: 'light' | 'dark') => void
  setColorTheme: (theme: ColorTheme) => void
  setBackgroundSkin: (skin: BackgroundSkin) => void
}

export default function AppearanceSection({
  index,
  isDark,
  colorTheme,
  backgroundSkin,
  setTheme,
  setColorTheme,
  setBackgroundSkin,
}: AppearanceSectionProps) {
  const { t } = useTranslation()

  return (
    <Section title={t('settings.sections.appearance')} index={index}>
      {/* Theme toggle */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-bg-surface-2)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{isDark ? '🌙' : '☀️'}</span>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {isDark ? t('settings.darkMode') : t('settings.lightMode')}
            </p>
            <p
              className="text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {t('settings.themeToggleHint')}
            </p>
          </div>
        </div>
        <Toggle
          checked={isDark}
          onChange={(v) => setTheme(v ? 'dark' : 'light')}
        />
      </div>

      {/* Color theme grid */}
      <div>
        <p
          className="text-xs mb-3 font-medium"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('settings.colorTheme')}
        </p>
        <div className="grid grid-cols-5 gap-4">
          {(Object.entries(colorThemeConfigs) as [ColorTheme, (typeof colorThemeConfigs)[ColorTheme]][]).map(
            ([key, cfg]) => {
              const selected = colorTheme === key
              return (
                <button
                  key={key}
                  onClick={() => setColorTheme(key)}
                  title={cfg.name}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: cfg.accent,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    transform: selected ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: selected
                      ? '0 0 0 3px var(--color-bg-surface-1), 0 0 0 5px var(--color-accent), 0 4px 12px rgba(44,24,16,0.15)'
                      : '0 2px 6px rgba(44,24,16,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = selected ? 'scale(1.15)' : 'scale(1)'
                  }}
                >
                  {selected && (
                    <svg
                      className="settings-check-pop"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              )
            },
          )}
        </div>
        <p
          className="text-xs mt-3"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('settings.current')}: {colorThemeConfigs[colorTheme].name} — {colorThemeConfigs[colorTheme].description}
        </p>
      </div>

      {/* Background skin */}
      <div>
        <p
          className="text-xs mb-3 font-medium"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('settings.backgroundSkin')}
        </p>
        <div className="space-y-2">
          {(Object.entries(backgroundSkinConfigs) as [BackgroundSkin, (typeof backgroundSkinConfigs)[BackgroundSkin]][]).map(
            ([key, cfg]) => {
              const selected = backgroundSkin === key
              return (
                <button
                  key={key}
                  onClick={() => setBackgroundSkin(key)}
                  className="w-full flex items-center gap-4 text-left cursor-pointer"
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-lg)',
                    border: selected
                      ? '2px solid var(--color-accent)'
                      : '1.5px solid var(--color-border-subtle)',
                    backgroundColor: selected
                      ? 'var(--color-accent-soft)'
                      : 'transparent',
                    transition: 'all 0.25s ease',
                    boxShadow: selected
                      ? '0 0 0 3px var(--color-accent-soft), 0 2px 8px rgba(44,24,16,0.06)'
                      : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor = 'var(--color-accent)'
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-surface-2)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {/* Preview swatch */}
                  <div
                    className={cfg.getBgClass(isDark)}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 'var(--radius-md)',
                      flexShrink: 0,
                      border: selected
                        ? '2px solid var(--color-accent)'
                        : '1.5px solid var(--color-border-subtle)',
                      boxShadow: '0 2px 6px rgba(44,24,16,0.06)',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {cfg.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {cfg.description}
                    </p>
                  </div>
                  {selected && (
                    <span className="ml-auto shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-accent-soft text-accent">
                        {t('common.current')}
                      </span>
                    </span>
                  )}
                </button>
              )
            },
          )}
        </div>
      </div>
    </Section>
  )
}
