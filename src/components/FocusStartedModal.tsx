import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from './ui'

/**
 * "Your focus session started" popup.
 * Shows when a focus session begins. Allows user to set a goal and add tags.
 */

interface FocusStartedModalProps {
  isOpen: boolean
  onClose: () => void
  onViewSession?: () => void
}

const SUGGESTED_TAGS = {
  project: ['工作项目', '个人项目', '学习', '副业', '开源'],
  client: ['内部', '客户A', '客户B', '自由职业'],
  task: ['编码', '设计', '写作', '阅读', '会议', '复习'],
}

export default function FocusStartedModal({ isOpen, onClose, onViewSession }: FocusStartedModalProps) {
  const { t } = useTranslation()
  const [goal, setGoal] = useState('')
  const [projectTag, setProjectTag] = useState('')
  const [clientTag, setClientTag] = useState('')
  const [taskTag, setTaskTag] = useState('')
  const [showProjectSuggestions, setShowProjectSuggestions] = useState(false)
  const [showClientSuggestions, setShowClientSuggestions] = useState(false)
  const [showTaskSuggestions, setShowTaskSuggestions] = useState(false)

  const handleViewSession = useCallback(() => {
    onViewSession?.()
    onClose()
  }, [onViewSession, onClose])

  const handleDismiss = useCallback(() => {
    // Save goal to localStorage if set
    if (goal.trim()) {
      try {
        localStorage.setItem('merize-current-focus-goal', goal.trim())
      } catch { /* noop */ }
    }
    if (projectTag.trim() || clientTag.trim() || taskTag.trim()) {
      try {
        localStorage.setItem('merize-current-focus-tags', JSON.stringify({
          project: projectTag.trim(),
          client: clientTag.trim(),
          task: taskTag.trim(),
        }))
      } catch { /* noop */ }
    }
    onClose()
  }, [goal, projectTag, clientTag, taskTag, onClose])

  return (
    <Modal isOpen={isOpen} onClose={handleDismiss} size="md">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold tracking-wider"
              style={{ color: 'var(--color-text-primary)' }}
            >
              MERIZE
            </span>
            <span className="text-xs" style={{ color: 'var(--color-accent)' }}>
              ⚡ {t('focus.productivityCoach')}
            </span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h2
            className="text-xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {t('popups.focusStarted')}
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {t('popups.focusStartedHint')}
          </p>
        </div>

        {/* Goal input */}
        <div>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={t('popups.focusGoalPlaceholder')}
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all duration-150"
            style={{
              background: 'var(--color-bg-surface-2)',
              border: '1.5px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
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

        {/* Tag inputs */}
        <div className="space-y-2.5">
          <TagInput
            value={projectTag}
            onChange={setProjectTag}
            placeholder={t('popups.addProjectTag')}
            suggestions={SUGGESTED_TAGS.project}
            showSuggestions={showProjectSuggestions}
            onFocus={() => setShowProjectSuggestions(true)}
            onBlur={() => setTimeout(() => setShowProjectSuggestions(false), 150)}
          />
          <TagInput
            value={clientTag}
            onChange={setClientTag}
            placeholder={t('popups.addClientTag')}
            suggestions={SUGGESTED_TAGS.client}
            showSuggestions={showClientSuggestions}
            onFocus={() => setShowClientSuggestions(true)}
            onBlur={() => setTimeout(() => setShowClientSuggestions(false), 150)}
          />
          <TagInput
            value={taskTag}
            onChange={setTaskTag}
            placeholder={t('popups.addTaskTag')}
            suggestions={SUGGESTED_TAGS.task}
            showSuggestions={showTaskSuggestions}
            onFocus={() => setShowTaskSuggestions(true)}
            onBlur={() => setTimeout(() => setShowTaskSuggestions(false), 150)}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleViewSession}
            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 hover:shadow-lg"
            style={{
              background: 'var(--color-accent)',
              boxShadow: '0 2px 8px var(--color-accent-soft)',
            }}
          >
            {t('popups.viewSession')}
          </button>
          <button
            onClick={handleDismiss}
            className="px-5 py-2 rounded-full text-sm font-medium transition-colors duration-150"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
          >
            {t('popups.dismiss')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Tag input with dropdown suggestions ── */

function TagInput({
  value,
  onChange,
  placeholder,
  suggestions,
  showSuggestions,
  onFocus,
  onBlur,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  suggestions: string[]
  showSuggestions: boolean
  onFocus: () => void
  onBlur: () => void
}) {
  return (
    <div className="relative">
      <div
        className="flex items-center rounded-xl overflow-hidden transition-all duration-150"
        style={{
          background: 'var(--color-bg-surface-2)',
          border: '1.5px solid var(--color-border-subtle)',
        }}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
          className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none"
          style={{ color: 'var(--color-text-primary)' }}
        />
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="mr-3 shrink-0"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10 py-1"
          style={{
            background: 'var(--color-bg-surface-1)',
            border: '1px solid var(--color-border-subtle)',
            boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(44,24,16,0.12))',
          }}
        >
          {suggestions
            .filter((s) => !value || s.includes(value))
            .map((s) => (
              <button
                key={s}
                className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-[var(--color-accent-soft)] cursor-pointer"
                style={{ color: 'var(--color-text-primary)' }}
                onMouseDown={() => onChange(s)}
              >
                {s}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
