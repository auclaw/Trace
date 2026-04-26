import React, { useState, useMemo } from 'react'
import { Sparkles, Play, RefreshCw, Clock, Plus, Zap, CalendarClock, Pause } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { Task } from '../services/dataService'
import { useFocusLogic } from './Focus/useFocusLogic'
import LaunchBoostModal from './LaunchBoostModal'

const generateFirstStep = (taskName: string) => {
  const steps = [
    `先打开与「${taskName}」相关的文件和资料`,
    `用 5 分钟规划一下这个任务的执行步骤`,
    `让我们拆解一下，从第一个子任务开始吧`,
    `清理桌面，现在只专注于这一件事`,
  ]
  return steps[Math.floor(Math.random() * steps.length)]
}

const getMetaTags = (task: Task) => {
  const tags: { icon: React.ReactNode; label: string }[] = []

  if (task.estimatedMinutes) {
    const hours = Math.floor(task.estimatedMinutes / 60)
    const mins = task.estimatedMinutes % 60
    tags.push({
      icon: <Clock size={12} />,
      label: hours > 0 ? `预计 ${hours}h ${mins}m` : `预计 ${mins}m`,
    })
  }

  if (task.dueDate) {
    tags.push({
      icon: <CalendarClock size={12} />,
      label: '即将到期',
    })
  }

  if (task.priority && task.priority >= 4) {
    tags.push({
      icon: <Zap size={12} />,
      label: '高优先级',
    })
  }

  return tags
}

export default function NowEngineCard() {
  const getRecommendedTasks = useAppStore((s) => s.getRecommendedTasks)
  const [launchBoostOpen, setLaunchBoostOpen] = useState(false)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)

  // 🎯 使用统一的 Focus Logic Hook
  const { isWorking: isFocusing, currentFocusTask, startFocus, pauseFocus } = useFocusLogic()

  const recommendedTasks = useMemo(() => getRecommendedTasks(5), [getRecommendedTasks])
  const recommendedTask = recommendedTasks[currentTaskIndex] || null

  // 🎲 切换到下一个推荐任务
  const switchToNextTask = () => {
    if (recommendedTasks.length <= 1) return
    setCurrentTaskIndex((prev) => (prev + 1) % recommendedTasks.length)
  }

  const handleStartFocus = (task: Task, durationMinutes: number) => {
    startFocus(task.id, durationMinutes)
    setLaunchBoostOpen(false)
  }

  // 空状态 - 没有任务
  if (!recommendedTask && !currentFocusTask) {
    return (
      <div
        className="p-6 transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px]"
        style={{
          background: 'var(--color-bg-surface-1)',
          border: '2px solid var(--color-blue)',
          borderRadius: '24px',
          boxShadow: '4px 4px 0px rgba(121,190,235,0.4)',
        }}
      >
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <Sparkles size={48} style={{ color: 'var(--color-purple)' }} />
          </div>
          <h3
            className="text-xl font-bold mb-2"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}
          >
            还没有任务
          </h3>
          <p
            className="text-sm mb-6"
            style={{ color: 'var(--color-text-muted)' }}
          >
            创建第一个任务，让 AI 帮你规划一天
          </p>
          <button
            className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
            style={{
              background: 'var(--color-blue)',
              boxShadow: '4px 4px 0px var(--color-border-strong)',
            }}
          >
            <Plus size={16} className="inline mr-2" />
            创建任务
          </button>
        </div>
      </div>
    )
  }

  const displayTask = currentFocusTask || recommendedTask
  const metaTags = displayTask ? getMetaTags(displayTask) : []

  return (
    <>
      <div
        className="p-6 transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px]"
        style={{
          background: 'var(--color-bg-surface-1)',
          border: isFocusing ? '2px solid var(--color-green)' : '2px solid var(--color-blue)',
          borderRadius: '24px',
          boxShadow: isFocusing
            ? '4px 4px 0px rgba(168,230,207,0.4)'
            : '4px 4px 0px rgba(121,190,235,0.4)',
        }}
      >
        {/* NOW Label */}
        <div className="mb-4">
          <span
            className="text-xs font-semibold tracking-wider uppercase"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              color: isFocusing ? 'var(--color-green)' : 'var(--color-blue)',
            }}
          >
            {isFocusing ? 'Focusing 🔥' : 'Now →'}
          </span>
        </div>

        {/* Task Name - 🎯 显示当前专注任务或推荐任务 */}
        <h2
          className="text-xl font-bold mb-2.5"
          style={{
            fontFamily: 'Quicksand, sans-serif',
            color: 'var(--color-text-primary)',
          }}
        >
          {displayTask?.title || '暂无任务'}
        </h2>

        {/* Meta Tags - 显示当前专注任务或推荐任务 */}
        {displayTask && (
          <div className="flex flex-wrap gap-4 mb-4">
            {metaTags.map((tag, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {tag.icon}
                <span>{tag.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* First Step Box */}
        {displayTask && !isFocusing && (
          <div
            className="p-3.5 mb-4 rounded-xl"
            style={{
              background: 'var(--color-bg-surface-2)',
              border: '1px solid var(--color-border-light)',
            }}
          >
            <p
              className="text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              💡 {generateFirstStep(displayTask.title)}
            </p>
          </div>
        )}

        {/* Action Buttons - 🎯 专注状态自动切换按钮 */}
        <div className="flex items-center gap-3">
          {isFocusing ? (
            <button
              onClick={pauseFocus}
              className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{
                background: 'var(--color-green)',
                color: '#2D5A4A',
                boxShadow: '4px 4px 0px var(--color-border-strong)',
              }}
            >
              <Pause size={16} />
              暂停专注
            </button>
          ) : recommendedTask ? (
            <button
              onClick={() => setLaunchBoostOpen(true)}
              className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{
                background: 'var(--color-purple)',
                color: '#4A3A6A',
                boxShadow: '4px 4px 0px var(--color-border-strong)',
              }}
            >
              <Play size={16} />
              开始专注
            </button>
          ) : null}
          {!isFocusing && recommendedTask && recommendedTasks.length > 1 && (
            <button
              onClick={switchToNextTask}
              className="px-4 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{
                background: 'var(--color-bg-surface-1)',
                border: '2px solid var(--color-border-strong)',
                boxShadow: '4px 4px 0px var(--color-border-strong)',
                color: 'var(--color-text-primary)',
              }}
              title="换一个任务"
            >
              <RefreshCw size={16} />
              换一个
            </button>
          )}
        </div>
      </div>

      <LaunchBoostModal
        isOpen={launchBoostOpen}
        onClose={() => setLaunchBoostOpen(false)}
        onStartFocus={handleStartFocus}
        task={recommendedTask}
      />
    </>
  )
}
