import { useState } from 'react'
import {
  Palette,
  Target,
  Timer,
  Activity,
  Tag,
  Moon,
  Sun,
  Trash2,
  Shield,
  Plus,
  Pencil,
  X,
  Check,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useToastFeedback } from '../hooks/useToastFeedback'

// Setting sections with grouped navigation (Beta version - simplified)
const SETTING_SECTIONS = [
  {
    group: '🎨 外观',
    items: [
      { key: 'theme', label: '主题', icon: Palette, color: 'var(--color-green)' },
    ],
  },
  {
    group: '🎯 专注与目标',
    items: [
      { key: 'dailyGoal', label: '每日目标', icon: Target, color: 'var(--color-purple)' },
      { key: 'focus', label: '专注设置', icon: Timer, color: 'var(--color-lemon)' },
      { key: 'activity', label: '活动追踪', icon: Activity, color: 'var(--color-coral)' },
    ],
  },
  {
    group: '🛡️ Guardian',
    items: [
      { key: 'guardian', label: 'Guardian', icon: Shield, color: 'var(--color-purple)' },
    ],
  },
  {
    group: '⚙️ 高级',
    items: [
      { key: 'categories', label: '分类管理', icon: Tag, color: 'var(--color-text-muted)' },
      { key: 'clearData', label: '清除所有数据', icon: Trash2, color: 'var(--color-coral)' },
    ],
  },
]

// Color palette for category selection - 用户可选的分类颜色配置
/* eslint-disable no-restricted-syntax */
const CATEGORY_COLORS = [
  'var(--color-blue)', 'var(--color-purple)', 'var(--color-green)', 'var(--color-lemon)', 'var(--color-coral)',
  'var(--color-text-muted)', '#F7DC6F', '#BB8FCE', '#85C1E9', '#82E0AA',
  '#F1948A', '#F8C471', '#AED6F1', '#A9DFBF', '#FCF3CF',
]
/* eslint-enable no-restricted-syntax */

export default function Settings() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const dailyGoalMinutes = useAppStore((s) => s.dailyGoalMinutes)
  const setDailyGoalMinutes = useAppStore((s) => s.setDailyGoalMinutes)
  const focusSettings = useAppStore((s) => s.focusSettings)
  const updateFocusSettings = useAppStore((s) => s.updateFocusSettings)
  const guardianSettings = useAppStore((s) => s.guardianSettings)
  const updateGuardianSettings = useAppStore((s) => s.updateGuardianSettings)
  const categories = useAppStore((s) => s.categories)
  const toggleCategory = useAppStore((s) => s.toggleCategory)
  const addCategory = useAppStore((s) => s.addCategory)
  const updateCategory = useAppStore((s) => s.updateCategory)
  const deleteCategory = useAppStore((s) => s.deleteCategory)

  const [activeSection, setActiveSection] = useState<string>('theme')
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false)
  const clearAllData = useAppStore((s) => s.clearAllData)
  const { success, error } = useToastFeedback()
  const [autoAcceptThreshold, setAutoAcceptThreshold] = useState(95)
  const [minEntryMinutes, setMinEntryMinutes] = useState(15)

  // Category edit states
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0])
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [migrateToId, setMigrateToId] = useState('other')

  const startAddCategory = () => {
    setIsAddingCategory(true)
    setNewCategoryName('')
    setNewCategoryColor(CATEGORY_COLORS[0])
  }

  const cancelAddCategory = () => {
    setIsAddingCategory(false)
    setNewCategoryName('')
  }

  const saveNewCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim(), newCategoryColor)
      setIsAddingCategory(false)
      setNewCategoryName('')
      success('已添加分类')
    }
  }

  const startEditCategory = (category: any) => {
    setEditingCategoryId(category.id)
    setNewCategoryName(category.name)
    setNewCategoryColor(category.color)
  }

  const cancelEditCategory = () => {
    setEditingCategoryId(null)
    setNewCategoryName('')
  }

  const saveEditCategory = () => {
    if (editingCategoryId && newCategoryName.trim()) {
      updateCategory(editingCategoryId, {
        name: newCategoryName.trim(),
        color: newCategoryColor,
      })
      setEditingCategoryId(null)
      setNewCategoryName('')
      success('已更新分类')
    }
  }

  // Render section content based on active key
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'clearData':
        return (
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'var(--color-bg-surface-1)',
                border: '2px solid var(--color-border-strong)',
                boxShadow: '4px 4px 0px var(--color-border-strong)',
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--color-coral)20' }}
                >
                  <Trash2 size={20} style={{ color: 'var(--color-coral)' }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    清除所有数据
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    此操作不可撤销
                  </p>
                </div>
              </div>

              {!showClearDataConfirm ? (
                <button
                  onClick={() => setShowClearDataConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl font-semibold transition-all hover:opacity-90"
                  style={{ background: 'var(--color-coral)', color: 'var(--color-bg-surface-1)' }}
                >
                  <Trash2 size={18} />
                  清除所有数据
                </button>
              ) : (
                <div
                  className="p-4 rounded-xl"
                  style={{ background: '#FFF5F5', border: '2px solid var(--color-coral)' }}
                >
                  <p className="text-sm font-medium mb-4 text-center" style={{ color: 'var(--color-text-primary)' }}>
                    确定要删除所有数据吗？此操作不可撤销
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        try {
                          await clearAllData()
                          setShowClearDataConfirm(false)
                          success('所有数据已清除')
                        } catch {
                          error('清除数据失败')
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                      style={{ background: 'var(--color-coral)', color: 'var(--color-bg-surface-1)' }}
                    >
                      <Trash2 size={16} />
                      确认删除
                    </button>
                    <button
                      onClick={() => setShowClearDataConfirm(false)}
                      className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                      style={{ background: 'var(--color-border-light)', color: 'var(--color-text-secondary)' }}
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'theme':
        return (
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'var(--color-bg-surface-1)',
                border: '2px solid var(--color-border-strong)',
                boxShadow: '4px 4px 0px var(--color-border-strong)',
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Appearance
              </h3>
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  Theme
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'light', label: 'Light', icon: Sun },
                    { key: 'dark', label: 'Dark', icon: Moon },
                  ].map((option) => {
                    const Icon = option.icon
                    const isActive = theme === option.key
                    return (
                      <button
                        key={option.key}
                        onClick={() => setTheme(option.key as 'light' | 'dark')}
                        className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all"
                        style={{
                          background: isActive ? 'var(--color-blue)20' : 'var(--color-bg-surface-3)',
                          border: isActive ? '2px solid var(--color-blue)' : '2px solid transparent',
                        }}
                      >
                        <Icon size={20} style={{ color: isActive ? 'var(--color-blue)' : 'var(--color-text-muted)' }} />
                        <span className="text-xs font-semibold" style={{ color: isActive ? 'var(--color-blue)' : 'var(--color-text-secondary)' }}>
                          {option.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )

      case 'dailyGoal':
        return (
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'var(--color-bg-surface-1)',
                border: '2px solid var(--color-border-strong)',
                boxShadow: '4px 4px 0px var(--color-border-strong)',
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Daily Focus Goal
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                Set your daily target for focused work time
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="30"
                  max="480"
                  step="15"
                  value={dailyGoalMinutes}
                  onChange={(e) => setDailyGoalMinutes(parseInt(e.target.value))}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: 'var(--color-bg-surface-3)' }}
                />
                <div
                  className="px-4 py-2 rounded-xl text-center min-w-[100px]"
                  style={{ background: 'var(--color-green)30', border: '2px solid var(--color-green)' }}
                >
                  <span className="text-lg font-bold" style={{ color: '#2D5A4A' }}>
                    {Math.floor(dailyGoalMinutes / 60)}h {dailyGoalMinutes % 60}m
                  </span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'focus':
        return (
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'var(--color-bg-surface-1)',
                border: '2px solid var(--color-border-strong)',
                boxShadow: '4px 4px 0px var(--color-border-strong)',
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Pomodoro Timer Settings
              </h3>
              <div className="space-y-4">
                {[
                  { key: 'workMinutes', label: 'Work Duration', options: [15, 20, 25, 30, 45, 60], suffix: 'min' },
                  { key: 'breakMinutes', label: 'Short Break', options: [3, 5, 7, 10, 15], suffix: 'min' },
                  { key: 'longBreakMinutes', label: 'Long Break', options: [10, 15, 20, 25, 30], suffix: 'min' },
                  { key: 'longBreakInterval', label: 'Long Break After', options: [2, 3, 4, 5, 6], suffix: 'sessions' },
                ].map(({ key, label, options, suffix }) => (
                  <div key={key} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {label}
                    </span>
                    <select
                      value={(focusSettings as any)[key]}
                      onChange={(e) => updateFocusSettings({ [key]: parseInt(e.target.value) })}
                      className="px-3 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: 'var(--color-bg-surface-3)', color: 'var(--color-text-primary)', border: 'none', outline: 'none' }}
                    >
                      {options.map((m) => (
                        <option key={m} value={m}>{m} {suffix}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'categories':
        return (
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'var(--color-bg-surface-1)',
                border: '2px solid var(--color-border-strong)',
                boxShadow: '4px 4px 0px var(--color-border-strong)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Activity Categories
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Manage categories for organizing your activities
                  </p>
                </div>
                {!isAddingCategory && (
                  <button
                    onClick={startAddCategory}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                    style={{ background: 'var(--color-blue)', color: 'var(--color-bg-surface-1)' }}
                  >
                    <Plus size={16} />
                    Add
                  </button>
                )}
              </div>

              {/* Add Category Form */}
              {isAddingCategory && (
                <div
                  className="mb-4 p-4 rounded-xl"
                  style={{ background: 'var(--color-bg-surface-3)', border: '2px dashed var(--color-border-strong)' }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                        Category Name
                      </label>
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter category name..."
                        className="w-full px-3 py-2 rounded-xl text-sm"
                        style={{ background: 'var(--color-bg-surface-1)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-light)', outline: 'none' }}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                        Color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORY_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewCategoryColor(color)}
                            className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                            style={{
                              background: color,
                              border: newCategoryColor === color ? '2px solid var(--color-text-primary)' : '2px solid transparent',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveNewCategory}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                        style={{ background: 'var(--color-green)', color: '#2D5A4A' }}
                      >
                        <Check size={16} />
                        Save
                      </button>
                      <button
                        onClick={cancelAddCategory}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                        style={{ background: 'var(--color-border-light)', color: 'var(--color-text-secondary)' }}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Category List */}
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id}>
                    {editingCategoryId === cat.id ? (
                      // Edit Mode
                      <div
                        className="p-4 rounded-xl"
                        style={{ background: 'var(--color-bg-surface-3)', border: '2px solid var(--color-blue)' }}
                      >
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                              Name
                            </label>
                            <input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl text-sm"
                              style={{ background: 'var(--color-bg-surface-1)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-light)', outline: 'none' }}
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                              Color
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {CATEGORY_COLORS.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setNewCategoryColor(color)}
                                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                                  style={{
                                    background: color,
                                    border: newCategoryColor === color ? '2px solid var(--color-text-primary)' : '2px solid transparent',
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={saveEditCategory}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                              style={{ background: 'var(--color-green)', color: '#2D5A4A' }}
                            >
                              <Check size={16} />
                              Save
                            </button>
                            <button
                              onClick={cancelEditCategory}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                              style={{ background: 'var(--color-border-light)', color: 'var(--color-text-secondary)' }}
                            >
                              <X size={16} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : deleteConfirmId === cat.id ? (
                      // Delete Confirmation
                      <div
                        className="p-4 rounded-xl"
                        style={{ background: '#FFF5F5', border: '2px solid var(--color-coral)' }}
                      >
                        <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
                          Delete "{cat.name}"? Existing activities will be migrated to:
                        </p>
                        <select
                          value={migrateToId}
                          onChange={(e) => setMigrateToId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-sm mb-3"
                          style={{ background: 'var(--color-bg-surface-1)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-light)', outline: 'none' }}
                        >
                          {categories
                            .filter((c) => c.id !== cat.id)
                            .map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              deleteCategory(cat.id, migrateToId)
                              setDeleteConfirmId(null)
                              success('已删除分类')
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                            style={{ background: 'var(--color-coral)', color: 'var(--color-bg-surface-1)' }}
                          >
                            <Trash2 size={16} />
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                            style={{ background: 'var(--color-border-light)', color: 'var(--color-text-secondary)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'var(--color-bg-surface-3)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {cat.name}
                            {cat.isDefault && (
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-purple)30', color: 'var(--color-purple)' }}>
                                Default
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleCategory(cat.id)}
                            className="w-10 h-5 rounded-full transition-all flex items-center px-0.5"
                            style={{ background: cat.enabled ? 'var(--color-green)' : 'var(--color-border-light)' }}
                          >
                            <div
                              className="w-4 h-4 rounded-full bg-white transition-all shadow-sm"
                              style={{ transform: cat.enabled ? 'translateX(20px)' : 'translateX(0)' }}
                            />
                          </button>
                          {!cat.isDefault && (
                            <>
                              <button
                                onClick={() => startEditCategory(cat)}
                                className="p-2 rounded-lg transition-all hover:opacity-70"
                                style={{ background: 'var(--color-border-light)', color: 'var(--color-text-secondary)' }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(cat.id)}
                                className="p-2 rounded-lg transition-all hover:opacity-70"
                                style={{ background: 'var(--color-coral)20', color: 'var(--color-coral)' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'activity':
        return (
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'var(--color-bg-surface-1)',
                border: '2px solid var(--color-border-strong)',
                boxShadow: '4px 4px 0px var(--color-border-strong)',
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Activity Tracking Settings
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl mb-4" style={{ background: 'var(--color-bg-surface-2)' }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    Auto-Accept Tag Suggestions
                  </p>
                  <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                    Automatically accept AI suggestions above this confidence level
                  </p>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="5"
                      value={autoAcceptThreshold}
                      onChange={(e) => setAutoAcceptThreshold(parseInt(e.target.value))}
                      className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                      style={{ background: 'var(--color-border-light)' }}
                    />
                    <span className="text-sm font-bold w-12 text-right" style={{ color: 'var(--color-green)' }}>
                      {autoAcceptThreshold}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Minimum Time Entry</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Minimum minutes required for a time entry</p>
                  </div>
                  <select
                    value={minEntryMinutes}
                    onChange={(e) => setMinEntryMinutes(parseInt(e.target.value))}
                    className="px-3 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--color-bg-surface-3)', color: 'var(--color-text-primary)', border: 'none', outline: 'none' }}
                  >
                    {[1, 5, 10, 15, 30].map((m) => (
                      <option key={m} value={m}>{m} minutes</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )


      case 'guardian':
        return (
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'var(--color-bg-surface-1)',
                border: '2px solid var(--color-border-strong)',
                boxShadow: '4px 4px 0px var(--color-border-strong)',
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Execution Guardian
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                守护你的专注体验，帮助你建立每日仪式感
              </p>

              <div className="space-y-4">
                {/* Morning Ritual Toggle */}
                <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      每日晨间仪式
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      每天第一次打开应用时显示今日计划
                    </p>
                  </div>
                  <button
                    onClick={() => updateGuardianSettings({ morningRitualEnabled: !guardianSettings.morningRitualEnabled })}
                    className="w-12 h-7 rounded-full transition-all relative"
                    style={{ background: guardianSettings.morningRitualEnabled ? 'var(--color-green)' : 'var(--color-border-strong)' }}
                  >
                    <div
                      className="w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all"
                      style={{ left: guardianSettings.morningRitualEnabled ? 26 : 4 }}
                    />
                  </button>
                </div>

                {/* Daily Review Toggle */}
                <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      每日复盘
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      每晚 20:00 后自动弹出当日总结
                    </p>
                  </div>
                  <button
                    onClick={() => updateGuardianSettings({ dailyReviewEnabled: !guardianSettings.dailyReviewEnabled })}
                    className="w-12 h-7 rounded-full transition-all relative"
                    style={{ background: guardianSettings.dailyReviewEnabled ? 'var(--color-green)' : 'var(--color-border-strong)' }}
                  >
                    <div
                      className="w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all"
                      style={{ left: guardianSettings.dailyReviewEnabled ? 26 : 4 }}
                    />
                  </button>
                </div>

                {/* Launch Boost Toggle */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      启动加速
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      应用启动时加载 Now Engine 推荐
                    </p>
                  </div>
                  <button
                    onClick={() => updateGuardianSettings({ launchBoostEnabled: !guardianSettings.launchBoostEnabled })}
                    className="w-12 h-7 rounded-full transition-all relative"
                    style={{ background: guardianSettings.launchBoostEnabled ? 'var(--color-green)' : 'var(--color-border-strong)' }}
                  >
                    <div
                      className="w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all"
                      style={{ left: guardianSettings.launchBoostEnabled ? 26 : 4 }}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex h-full" style={{ background: 'var(--color-bg-base)' }}>
      {/* Left Sidebar - Navigation */}
      <div
        className="w-56 flex-shrink-0 p-4 overflow-y-auto"
        style={{
          background: 'var(--color-bg-surface-1)',
          borderRight: '2px solid var(--color-border-strong)',
        }}
      >
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Settings
          </h2>
        </div>

        {SETTING_SECTIONS.map((group, groupIndex) => (
          <div key={group.group} className={groupIndex > 0 ? 'mt-6' : ''}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: 'var(--color-text-muted)' }}>
              {group.group}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                    style={{
                      background: isActive ? `${item.color}20` : 'transparent',
                      color: isActive ? item.color : 'var(--color-text-secondary)',
                    }}
                  >
                    <Icon size={16} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          <div className="mb-6">
            <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}>
              {SETTING_SECTIONS.flatMap(g => g.items).find(i => i.key === activeSection)?.label || 'Settings'}
            </h1>
          </div>
          {renderSectionContent()}
        </div>
      </div>
    </div>
  )
}
