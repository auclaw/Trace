// Appearance Settings Section - theme, color, background skin

import { useTranslation } from 'react-i18next'
import {
  backgroundSkinConfigs,
} from '../../config/themes'
import type { BackgroundSkin } from '../../config/themes'
import { Section, Toggle } from './components'

interface AppearanceSectionProps {
  index: number
  isDark: boolean
  backgroundSkin: BackgroundSkin
  setTheme: (theme: 'light' | 'dark') => void
  setBackgroundSkin: (skin: BackgroundSkin) => void
}

export default function AppearanceSection({
  index,
  isDark,
  backgroundSkin,
  setTheme,
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

      {/* Macaron system info */}
      <div
        className="p-4 rounded-xl mb-4"
        style={{
          background: 'var(--color-bg-surface-2)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          🧁 马卡龙设计系统
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          柔和奶油色边框 + 蓝色调光晕，为长时间专注打造舒适视觉体验。
          内置六种马卡龙配色用于不同功能场景（任务分类、状态标签等）。
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
