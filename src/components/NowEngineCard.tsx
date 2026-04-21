import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Lightbulb, Sparkles } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { Task } from '../services/dataService'

// Launch Boost Modal - shows first step before starting focus
function LaunchBoostModal({
  isOpen,
  task,
  onClose,
  onStart,
}: {
  isOpen: boolean
  task: Task | null
  onClose: () => void
  onStart: (withFirstStep: string) => void
}) {
  const [firstStep, setFirstStep] = useState(task?.firstStep || '')

  if (!isOpen || !task) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md mx-4 p-8 rounded-[24px]"
        style={{
          background: 'var(--color-bg-surface-1)',
          border: '2px solid var(--color-border-strong)',
          boxShadow: '4px 4px 0px var(--color-border-strong)',
        }}
      >
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full"
          style={{ background: 'var(--color-accent-soft)' }}>
          <Sparkles size={28} style={{ color: 'var(--color-accent)' }} />
        </div>

        <h2 className="text-xl font-bold text-center mb-2" style={{ color: 'var(--color-text-primary)' }}>
          准备开始
        </h2>

        <p className="text-center mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          「{task.title}」
        </p>

        {/* First step input */}
        <div className="mb-6">
          <label className="flex items-center gap-2 mb-2 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            <Lightbulb size={16} />
            第一步做什么？
          </label>
          <textarea
            autoFocus
            value={firstStep}
            onChange={(e) => setFirstStep(e.target.value)}
            placeholder="例如：打开文档，写下大纲..."
            rows={2}
            className="w-full px-4 py-3 rounded-[12px] resize-none focus:outline-none transition-all"
            style={{
              background: 'var(--color-bg-surface-2)',
              color: 'var(--color-text-primary)',
              border: '2px solid var(--color-border-strong)',
            }}
          />
          <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            💡 写下具体的第一步能显著降低启动心理门槛
          </p>
        </div>

        {/* Quick start options */}
        <div className="flex gap-2 mb-6">
          {[15, 25, 45].map((mins) => (
            <button
              key={mins}
              onClick={() => onStart(firstStep)}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105"
              style={{
                background: 'var(--color-accent-soft)',
                color: 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
              }}
            >
              {mins} 分钟
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-[12px] font-medium transition-all hover:scale-[1.02]"
            style={{
              background: 'var(--color-bg-surface-1)',
              color: 'var(--color-text-primary)',
              border: '2px solid var(--color-border-strong)',
              boxShadow: '4px 4px 0px var(--color-border-strong)',
            }}
          >
            稍后再说
          </button>
          <button
            onClick={() => onStart(firstStep)}
            className="flex-1 py-3 rounded-[12px] font-medium transition-all hover:scale-[1.02]"
            style={{
              background: 'var(--color-accent)',
              color: 'white',
              border: '2px solid var(--color-border-strong)',
              boxShadow: '4px 4px 0px var(--color-border-strong)',
            }}
          >
            开始专注
          </button>
        </div>
      </div>
    </div>
  )
}

// Now Engine Card - shows one recommended task
export default function NowEngineCard() {
  const navigate = useNavigate()
  const getRecommendedTask = useAppStore((s) => s.getRecommendedTask)
  const setCurrentFocusTaskId = useAppStore((s) => s.setCurrentFocusTaskId)
  const updateTask = useAppStore((s) => s.updateTask)

  const [showLaunchBoost, setShowLaunchBoost] = useState(false)

  const recommendedTask = getRecommendedTask()

  const handleStart = async (firstStep: string) => {
    setShowLaunchBoost(false)

    if (!recommendedTask) return

    // Save the first step to the task
    if (firstStep && firstStep.trim()) {
      await updateTask(recommendedTask.id, { firstStep: firstStep.trim() })
    }

    // Set current focus task and navigate to focus
    setCurrentFocusTaskId(recommendedTask.id)
    navigate('/focus')
  }

  // No tasks - empty state
  if (!recommendedTask) {
    return (
      <div
        className="p-6 rounded-[24px] text-center"
        style={{
          background: 'var(--color-bg-surface-1)',
          border: '2px solid var(--color-border-strong)',
          boxShadow: '4px 4px 0px var(--color-border-strong)',
        }}
      >
        <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-accent-soft)' }}>
          <Sparkles size={24} style={{ color: 'var(--color-accent)' }} />
        </div>
        <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          今天很轻松！
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          还没有待办任务。去「任务」页面添加一个吧。
        </p>
      </div>
    )
  }

  const priorityColors: Record<number, string> = {
    1: 'var(--color-text-muted)',
    2: 'var(--color-blue)',
    3: 'var(--color-text-secondary)',
    4: 'var(--color-orange)',
    5: 'var(--color-red)',
  }

  return (
    <>
      <div
        className="p-6 rounded-[24px] transition-all hover:shadow-lg"
        style={{
          background: 'var(--color-bg-surface-1)',
          border: '2px solid var(--color-border-strong)',
          boxShadow: '4px 4px 0px var(--color-border-strong)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-accent-soft)' }}
            >
              <Sparkles size={16} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                现在该做什么
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Trace 为你推荐的首要任务
              </p>
            </div>
          </div>
        </div>

        {/* Recommended Task */}
        <div
          className="p-4 rounded-[16px] mb-4 transition-all hover:scale-[1.01]"
          style={{
            background: 'var(--color-bg-surface-2)',
            border: '2px solid var(--color-border-strong)',
            borderLeft: `4px solid ${priorityColors[recommendedTask.priority] || priorityColors[3]}`,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium mb-1 truncate" style={{ color: 'var(--color-text-primary)' }}>
                {recommendedTask.title}
              </h4>
              {recommendedTask.firstStep && (
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  📝 第一步：{recommendedTask.firstStep}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {recommendedTask.estimatedMinutes > 0 && (
                  <span>⏱️ {recommendedTask.estimatedMinutes} 分钟</span>
                )}
                {recommendedTask.project && (
                  <span>📁 {recommendedTask.project}</span>
                )}
                {recommendedTask.emotionalTag && (
                  <span>
                    {recommendedTask.emotionalTag === 'resist' ? '😰 想逃避' :
                     recommendedTask.emotionalTag === 'easy' ? '😊 轻松' : '😐 一般'}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowLaunchBoost(true)}
              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{
                background: 'var(--color-accent)',
                color: 'white',
                border: '2px solid var(--color-border-strong)',
                boxShadow: '4px 4px 0px var(--color-border-strong)',
              }}
            >
              <Play size={20} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Why this task hint */}
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <Lightbulb size={14} />
          <span>基于优先级和截止日期智能推荐</span>
        </div>
      </div>

      <LaunchBoostModal
        isOpen={showLaunchBoost}
        task={recommendedTask}
        onClose={() => setShowLaunchBoost(false)}
        onStart={handleStart}
      />
    </>
  )
}
