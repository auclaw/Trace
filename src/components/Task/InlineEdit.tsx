import { useState, useRef, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { getPriorityConfig, STATUS_CONFIG } from '../../constants/task'
import type { TaskStatus } from '../../services/dataService'

interface InlineEditProps {
  value: string
  onSave: (value: string) => void
  onCancel?: () => void
  type?: 'text' | 'select' | 'priority' | 'status' | 'date'
  placeholder?: string
}

export default function InlineEdit({
  value,
  onSave,
  onCancel,
  type = 'text',
  placeholder,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (isEditing) {
      if (type === 'text') {
        inputRef.current?.focus()
        inputRef.current?.select()
      } else {
        selectRef.current?.focus()
      }
    }
  }, [isEditing, type])

  const handleSave = () => {
    onSave(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    onCancel?.()
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (!isEditing) {
    return (
      <div
        className="px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-100 transition-all min-h-[32px] flex items-center"
        onClick={() => setIsEditing(true)}
      >
        {value ? (
          type === 'priority' ? (
            <span
              className="px-2 py-0.5 rounded-md text-xs font-semibold"
              style={{ background: getPriorityConfig(Number(value)).bg, color: getPriorityConfig(Number(value)).text }}
            >
              P{value}
            </span>
          ) : type === 'status' ? (
            <span
              className="px-2 py-0.5 rounded-md text-xs font-medium"
              style={STATUS_CONFIG[value as TaskStatus] || STATUS_CONFIG.todo}
            >
              {STATUS_CONFIG[value as TaskStatus]?.label || value}
            </span>
          ) : (
            <span className="text-sm" style={{ color: '#3A3638' }}>
              {value}
            </span>
          )
        ) : (
          <span className="text-sm" style={{ color: '#9E9899' }}>
            {placeholder || '点击编辑'}
          </span>
        )}
      </div>
    )
  }

  if (type === 'text') {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none"
          style={{
            background: '#FAF8F5',
            border: '2px solid #79BEEB',
            color: '#3A3638',
          }}
          placeholder={placeholder}
        />
        <button
          onClick={handleSave}
          className="p-1.5 rounded-lg"
          style={{ background: '#79BEEB20' }}
        >
          <Check size={14} style={{ color: '#79BEEB' }} />
        </button>
        <button
          onClick={handleCancel}
          className="p-1.5 rounded-lg"
          style={{ background: '#F3F4F6' }}
        >
          <X size={14} style={{ color: '#9E9899' }} />
        </button>
      </div>
    )
  }

  if (type === 'date') {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none"
          style={{
            background: '#FAF8F5',
            border: '2px solid #79BEEB',
            color: '#3A3638',
          }}
        />
        <button
          onClick={handleSave}
          className="p-1.5 rounded-lg"
          style={{ background: '#79BEEB20' }}
        >
          <Check size={14} style={{ color: '#79BEEB' }} />
        </button>
        <button
          onClick={handleCancel}
          className="p-1.5 rounded-lg"
          style={{ background: '#F3F4F6' }}
        >
          <X size={14} style={{ color: '#9E9899' }} />
        </button>
      </div>
    )
  }

  if (type === 'priority') {
    return (
      <div className="flex items-center gap-1">
        <select
          ref={selectRef}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value)
            onSave(e.target.value)
          }}
          onBlur={handleCancel}
          className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none cursor-pointer"
          style={{
            background: '#FAF8F5',
            border: '2px solid #79BEEB',
            color: '#3A3638',
          }}
        >
          {[1, 2, 3, 4, 5].map((p) => (
            <option key={p} value={p}>
              P{p}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (type === 'status') {
    return (
      <div className="flex items-center gap-1">
        <select
          ref={selectRef}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value)
            onSave(e.target.value)
          }}
          onBlur={handleCancel}
          className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none cursor-pointer"
          style={{
            background: '#FAF8F5',
            border: '2px solid #79BEEB',
            color: '#3A3638',
          }}
        >
          {(['todo', 'in_progress', 'paused', 'completed', 'archived'] as const).map(
            (status) => (
              <option key={status} value={status}>
                {STATUS_CONFIG[status].label}
              </option>
            )
          )}
        </select>
      </div>
    )
  }

  return null
}
