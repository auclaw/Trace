import { useState, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import dataService from '../services/dataService'
import { Card, Button, Badge } from '../components/ui'
import {
  colorThemeConfigs,
  backgroundSkinConfigs,
  DEFAULT_MODULES,
} from '../config/themes'
import type { ColorTheme, BackgroundSkin } from '../config/themes'

/* ── Module display names ── */
const MODULE_LABELS: Record<string, string> = {
  dashboard: '仪表盘',
  planner: '日程规划',
  focus: '专注模式',
  calendar: '日历',
  statistics: '统计',
  habits: '习惯追踪',
  pet: '效率宠物',
  'ai-summary': 'AI 智能总结',
  'deep-work-stats': '深度工作分析',
  'flow-blocks': '心流屏蔽',
  settings: '设置',
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
      addToast('success', 'JSON 导出成功')
    } catch {
      addToast('error', '导出失败')
    } finally {
      setExporting(false)
    }
  }, [addToast])

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
      addToast('success', 'CSV 导出成功')
    } catch {
      addToast('error', '导出失败')
    } finally {
      setExporting(false)
    }
  }, [addToast])

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
            设置
          </h2>
        </div>
        <p
          className="text-sm ml-[22px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          配置外观、功能模块与数据管理
        </p>
      </div>

      {/* ─── 1. Appearance ─── */}
      <Section title="外观设置" index={1}>
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
                {isDark ? '深色模式' : '浅色模式'}
              </p>
              <p
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                切换明暗主题
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
            主题配色
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
            背景风格
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
                        当前
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
      <Section title="功能模块" index={2}>
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          选择哪些模块显示在侧边栏中
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
                {MODULE_LABELS[mod] || mod}
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
      <Section title="专注设置" index={3}>
        <div className="space-y-4">
          <NumberField
            label="工作时长"
            value={focusSettings.workMinutes}
            onChange={(v) => updateFocusSettings({ workMinutes: v })}
            min={5}
            max={120}
            suffix="分钟"
          />
          <NumberField
            label="短休息时长"
            value={focusSettings.breakMinutes}
            onChange={(v) => updateFocusSettings({ breakMinutes: v })}
            min={1}
            max={30}
            suffix="分钟"
          />
          <NumberField
            label="长休息时长"
            value={focusSettings.longBreakMinutes}
            onChange={(v) => updateFocusSettings({ longBreakMinutes: v })}
            min={5}
            max={60}
            suffix="分钟"
          />
          <NumberField
            label="长休息间隔"
            value={focusSettings.longBreakInterval}
            onChange={(v) => updateFocusSettings({ longBreakInterval: v })}
            min={2}
            max={10}
            suffix="轮"
          />
        </div>
      </Section>

      {/* ─── 4. Daily Goal ─── */}
      <Section title="每日目标" index={4}>
        <NumberField
          label="每日专注目标"
          value={dailyGoalMinutes}
          onChange={setDailyGoalMinutes}
          min={30}
          max={960}
          suffix="分钟"
        />
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          相当于 {(dailyGoalMinutes / 60).toFixed(1)} 小时
        </p>
      </Section>

      {/* ─── 5. Data Management ─── */}
      <Section title="数据管理" index={5}>
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          导出或重置本地数据，所有数据仅保存在浏览器中
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
            导出 JSON
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportCSV}
            loading={exporting}
            className="flex-1"
          >
            导出 CSV
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
            ⚠ 危险区域
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={handleReset}
            fullWidth
          >
            重置演示数据
          </Button>
        </div>
      </Section>

      {/* ─── 6. About ─── */}
      <Section title="关于" index={6}>
        <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <p className="flex items-center gap-2">
            <span style={{ color: 'var(--color-text-secondary)' }}>版本</span>
            <Badge variant="default" size="sm">v1.0.0</Badge>
          </p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Merize — 让每一分钟都有意义的效率工具
          </p>
          <p className="text-xs">
            数据完全存储在本地浏览器中，不会上传到任何服务器。
          </p>
        </div>
      </Section>
    </div>
  )
}
