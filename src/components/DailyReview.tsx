import { useState } from 'react'
import { Moon, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Daily Review - end of day reflection
export default function DailyReview({
  isOpen,
  onComplete,
}: {
  isOpen: boolean
  onComplete: () => void
}) {
  const tasks = useAppStore((s) => s.tasks)
  const activities = useAppStore((s) => s.activities)
  const setLastDailyReviewDate = useAppStore((s) => s.setLastDailyReviewDate)
  const setTomorrowTopTaskId = useAppStore((s) => s.setTomorrowTopTaskId)

  const [step, setStep] = useState(0)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)

  if (!isOpen) return null

  const completedTasks = tasks.filter((t) => t.status === 'completed')
  const pendingTasks = tasks.filter((t) => t.status !== 'completed')
  const todayMinutes = activities.reduce((sum, a) => sum + (a.duration || 0), 0)
  const todayHours = Math.floor(todayMinutes / 60)
  const todayMins = Math.round(todayMinutes % 60)

  const handleComplete = () => {
    if (selectedTask) {
      setTomorrowTopTaskId(selectedTask)
    }
    setLastDailyReviewDate(todayStr())
    onComplete()
    setStep(0)
  }

  // Step 1: Summary
  if (step === 0) {
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
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full"
            style={{ background: 'var(--color-accent-soft)' }}>
            <Moon size={36} style={{ color: 'var(--color-accent)' }} />
          </div>

          <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: 'var(--color-text-primary)' }}>
            今天做得不错！
          </h2>

          <p className="text-center mb-8" style={{ color: 'var(--color-text-muted)' }}>
            让我们快速回顾一下今天
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-[16px] text-center" style={{ background: 'var(--color-bg-surface-2)', border: '1px solid var(--color-border-subtle)' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-accent)' }}>
                {completedTasks.length}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                任务完成
              </div>
            </div>
            <div className="p-4 rounded-[16px] text-center" style={{ background: 'var(--color-bg-surface-2)', border: '1px solid var(--color-border-subtle)' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-blue)' }}>
                {todayHours}h {todayMins}m
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                专注时长
              </div>
            </div>
          </div>

          {/* Quick wins list */}
          {completedTasks.length > 0 && (
            <div className="mb-8">
              <div className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                今日成就
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {completedTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-[12px]"
                    style={{ background: 'var(--color-bg-surface-2)', border: '1px solid var(--color-border-subtle)' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--color-green)' }} />
                    <span className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setStep(1)}
            className="w-full py-4 rounded-[12px] font-medium transition-all hover:scale-[1.02]"
            style={{
              background: 'var(--color-accent)',
              color: 'white',
              border: '1px solid var(--color-border-subtle)',
              boxShadow: '0 8px 30px rgba(121, 190, 235, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            继续
          </button>
        </div>
      </div>
    )
  }

  // Step 2: Tomorrow's top task
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
            明天的首要任务
          </h2>

          <p className="text-sm text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>
            选一个明天最想完成的任务，睡醒直接开工
          </p>

          {pendingTasks.length > 0 ? (
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {pendingTasks.slice(0, 5).map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task.id)}
                  className="w-full p-3 rounded-[16px] text-left transition-all hover:scale-[1.01]"
                  style={{
                    background: selectedTask === task.id ? 'var(--color-accent-soft)' : 'var(--color-bg-surface-2)',
                    border: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        background: selectedTask === task.id ? 'var(--color-accent)' : 'var(--color-border-subtle)',
                      }}
                    >
                      {selectedTask === task.id && <CheckCircle2 size={12} color="white" />}
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {task.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-[16px] mb-6 text-center" style={{ background: 'var(--color-bg-surface-2)', border: '1px solid var(--color-border-subtle)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                没有待续任务，明天好好休息吧！
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleComplete}
              className="flex-1 py-3 rounded-[12px] font-medium transition-all hover:scale-[1.02]"
              style={{
                background: 'var(--color-bg-surface-1)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-subtle)',
                boxShadow: '0 8px 30px rgba(121, 190, 235, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              跳过
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 py-3 rounded-[12px] font-medium transition-all hover:scale-[1.02]"
              style={{
                background: 'var(--color-accent)',
                color: 'white',
                border: '1px solid var(--color-border-subtle)',
                boxShadow: '0 8px 30px rgba(121, 190, 235, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              完成复盘
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
