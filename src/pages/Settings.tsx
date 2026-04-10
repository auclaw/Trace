import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { changeLanguage, getCurrentLanguage } from '../i18n'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import dataService from '../services/dataService'
import { trackingService } from '../services/trackingService'
import type { Settings as AiSettings } from '../utils/tracking'
import type { PrivacyLevel, TrackingRule } from '../services/trackingService'
import type { ActivityCategory } from '../services/dataService'
import { Card, Button, Badge } from '../components/ui'
import {
  colorThemeConfigs,
  backgroundSkinConfigs,
  DEFAULT_MODULES,
} from '../config/themes'
import type { ColorTheme, BackgroundSkin } from '../config/themes'

/* ── Module display names ── */
const MODULE_LABELS: Record<string, string> = {
  dashboard: 'nav.dashboard',
  timeline: 'nav.timeline',
  planner: 'nav.planner',
  focus: 'nav.focus',
  habits: 'nav.habits',
  statistics: 'nav.statistics',
  pet: 'nav.pet',
  settings: 'nav.settings',
}

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
function Section({
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
      <Card padding="md" className="!p-0 overflow-hidden">
        <div
          className="p-6 space-y-5"
          style={{
            background:
              'linear-gradient(135deg, var(--color-bg-surface-1) 0%, var(--color-bg-surface-2) 100%)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-card), 0 2px 8px rgba(44,24,16,0.04)',
          }}
        >
          {/* Section title with accent left border */}
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
      </Card>
    </div>
  )
}

/* ── Toggle switch — pill-shaped with smooth transitions ── */
function Toggle({
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
function NumberField({
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

/* ══════════════════════════════════════════════════
   Settings Page
   ══════════════════════════════════════════════════ */

export default function Settings() {
  const { t } = useTranslation()
  const { isDark, colorTheme, backgroundSkin } = useTheme()

  const setTheme = useAppStore((s) => s.setTheme)
  const setColorTheme = useAppStore((s) => s.setColorTheme)
  const setBackgroundSkin = useAppStore((s) => s.setBackgroundSkin)
  const activeModules = useAppStore((s) => s.activeModules)
  const setActiveModules = useAppStore((s) => s.setActiveModules)
  const focusSettings = useAppStore((s) => s.focusSettings)
  const updateFocusSettings = useAppStore((s) => s.updateFocusSettings)
  const dailyGoalMinutes = useAppStore((s) => s.dailyGoalMinutes)
  const setDailyGoalMinutes = useAppStore((s) => s.setDailyGoalMinutes)
  const addToast = useAppStore((s) => s.addToast)

  const [exporting, setExporting] = useState(false)
  const [aiSettings, setAiSettings] = useState<AiSettings>({
    aiApiKey: '',
    aiProvider: 'ernie',
    autoStartOnBoot: true,
    ignoredApplications: [],
  })
  const [savingAiSettings, setSavingAiSettings] = useState(false)

  // Load AI settings on mount
  useEffect(() => {
    const loadAiSettings = async () => {
      try {
        const settings = await dataService.getSettings()
        setAiSettings({
          aiApiKey: settings.aiApiKey || '',
          aiProvider: settings.aiProvider || 'ernie',
          autoStartOnBoot: settings.autoStartOnBoot || true,
          ignoredApplications: settings.ignoredApplications || [],
          featureFlags: settings.featureFlags || {},
          privacy_sync_mode: settings.privacy_sync_mode || 'local_only',
          privacy_cloud_encryption: settings.privacy_cloud_encryption || false,
          privacy_retain_raw_local: settings.privacy_retain_raw_local || true,
          privacy_auto_delete_days: settings.privacy_auto_delete_days || 30,
        })
      } catch (e) {
        if (import.meta.env.DEV) console.error('Failed to load settings:', e)
      }
    }
    loadAiSettings()
  }, [])

  const handleSaveAiSettings = async () => {
    setSavingAiSettings(true)
    try {
      await dataService.updateSettings(aiSettings)
      addToast('success', t('settings.aiSettingsSaved'))
    } catch (e) {
      if (import.meta.env.DEV) console.error('Failed to save AI settings:', e)
      addToast('error', t('settings.aiSettingsSaveFailed'))
    } finally {
      setSavingAiSettings(false)
    }
  }

  /* ── Privacy level ── */
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(
    trackingService.getPrivacyLevel(),
  )
  const handlePrivacyChange = useCallback(
    (level: PrivacyLevel) => {
      setPrivacyLevel(level)
      trackingService.setPrivacyLevel(level)
      addToast('success', '隐私级别已更新')
    },
    [addToast],
  )

  /* ── Tracking rules ── */
  const RULE_CATEGORIES: ActivityCategory[] = [
    '开发', '工作', '学习', '会议', '休息', '娱乐', '运动', '阅读', '其他',
  ]
  const [trackingRules, setTrackingRules] = useState<TrackingRule[]>(
    trackingService.getTrackingRules(),
  )
  const [newRuleKeyword, setNewRuleKeyword] = useState('')
  const [newRuleCategory, setNewRuleCategory] = useState<ActivityCategory>('其他')
  const [showRuleForm, setShowRuleForm] = useState(false)

  const handleAddRule = useCallback(() => {
    if (!newRuleKeyword.trim()) return
    trackingService.addRule({
      appName: newRuleKeyword.trim(),
      targetCategory: newRuleCategory,
      priority: 5,
    })
    setTrackingRules(trackingService.getTrackingRules())
    setNewRuleKeyword('')
    setNewRuleCategory('其他')
    setShowRuleForm(false)
    addToast('success', '追踪规则已添加')
  }, [newRuleKeyword, newRuleCategory, addToast])

  const handleDeleteRule = useCallback(
    (ruleId: string) => {
      trackingService.removeRule(ruleId)
      setTrackingRules(trackingService.getTrackingRules())
      addToast('success', '规则已删除')
    },
    [addToast],
  )

  /* ── Notification settings ── */
  interface NotificationSettings {
    habitReminder: boolean
    breakReminder: boolean
    focusEndReminder: boolean
    habitInterval: number
    breakInterval: number
  }
  const NOTIF_KEY = 'merize-notification-settings'
  const defaultNotif: NotificationSettings = {
    habitReminder: true,
    breakReminder: true,
    focusEndReminder: true,
    habitInterval: 30,
    breakInterval: 25,
  }
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() => {
    try {
      const raw = localStorage.getItem(NOTIF_KEY)
      return raw ? { ...defaultNotif, ...JSON.parse(raw) } : defaultNotif
    } catch {
      return defaultNotif
    }
  })
  const updateNotif = useCallback(
    (patch: Partial<NotificationSettings>) => {
      setNotifSettings((prev) => {
        const next = { ...prev, ...patch }
        localStorage.setItem(NOTIF_KEY, JSON.stringify(next))
        return next
      })
    },
    [],
  )

  /* ── Export helpers (daily/weekly report) ── */
  const exportDailyReport = useCallback(() => {
    setExporting(true)
    try {
      const activities = dataService.getActivities()
      const today = new Date().toISOString().slice(0, 10)
      const todayActivities = activities.filter((a) => a.startTime.slice(0, 10) === today)
      const categoryTotals: Record<string, number> = {}
      todayActivities.forEach((a) => {
        categoryTotals[a.category] = (categoryTotals[a.category] || 0) + a.duration
      })
      const lines = [
        `${t('settings.exportDailyTitle', { date: today })}`,
        '='.repeat(40),
        '',
        `${t('settings.totalActivities')}: ${todayActivities.length}`,
        `${t('settings.totalDuration')}: ${todayActivities.reduce((s, a) => s + a.duration, 0)} ${t('common.minutes')}`,
        '',
        `${t('settings.categorySummary')}:`,
        ...Object.entries(categoryTotals).map(
          ([cat, min]) => `  ${cat}: ${min} ${t('common.minutes')} (${(min / 60).toFixed(1)}h)`
        ),
        '',
        `${t('settings.activityDetail')}:`,
        ...todayActivities.map(
          (a) =>
            `  [${a.startTime.slice(11, 16)}-${a.endTime.slice(11, 16)}] ${a.category} | ${a.name} (${a.duration}${t('common.minutes')})`
        ),
        '',
        `--- ${t('settings.appVersion')} ---`
      ]
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `merize-daily-report-${today}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      addToast('success', '日报导出成功')
    } catch {
      addToast('error', '导出失败')
    } finally {
      setExporting(false)
    }
  }, [addToast])

  const exportWeeklyReport = useCallback(() => {
    setExporting(true)
    try {
      const activities = dataService.getActivities()
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 86400000)
      const weekActivities = activities.filter(
        (a) => new Date(a.startTime) >= weekAgo,
      )
      const categoryTotals: Record<string, number> = {}
      const dailyTotals: Record<string, number> = {}
      weekActivities.forEach((a) => {
        categoryTotals[a.category] = (categoryTotals[a.category] || 0) + a.duration
        const day = a.startTime.slice(0, 10)
        dailyTotals[day] = (dailyTotals[day] || 0) + a.duration
      })
      const lines = [
        `${t('settings.exportWeeklyTitle', { start: weekAgo.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) })}`,
        '='.repeat(50),
        '',
        `${t('settings.totalActivities')}: ${weekActivities.length}`,
        `${t('settings.totalDuration')}: ${weekActivities.reduce((s, a) => s + a.duration, 0)} ${t('common.minutes')}`,
        '',
        `${t('settings.dailyDuration')}:`,
        ...Object.entries(dailyTotals)
          .sort()
          .map(([day, min]) => `  ${day}: ${min} ${t('common.minutes')} (${(min / 60).toFixed(1)}h)`),
        '',
        `${t('settings.categorySummary')}:`,
        ...Object.entries(categoryTotals)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, min]) => `  ${cat}: ${min} ${t('common.minutes')} (${(min / 60).toFixed(1)}h)`),
        '',
        `--- ${t('settings.appVersion')} ---`
      ]
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `merize-weekly-report-${now.toISOString().slice(0, 10)}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      addToast('success', '周报导出成功')
    } catch {
      addToast('error', '导出失败')
    } finally {
      setExporting(false)
    }
  }, [addToast])

  /* ── Module toggle ── */
  const toggleModule = useCallback(
    (mod: string) => {
      const next = activeModules.includes(mod)
        ? activeModules.filter((m) => m !== mod)
        : [...activeModules, mod]
      setActiveModules(next)
    },
    [activeModules, setActiveModules],
  )

  /* ── Export JSON ── */
  const exportJSON = useCallback(() => {
    setExporting(true)
    try {
      const data: Record<string, unknown> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('merize-')) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key)!)
          } catch {
            data[key] = localStorage.getItem(key)
          }
        }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `merize-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      addToast('success', t('settings.exportJSON') + ' ' + t('common.success'))
    } catch {
      addToast('error', t('settings.exportJSON') + ' ' + t('common.error'))
    } finally {
      setExporting(false)
    }
  }, [addToast, t])

  /* ── Export CSV ── */
  const exportCSV = useCallback(() => {
    setExporting(true)
    try {
      const activities = dataService.getActivities()
      const headers = ['id', 'name', 'category', 'startTime', 'endTime', 'duration', 'isManual']
      const rows = activities.map((a) =>
        [
          a.id,
          `"${a.name.replace(/"/g, '""')}"`,
          a.category,
          a.startTime,
          a.endTime,
          String(a.duration),
          String(a.isManual),
        ].join(','),
      )
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `merize-activities-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      addToast('success', t('settings.exportCSV') + ' ' + t('common.success'))
    } catch {
      addToast('error', t('settings.exportCSV') + ' ' + t('common.error'))
    } finally {
      setExporting(false)
    }
  }, [addToast, t])

  /* ── Export PDF ── */
  const exportPDF = useCallback(() => {
    setExporting(true)
    try {
      import('jspdf').then(({ jsPDF }) => {
        const activities = dataService.getActivities()
        const today = new Date().toISOString().slice(0, 10)

        // Calculate statistics
        const totalMinutes = activities.reduce((sum, a) => sum + a.duration, 0)
        const categoryTotals: Record<string, number> = {}
        activities.forEach((a) => {
          if (a.category) {
            categoryTotals[a.category] = (categoryTotals[a.category] || 0) + a.duration
          }
        })

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 14

        // Title
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text(t('settings.exportPDFTitle'), margin, 20)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`${t('common.date')}: ${today}`, margin, 28)
        doc.text(`${t('statistics.totalHours')}: ${(totalMinutes / 60).toFixed(1)}h`, margin, 34)
        doc.text(`${t('dashboard.activityCount')}: ${activities.length}`, margin, 40)

        let yPos = 50

        // Category summary
        if (Object.keys(categoryTotals).length > 0) {
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text(t('statistics.categoryBreakdown'), margin, yPos)
          yPos += 8

          Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .forEach(([cat, mins]) => {
              if (yPos > pageHeight - 20) {
                doc.addPage()
                yPos = margin
              }
              doc.setFontSize(9)
              doc.setFont('helvetica', 'normal')
              const hours = (mins / 60).toFixed(1)
              doc.text(`${cat}: ${hours}h (${mins} ${t('common.minutes')})`, margin + 2, yPos)
              yPos += 6
            })

          yPos += 10
        }

        // Activity list
        if (activities.length > 0) {
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text(`${t('dashboard.activityCount')}:`, margin, yPos)
          yPos += 8

          activities
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .forEach((a) => {
              if (yPos > pageHeight - 10) {
                doc.addPage()
                yPos = margin
              }
              doc.setFontSize(8)
              const startTime = a.startTime.slice(11, 16)
              const endTime = a.endTime ? a.endTime.slice(11, 16) : ''
              const duration = `${a.duration.toFixed(0)}${t('common.min')}`
              const name = a.name.length > 40 ? a.name.slice(0, 37) + '...' : a.name
              const line = `${startTime}-${endTime} | ${a.category || t('common.unknown')} | ${name} (${duration})`
              doc.text(line, margin + 2, yPos)
              yPos += 5
            })
        }

        // Footer
        const footerText = `Merize - https://github.com/auclaw/merize`
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' })

        doc.save(`merize-report-${today}.pdf`)
        addToast('success', t('settings.exportPDF') + ' ' + t('common.success'))
        setExporting(false)
      })
    } catch {
      addToast('error', t('settings.exportPDF') + ' ' + t('common.error'))
      setExporting(false)
    }
  }, [addToast, t])

  /* ── Reset demo data ── */
  const handleReset = useCallback(() => {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('merize-')) keys.push(key)
    }
    keys.forEach((k) => localStorage.removeItem(k))
    // Re-seed by removing the seeded flag (ensureSeeded will re-run)
    dataService.getActivities() // triggers ensureSeeded
    addToast('success', '数据已重置，即将刷新页面')
    setTimeout(() => window.location.reload(), 800)
  }, [addToast])

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8">
      {/* ─── Page Header ─── */}
      <div className="settings-section-fade" style={{ animationDelay: '0ms' }}>
        <div className="flex items-center gap-4 mb-1">
          <div
            style={{
              width: 6,
              height: 36,
              borderRadius: 6,
              background: 'linear-gradient(180deg, var(--color-accent) 0%, var(--color-accent-soft) 100%)',
              flexShrink: 0,
            }}
          />
          <h2
            className="text-3xl font-extrabold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {t('settings.title')}
          </h2>
        </div>
        <p
          className="text-sm ml-[22px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('settings.description')}
        </p>
      </div>

      {/* ─── 1. Appearance ─── */}
      <Section title={t('settings.sections.appearance')} index={1}>
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
            当前: {colorThemeConfigs[colorTheme].name} — {colorThemeConfigs[colorTheme].description}
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
                      <Badge variant="accent" size="sm" className="ml-auto shrink-0">
                        {t('common.current')}
                      </Badge>
                    )}
                  </button>
                )
              },
            )}
          </div>
        </div>
      </Section>

      {/* ─── 2. Feature Modules ─── */}
      <Section title={t('settings.sections.modules')} index={2}>
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('settings.moduleVisibility')}
        </p>
        <div
          style={{
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-subtle)',
            overflow: 'hidden',
          }}
        >
          {DEFAULT_MODULES.map((mod, i) => (
            <div
              key={mod}
              className="flex items-center justify-between"
              style={{
                padding: '12px 16px',
                backgroundColor: i % 2 === 0 ? 'var(--color-bg-surface-2)' : 'transparent',
                borderBottom:
                  i < DEFAULT_MODULES.length - 1
                    ? '1px solid var(--color-border-subtle)'
                    : 'none',
                transition: 'background-color 0.15s ease',
              }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {t(MODULE_LABELS[mod] || mod)}
              </span>
              <Toggle
                checked={activeModules.includes(mod)}
                onChange={() => toggleModule(mod)}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* ─── 3. Focus Settings ─── */}
      <Section title={t('settings.sections.focus')} index={3}>
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

      {/* ─── 4. Daily Goal ─── */}
      <Section title={t('settings.dailyGoal')} index={4}>
        <NumberField
          label={t('settings.dailyGoalLabel')}
          value={dailyGoalMinutes}
          onChange={setDailyGoalMinutes}
          min={30}
          max={960}
          suffix={t('common.minutes')}
        />
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('settings.dailyGoalHint', { hours: (dailyGoalMinutes / 60).toFixed(1) })}
        </p>
      </Section>

      {/* ─── 5. Privacy Level ─── */}
      <Section title={t('settings.sections.privacyLevel')} index={5}>
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('settings.privacyLevelDescription')}
        </p>
        <div className="space-y-2">
          {([
            {
              level: 'basic' as PrivacyLevel,
              label: '基础',
              desc: '仅记录应用名称（如 "VS Code"）',
            },
            {
              level: 'standard' as PrivacyLevel,
              label: '标准',
              desc: '记录应用名称和窗口标题（如 "VS Code - App.tsx"）',
            },
            {
              level: 'detailed' as PrivacyLevel,
              label: '详细',
              desc: '记录应用名称、窗口标题、URL 及活动摘要',
            },
          ]).map((opt) => {
            const selected = privacyLevel === opt.level
            return (
              <button
                key={opt.level}
                onClick={() => handlePrivacyChange(opt.level)}
                className="w-full text-left cursor-pointer"
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: selected
                      ? '6px solid var(--color-accent)'
                      : '2px solid var(--color-border-subtle)',
                    backgroundColor: selected ? '#fff' : 'transparent',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {opt.label}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {opt.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </Section>

      {/* ─── 6. Tracking Rules ─── */}
      <Section title={t('settings.trackingRules')} index={6}>
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('settings.trackingRulesDescription')}
        </p>

        {/* Rules list */}
        <div
          style={{
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-subtle)',
            overflow: 'hidden',
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          {trackingRules.length === 0 ? (
            <div
              style={{
                padding: '20px 16px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: 13,
              }}
            >
              {t('common.noData')}
            </div>
          ) : (
            trackingRules.map((rule, i) => (
              <div
                key={rule.id}
                className="flex items-center justify-between"
                style={{
                  padding: '10px 16px',
                  backgroundColor:
                    i % 2 === 0 ? 'var(--color-bg-surface-2)' : 'transparent',
                  borderBottom:
                    i < trackingRules.length - 1
                      ? '1px solid var(--color-border-subtle)'
                      : 'none',
                }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {rule.appName}
                    {rule.titleKeyword ? ` / ${rule.titleKeyword}` : ''}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    →
                  </span>
                  <Badge variant="accent" size="sm">
                    {rule.targetCategory}
                  </Badge>
                </div>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  title={t('settings.deleteRule')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgb(200,60,60)',
                    fontSize: 16,
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'background-color 0.15s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(220,60,60,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add rule form */}
        {showRuleForm ? (
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--color-accent)',
              backgroundColor: 'var(--color-accent-soft)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <input
                type="text"
                value={newRuleKeyword}
                onChange={(e) => setNewRuleKeyword(e.target.value)}
                placeholder={t('settings.trackingKeywordPlaceholder')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: 13,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-surface-2)',
                  color: 'var(--color-text-primary)',
                  border: '1.5px solid var(--color-border-subtle)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddRule()
                }}
              />
              <select
                value={newRuleCategory}
                onChange={(e) =>
                  setNewRuleCategory(e.target.value as ActivityCategory)
                }
                style={{
                  padding: '8px 12px',
                  fontSize: 13,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-surface-2)',
                  color: 'var(--color-text-primary)',
                  border: '1.5px solid var(--color-border-subtle)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {RULE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleAddRule}>
                {t('common.confirm')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowRuleForm(false)
                  setNewRuleKeyword('')
                }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowRuleForm(true)}
          >
            + {t('settings.addRule')}
          </Button>
        )}
      </Section>

      {/* ─── 7b. Language Settings ─── */}
      <Section title={t('settings.sections.language')} index={7}>
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('settings.languageDescription')}
        </p>

        <div className="flex gap-3">
          {[
            { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
            { code: 'en-US', label: 'English', flag: '🇺🇸' },
          ].map((lang) => {
            const isActive = getCurrentLanguage() === lang.code
            return (
              <button
                key={lang.code}
                onClick={() => {
                  changeLanguage(lang.code)
                  addToast('success', lang.code === 'zh-CN' ? '已切换到中文' : 'Switched to English')
                }}
                className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150"
                style={{
                  background: isActive ? 'var(--color-accent-soft)' : 'var(--color-bg-surface-2)',
                  border: `2px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
                  cursor: 'pointer',
                }}
              >
                <span className="text-xl">{lang.flag}</span>
                <span
                  className="text-sm font-medium"
                  style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
                >
                  {lang.label}
                </span>
                {isActive && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-auto">
                    <circle cx="8" cy="8" r="8" fill="var(--color-accent)" />
                    <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </Section>

      {/* ─── 7c. AI Classification Settings ─── */}
      <Section title={t('settings.sections.ai')} index={7.5}>
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('settings.aiDescription')}
        </p>

        {/* API Key Input */}
        <div className="space-y-3 mt-4">
          <div>
            <label
              className="block text-xs mb-2 font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {t('settings.aiApiKey')}
            </label>
            <input
              type="password"
              value={aiSettings.aiApiKey}
              onChange={(e) => setAiSettings({ ...aiSettings, aiApiKey: e.target.value })}
              placeholder={t('settings.aiApiKeyPlaceholder')}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: 14,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-surface-2)',
                color: 'var(--color-text-primary)',
                border: '1.5px solid var(--color-border-subtle)',
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)'
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-soft)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* AI Provider Selection */}
          <div>
            <label
              className="block text-xs mb-2 font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {t('settings.aiProvider')}
            </label>
            <div className="flex gap-3 flex-wrap">
              {([
                { code: 'ernie' as const, name: '文心一言 (百度)', description: 'Baidu Ernie' },
                { code: 'doubao' as const, name: '豆包 (字节跳动)', description: 'ByteDance Doubao' },
                { code: 'qwen' as const, name: '通义千问 (阿里)', description: 'Alibaba Qwen' },
                { code: 'glm' as const, name: '智谱清言 (智谱)', description: 'Zhipu GLM' },
                { code: 'openai' as const, name: 'OpenAI', description: 'GPT-3.5 / GPT-4' },
                { code: 'claude' as const, name: 'Claude (Anthropic)', description: 'Claude 3 / Claude 3.5' },
                { code: 'gemini' as const, name: 'Gemini (Google)', description: 'Google Gemini' },
                { code: 'deepseek' as const, name: 'DeepSeek', description: 'DeepSeek AI' },
                { code: 'xai' as const, name: 'XAI', description: 'Elon Musk xAI' },
              ]).map((provider) => {
                const isActive = aiSettings.aiProvider === provider.code
                return (
                  <button
                    key={provider.code}
                    onClick={() => setAiSettings({ ...aiSettings, aiProvider: provider.code })}
                    className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150"
                    style={{
                      background: isActive ? 'var(--color-accent-soft)' : 'var(--color-bg-surface-2)',
                      border: `2px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
                      >
                        {provider.name}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {provider.description}
                      </p>
                    </div>
                    {isActive && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-auto shrink-0">
                        <circle cx="8" cy="8" r="8" fill="var(--color-accent)" />
                        <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
            <p
              className="text-xs mt-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {t('settings.aiProviderHint')}
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAiSettings}
              loading={savingAiSettings}
              className="w-full"
            >
              {t('settings.saveAiSettings')}
            </Button>
          </div>
        </div>
      </Section>

      {/* ─── 8. Notification Settings ─── */}
      <Section title={t('settings.notifications')} index={8}>
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('settings.notificationsDescription')}
        </p>

        <div
          style={{
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-subtle)',
            overflow: 'hidden',
          }}
        >
          {/* Habit reminder */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-bg-surface-2)',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {t('settings.habitReminder')}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {t('settings.habitReminderHint')}
              </p>
            </div>
            <Toggle
              checked={notifSettings.habitReminder}
              onChange={(v) => updateNotif({ habitReminder: v })}
            />
          </div>

          {/* Break reminder */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {t('settings.breakReminder')}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {t('settings.breakReminderHint')}
              </p>
            </div>
            <Toggle
              checked={notifSettings.breakReminder}
              onChange={(v) => updateNotif({ breakReminder: v })}
            />
          </div>

          {/* Focus end reminder */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-bg-surface-2)',
            }}
          >
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {t('settings.focusEndReminder')}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {t('settings.focusEndReminderHint')}
              </p>
            </div>
            <Toggle
              checked={notifSettings.focusEndReminder}
              onChange={(v) => updateNotif({ focusEndReminder: v })}
            />
          </div>
        </div>

        {/* Interval pickers */}
        <div className="space-y-3">
          <NumberField
            label={t('settings.habitInterval')}
            value={notifSettings.habitInterval}
            onChange={(v) => updateNotif({ habitInterval: v })}
            min={5}
            max={120}
            suffix={t('common.minutes')}
          />
          <NumberField
            label={t('settings.breakInterval')}
            value={notifSettings.breakInterval}
            onChange={(v) => updateNotif({ breakInterval: v })}
            min={5}
            max={120}
            suffix={t('common.minutes')}
          />
        </div>
      </Section>

      {/* ─── 8. Data Management ─── */}
      <Section title={t('settings.sections.data')} index={8}>
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('settings.dataDescription')}
        </p>

        {/* Export buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={exportJSON}
            loading={exporting}
            className="flex-1"
          >
            {t('settings.exportJSON')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportCSV}
            loading={exporting}
            className="flex-1"
          >
            {t('settings.exportCSV')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportPDF}
            loading={exporting}
            className="flex-1"
          >
            {t('settings.exportPDF')}
          </Button>
        </div>

        {/* Report export buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={exportDailyReport}
            loading={exporting}
            className="flex-1"
          >
            {t('settings.exportDaily')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportWeeklyReport}
            loading={exporting}
            className="flex-1"
          >
            {t('settings.exportWeekly')}
          </Button>
        </div>

        {/* Danger zone */}
        <div
          style={{
            marginTop: 8,
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px dashed rgba(220,60,60,0.35)',
            background: 'linear-gradient(135deg, rgba(220,60,60,0.04) 0%, rgba(220,60,60,0.08) 100%)',
          }}
        >
          <p
            className="text-xs font-semibold mb-3"
            style={{ color: 'rgb(200,60,60)', letterSpacing: '0.04em' }}
          >
            ⚠ {t('settings.dangerZone')}
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={handleReset}
            fullWidth
          >
            {t('settings.resetData')}
          </Button>
        </div>
      </Section>

      {/* ─── 9. About ─── */}
      <Section title={t('settings.sections.about')} index={9}>
        <div className="space-y-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-text-secondary)' }}>{t('settings.version')}</span>
            <Badge variant="accent" size="sm">v2.0.0-beta</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-text-secondary)' }}>{t('settings.branch')}</span>
            <Badge variant="default" size="sm">redesign/v2</Badge>
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Merize — {t('settings.tagline')}
          </p>
          <p className="text-xs">
            {t('settings.dataLocalHint')}
          </p>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-bg-surface-2)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <p
              className="text-xs font-medium mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {t('settings.links')}
            </p>
            <div className="flex gap-3">
              <a
                href="#docs"
                onClick={(e) => {
                  e.preventDefault()
                  addToast('info', t('settings.comingSoon'))
                }}
                className="text-xs font-medium"
                style={{
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                {t('settings.documentation')}
              </a>
              <a
                href="#changelog"
                onClick={(e) => {
                  e.preventDefault()
                  addToast('info', t('settings.comingSoon'))
                }}
                className="text-xs font-medium"
                style={{
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                {t('settings.changelog')}
              </a>
              <a
                href="#feedback"
                onClick={(e) => {
                  e.preventDefault()
                  addToast('info', t('settings.comingSoon'))
                }}
                className="text-xs font-medium"
                style={{
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                {t('settings.feedback')}
              </a>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
