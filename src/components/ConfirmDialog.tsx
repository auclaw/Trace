import { AlertTriangle, HelpCircle, Info } from 'lucide-react'
import { Modal } from './ui'

/**
 * Reusable confirmation dialog for destructive / important actions.
 * Covers: delete task, reset data, end focus session, clear habits, etc.
 */

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  icon?: React.ReactNode
}

const variantStyles: Record<string, { color: string; bg: string }> = {
  danger: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  warning: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  info: { color: 'var(--color-accent)', bg: 'var(--color-accent-soft)' },
}

const defaultIcons: Record<string, React.ReactNode> = {
  danger: <AlertTriangle size={28} />,
  warning: <HelpCircle size={28} />,
  info: <Info size={28} />,
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'danger',
  icon,
}: ConfirmDialogProps) {
  const style = variantStyles[variant]
  const displayIcon = icon || defaultIcons[variant]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center space-y-4 py-2">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style={{ background: style.bg, color: style.color }}
        >
          {displayIcon}
        </div>

        {/* Title & message */}
        <div>
          <h3
            className="text-base font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {title}
          </h3>
          <p
            className="text-sm mt-1.5 leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-sm font-medium transition-colors duration-150"
            style={{
              background: 'var(--color-bg-surface-2)',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-border-subtle)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-surface-2)'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-all duration-150 hover:opacity-90"
            style={{
              background: style.color,
              boxShadow: `0 2px 8px ${style.bg}`,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
