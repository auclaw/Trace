// Focus Settings Section

import { useTranslation } from 'react-i18next'
import { Section, NumberField } from './components'
import type { FocusSettings } from '../../store/useAppStore'

interface FocusSettingsSectionProps {
  index: number
  focusSettings: FocusSettings
  updateFocusSettings: (updates: Partial<FocusSettings>) => void
}

export default function FocusSettingsSection({
  index,
  focusSettings,
  updateFocusSettings,
}: FocusSettingsSectionProps) {
  const { t } = useTranslation()

  return (
    <Section title={t('settings.sections.focus')} index={index}>
      <div className="space-y-4">
        <NumberField
          label={t('focus.workMinutes')}
          value={focusSettings.workMinutes}
          onChange={(v) => updateFocusSettings({ workMinutes: v })}
          min={5}
          max={120}
          suffix={t('common.minutes')}
        />
        <NumberField
          label={t('focus.breakMinutes')}
          value={focusSettings.breakMinutes}
          onChange={(v) => updateFocusSettings({ breakMinutes: v })}
          min={1}
          max={30}
          suffix={t('common.minutes')}
        />
        <NumberField
          label={t('focus.longBreakMinutes')}
          value={focusSettings.longBreakMinutes}
          onChange={(v) => updateFocusSettings({ longBreakMinutes: v })}
          min={5}
          max={60}
          suffix={t('common.minutes')}
        />
        <NumberField
          label={t('focus.longBreakInterval')}
          value={focusSettings.longBreakInterval}
          onChange={(v) => updateFocusSettings({ longBreakInterval: v })}
          min={2}
          max={10}
          suffix={t('settings.sessions')}
        />
      </div>
    </Section>
  )
}
