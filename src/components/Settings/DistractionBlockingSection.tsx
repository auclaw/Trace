// Distraction Blocking Settings Section

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Section } from './components'
import type { BlockedPattern } from '../../services/dataService'

interface DistractionBlockingSectionProps {
  index: number
  blockedPatterns: BlockedPattern[]
  setBlockedPatterns: (patterns: BlockedPattern[]) => void
  blockingScheduleMode: 'focusOnly' | 'always' | 'custom'
  setBlockingScheduleMode: (mode: 'focusOnly' | 'always' | 'custom') => void
  saveBlockedPatterns: (patterns: BlockedPattern[]) => Promise<void>
  saveBlockingScheduleMode: (mode: 'focusOnly' | 'always' | 'custom') => Promise<void>
  newPatternInput: string
  setNewPatternInput: (value: string) => void
  addNewPattern: () => void
}

export default function DistractionBlockingSection({
  index,
  blockedPatterns,
  setBlockedPatterns,
  blockingScheduleMode,
  setBlockingScheduleMode,
  saveBlockedPatterns,
  saveBlockingScheduleMode,
  newPatternInput,
  setNewPatternInput,
  addNewPattern,
}: DistractionBlockingSectionProps) {
  const { t } = useTranslation()

  const handleDelete = useCallback((id: string) => {
    const newPatterns = blockedPatterns.filter(p => p.id !== id)
    setBlockedPatterns(newPatterns)
    saveBlockedPatterns(newPatterns)
  }, [blockedPatterns, setBlockedPatterns, saveBlockedPatterns])

  const enabledCount = blockedPatterns.filter(p => p.enabled).length

  return (
    <Section title={t('focus.blockedSites')} index={index}>
      <p
        className="text-xs"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {t('focus.shieldDescription')}
      </p>
      <p
        className="text-xs"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {t('focus.desktopNote')}
      </p>

      <div className="mt-4 space-y-3">
        {/* Blocked list */}
        {blockedPatterns.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] py-3">
            {t('focus.noBlockRules')}
          </p>
        ) : (
          <div className="space-y-2">
            {blockedPatterns.map((pattern) => (
              <div
                key={pattern.id}
                className="flex items-center justify-between p-3 border rounded-lg"
                style={{
                  borderColor: 'var(--color-border-subtle)',
                  background: pattern.enabled ? 'var(--color-bg-surface-2)' : 'transparent',
                  opacity: pattern.enabled ? 1 : 0.5,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {pattern.pattern}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(pattern.id)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors dark:bg-red-900/30 dark:text-red-400"
                >
                  {t('common.delete')}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new pattern */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              {t('focus.domain')}
            </label>
            <input
              type="text"
              value={newPatternInput}
              onChange={(e) => setNewPatternInput(e.target.value)}
              placeholder={t('focus.domainPlaceholder')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{
                background: 'var(--color-bg-surface-2)',
                borderColor: 'var(--color-border-subtle)',
                color: 'var(--color-text-primary)',
              }}
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {t('focus.domainHint')}
            </p>
          </div>
          <button
            onClick={addNewPattern}
            disabled={!newPatternInput.trim()}
            className="px-4 py-2 bg-[var(--color-accent)] text-[#fffefb] rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {t('focus.addSite')}
          </button>
        </div>

        {/* Schedule mode */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            {t('focus.scheduleMode')}
          </label>
          <div className="space-y-2">
            {([
              { value: 'focusOnly', label: t('focus.focusOnly'), desc: t('focus.focusOnlyDesc') },
              { value: 'always', label: t('focus.always'), desc: t('focus.alwaysDesc') },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setBlockingScheduleMode(opt.value)
                  saveBlockingScheduleMode(opt.value)
                }}
                className="w-full text-left cursor-pointer p-3 border rounded-lg transition-all"
                style={{
                  border: blockingScheduleMode === opt.value
                    ? '2px solid var(--color-accent)'
                    : '1.5px solid var(--color-border-subtle)',
                  backgroundColor: blockingScheduleMode === opt.value
                    ? 'var(--color-accent-soft)'
                    : 'transparent',
                }}
              >
                <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {opt.label}
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-3 mb-1">
            {t('focus.blockingCount', { count: enabledCount })}
          </p>
        </div>
      </div>
    </Section>
  )
}
