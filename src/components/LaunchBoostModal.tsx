import { useState } from 'react'
import { X, Clock, Zap, Rocket } from 'lucide-react'
import type { Task } from '../services/dataService'

interface LaunchBoostModalProps {
  isOpen: boolean
  onClose: () => void
  onStartFocus: (task: Task, durationMinutes: number) => void
  task: Task | null
}

export default function LaunchBoostModal({
  isOpen,
  onClose,
  onStartFocus,
  task,
}: LaunchBoostModalProps) {
  const [customDuration, setCustomDuration] = useState(25)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(25)

  if (!isOpen || !task) return null

  const handleStart = (minutes: number) => {
    onStartFocus(task, minutes)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md mx-4 p-8 rounded-[24px]"
        style={{
          background: 'var(--color-bg-surface-1)',
          border: '2px solid var(--color-accent-soft)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-accent-soft)' }}
            >
              <Rocket size={24} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Launch Boost
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                准备好开始专注了吗？
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
          >
            <X size={18} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Task Info Card */}
        <div
          className="p-4 rounded-xl mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(121, 190, 235, 0.1) 0%, rgba(212, 196, 251, 0.1) 100%)',
            border: '1px solid var(--color-accent-soft)',
          }}
        >
          <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {task.title}
          </h3>
          {task.firstStep && (
            <div className="flex items-start gap-2">
              <Zap size={14} style={{ color: 'var(--color-accent)', marginTop: 2 }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                第一步：{task.firstStep}
              </p>
            </div>
          )}
          {task.estimatedMinutes && (
            <div className="flex items-center gap-2 mt-2">
              <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                预计 {task.estimatedMinutes} 分钟
              </span>
            </div>
          )}
        </div>

        {/* Duration Selector */}
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            选择专注时长
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[25, 50, 90].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setSelectedDuration(mins)
                  handleStart(mins)
                }}
                className="p-4 rounded-xl transition-all hover:scale-[1.02] hover:shadow-md"
                style={{
                  background: selectedDuration === mins ? 'var(--color-accent)' : 'var(--color-bg-surface-2)',
                  border: `2px solid ${selectedDuration === mins ? 'var(--color-accent)' : 'var(--color-border-subtle)'}`,
                  color: selectedDuration === mins ? 'white' : 'var(--color-text-primary)',
                }}
              >
                <Clock size={20} className="mx-auto mb-1" />
                <p className="text-lg font-bold text-center">{mins}</p>
                <p className="text-xs text-center opacity-80">分钟</p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Duration */}
        <div className="flex items-center gap-3 mb-6">
          <input
            type="number"
            value={customDuration}
            onChange={(e) => setCustomDuration(Math.max(5, Math.min(180, parseInt(e.target.value) || 5)))}
            className="flex-1 px-4 py-3 rounded-xl text-center text-lg font-bold"
            style={{
              background: 'var(--color-bg-surface-2)',
              border: '2px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
            }}
            min={5}
            max={180}
          />
          <button
            onClick={() => handleStart(customDuration)}
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, var(--color-blue) 0%, var(--color-purple) 100%)',
              color: 'white',
            }}
          >
            开始
          </button>
        </div>

        {/* Skip Button */}
        <button
          onClick={() => handleStart(task.estimatedMinutes || 25)}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
          style={{
            background: 'var(--color-bg-surface-2)',
            color: 'var(--color-text-muted)',
            border: 'none',
          }}
        >
          跳过 → 使用默认时长
        </button>
      </div>
    </div>
  )
}
