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

/* ── Section wrapper ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card padding="md" className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
      {children}
    </Card>
  )
}

/* ── Toggle switch ── */
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
      className={[
        'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer',
        checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-subtle)]',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          'translate-y-0.5',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        ].join(' ')}
      />
    </button>
  )
}

/* ── Number input helper ── */
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
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
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
          className={[
            'w-20 px-2 py-1.5 text-sm text-center rounded-lg',
            'bg-[var(--color-bg-surface-2)] text-[var(--color-text-primary)]',
            'border border-[var(--color-border-subtle)]/50',
            'outline-none focus:border-[var(--color-accent)]',
          ].join(' ')}
        />
        {suffix && (
          <span className="text-xs text-[var(--color-text-muted)]">{suffix}</span>
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
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">设置</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          配置外观、功能模块与数据管理
        </p>
      </div>

      {/* ─── 1. Appearance ─── */}
      <Section title="外观设置">
        {/* Theme toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{isDark ? '🌙' : '☀️'}</span>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {isDark ? '深色模式' : '浅色模式'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">切换明暗主题</p>
            </div>
          </div>
          <Toggle
            checked={isDark}
            onChange={(v) => setTheme(v ? 'dark' : 'light')}
          />
        </div>

        {/* Color theme grid */}
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">主题配色</p>
          <div className="grid grid-cols-5 gap-3">
            {(Object.entries(colorThemeConfigs) as [ColorTheme, (typeof colorThemeConfigs)[ColorTheme]][]).map(
              ([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setColorTheme(key)}
                  className={[
                    'aspect-square rounded-xl transition-all duration-200 hover:scale-105 cursor-pointer',
                    colorTheme === key ? 'ring-2 ring-offset-2 ring-[var(--color-accent)]' : '',
                  ].join(' ')}
                  style={{ backgroundColor: cfg.accent }}
                  title={cfg.name}
                />
              ),
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            当前: {colorThemeConfigs[colorTheme].name} — {colorThemeConfigs[colorTheme].description}
          </p>
        </div>

        {/* Background skin */}
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">背景风格</p>
          <div className="space-y-2">
            {(Object.entries(backgroundSkinConfigs) as [BackgroundSkin, (typeof backgroundSkinConfigs)[BackgroundSkin]][]).map(
              ([key, cfg]) => {
                const selected = backgroundSkin === key
                return (
                  <button
                    key={key}
                    onClick={() => setBackgroundSkin(key)}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer',
                      'border',
                      selected
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                        : 'border-[var(--color-border-subtle)]/50 hover:border-[var(--color-border-subtle)]',
                    ].join(' ')}
                  >
                    {/* Preview swatch */}
                    <div
                      className={[
                        'w-10 h-10 rounded-lg shrink-0 border border-[var(--color-border-subtle)]/30',
                        cfg.getBgClass(isDark),
                      ].join(' ')}
                    />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {cfg.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {cfg.description}
                      </p>
                    </div>
                    {selected && (
                      <Badge variant="accent" size="sm" className="ml-auto">
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
      <Section title="功能模块">
        <p className="text-xs text-[var(--color-text-muted)]">
          选择哪些模块显示在侧边栏中
        </p>
        <div className="space-y-2">
          {DEFAULT_MODULES.map((mod) => (
            <div
              key={mod}
              className="flex items-center justify-between py-1.5"
            >
              <span className="text-sm text-[var(--color-text-secondary)]">
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
      <Section title="专注设置">
        <div className="space-y-3">
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
      <Section title="每日目标">
        <NumberField
          label="每日专注目标"
          value={dailyGoalMinutes}
          onChange={setDailyGoalMinutes}
          min={30}
          max={960}
          suffix="分钟"
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          相当于 {(dailyGoalMinutes / 60).toFixed(1)} 小时
        </p>
      </Section>

      {/* ─── 5. Data Management ─── */}
      <Section title="数据管理">
        <p className="text-xs text-[var(--color-text-muted)]">
          导出或重置本地数据，所有数据仅保存在浏览器中
        </p>
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
        <Button
          variant="danger"
          size="sm"
          onClick={handleReset}
          fullWidth
        >
          重置演示数据
        </Button>
      </Section>

      {/* ─── 6. About ─── */}
      <Section title="关于">
        <div className="space-y-1 text-sm text-[var(--color-text-muted)]">
          <p>
            <span className="text-[var(--color-text-secondary)]">版本</span>{' '}
            <Badge variant="default" size="sm">v1.0.0</Badge>
          </p>
          <p>
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
