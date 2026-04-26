import { useState } from 'react'
import { Sun, Calendar } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Morning Ritual - daily onboarding flow
export default function MorningRitual({
  isOpen,
  onComplete,
}: {
  isOpen: boolean
  onComplete: () => void
}) {
  const tasks = useAppStore((s) => s.tasks)
  const getRecommendedTask = useAppStore((s) => s.getRecommendedTask)
  const setLastMorningRitualDate = useAppStore((s) => s.setLastMorningRitualDate)

  const [step, setStep] = useState(0)
  const [firstAction, setFirstAction] = useState('')

  if (!isOpen) return null

  const pendingTasks = tasks.filter((t) => t.status !== 'completed')
  const recommendedTask = getRecommendedTask()

  const handleComplete = () => {
    setLastMorningRitualDate(todayStr())
    onComplete()
    setStep(0)
  }

  // Greeting step
  if (step === 0) {
    const hour = new Date().getHours()
    let greeting = '早上好！'
    if (hour >= 12 && hour < 14) greeting = '中午好！'
    if (hour >= 14) greeting = '下午好！'

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div
          className="w-full max-w-md mx-4 p-8 rounded-[24px] text-center"
          style={{
            background: 'var(--color-bg-surface-1)',
            border: '2px solid var(--color-border-strong)',
            boxShadow: '4px 4px 0px var(--color-border-strong)',
          }}
        >
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full"
            style={{ background: 'var(--color-accent-soft)' }}>
            <Sun size={36} style={{ color: 'var(--color-accent)' }} />
          </div>

          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            {greeting}
          </h2>

          <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            让我们花 30 秒为今天做好准备
          </p>

          <div className="space-y-3 mb-8 text-left">
            <div className="flex items-center gap-3 p-3 rounded-[16px]" style={{ background: 'var(--color-bg-surface-2)', border: '1px solid var(--color-border-subtle)' }}>
              <Calendar size={18} style={{ color: 'var(--color-accent)' }} />
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  今天有 {pendingTasks.length} 个待办任务
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {pendingTasks.length > 0 ? '我们一个一个来完成' : '享受轻松的一天吧'}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full py-4 rounded-[12px] font-medium transition-all hover:scale-[1.02]"
            style={{
              background: 'var(--color-accent)',
              color: 'white',
              border: 'none',
              boxShadow: '4px 4px 0px var(--color-border-strong)',
            }}
          >
            开始
          </button>
        </div>
      </div>
    )
  }

  // Today's priority step
  if (step === 1) {
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
          <h2 className="text-xl font-bold mb-2 text-center" style={{ color: 'var(--color-text-primary)' }}>
            今天的首要任务
          </h2>

          <p className="text-sm text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>
            先完成这个，今天就不会跑偏
          </p>

          {recommendedTask ? (
            <div
              className="p-4 rounded-xl mb-6"
              style={{
                background: 'var(--color-bg-surface-1)',
                border: '1px solid var(--color-accent-soft)',
                borderLeft: '3px solid var(--color-accent)',
              }}
            >
              <div className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {recommendedTask.title}
              </div>
              {recommendedTask.estimatedMinutes > 0 && (
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  ⏱️ 预估 {recommendedTask.estimatedMinutes} 分钟
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-xl mb-6 text-center" style={{ background: 'var(--color-bg-surface-1)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                今天没有待办任务，享受自由时光吧！
              </p>
            </div>
          )}

          {/* First action input */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              你的第一步是？
            </label>
            <input
              autoFocus
              value={firstAction}
              onChange={(e) => setFirstAction(e.target.value)}
              placeholder="例如：打开项目文件夹..."
              className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all"
              style={{
                background: 'var(--color-bg-surface-1)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-subtle)',
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleComplete}
              className="flex-1 py-3 rounded-xl font-medium transition-all hover:opacity-80"
              style={{
                background: 'var(--color-bg-surface-2)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              跳过
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 py-3 rounded-xl font-medium transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-gradient, var(--color-accent)))',
                color: 'white',
                boxShadow: 'var(--shadow-accent)',
              }}
            >
              准备好了
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
