import { useState, useEffect } from 'react'
import { Sparkles, Play, RefreshCw, Clock, Plus, Zap, CalendarClock, Pause } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { Task } from '../services/dataService'
import FocusModal from './FocusModal'
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

const getMetaTags = (task: any) => {
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
  const getRecommendedTask = useAppStore((s) => s.getRecommendedTask)
  const [focusModalOpen, setFocusModalOpen] = useState(false)
  const [launchBoostOpen, setLaunchBoostOpen] = useState(false)
  const [_, setRefreshKey] = useState(0)

  // 🎯 全局专注状态同步
  const focusState = useAppStore((s) => s.focusState)
  const currentFocusTaskId = useAppStore((s) => s.currentFocusTaskId)
  const startFocus = useAppStore((s) => s.startFocus)
  const pauseFocus = useAppStore((s) => s.pauseFocus)
  const tasks = useAppStore((s) => s.tasks)

  const isFocusing = focusState === 'working'
  const currentFocusTask = tasks.find(t => t.id === currentFocusTaskId)
  const recommendedTask = getRecommendedTask()
  const metaTags = recommendedTask ? getMetaTags(recommendedTask) : []

  const handleStartFocus = (task: Task, durationMinutes: number) => {
    // 🎯 直接启动全局专注，自动同步到所有页面
    startFocus(task.id, durationMinutes)
  }

  if (!recommendedTask) {
    return (
      <div
        className="p-8 transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px]"
        style={{
          background: '#FFFFFF',
          border: '2px solid #79BEEB',
          borderRadius: '24px',
          boxShadow: '4px 4px 0px rgba(121,190,235,0.4)',
        }}
      >
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <Sparkles size={48} style={{ color: '#D4C4FB' }} />
          </div>
          <h3
            className="text-xl font-bold mb-2"
            style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}
          >
            还没有任务
          </h3>
          <p
            className="text-sm mb-6"
            style={{ color: '#9E9899' }}
          >
            创建第一个任务，让 AI 帮你规划一天
          </p>
          <button
            className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
            style={{
              background: '#79BEEB',
              boxShadow: '4px 4px 0px #D6D3CD',
            }}
          >
            <Plus size={16} className="inline mr-2" />
            创建任务
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className="p-8 transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px]"
        style={{
          background: '#FFFFFF',
          border: isFocusing ? '2px solid #A8E6CF' : '2px solid #79BEEB',
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
              color: isFocusing ? '#A8E6CF' : '#79BEEB',
            }}
          >
            {isFocusing ? 'Focusing 🔥' : 'Now →'}
          </span>
        </div>

        {/* Task Name - 🎯 显示当前专注任务或推荐任务 */}
        <h2
          className="text-2xl font-bold mb-3"
          style={{
            fontFamily: 'Quicksand, sans-serif',
            color: '#3A3638',
          }}
        >
          {(currentFocusTask || recommendedTask)?.title || '暂无任务'}
        </h2>

        {/* Meta Tags Row */}
        <div className="flex flex-wrap gap-4 mb-5">
          {metaTags.map((tag, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: '#5C5658' }}
            >
              {tag.icon}
              <span>{tag.label}</span>
            </div>
          ))}
        </div>

        {/* First Step Box */}
        <div
          className="p-4 mb-6 rounded-xl"
          style={{
            background: '#FAF7F2',
            border: '1px solid #EDE8E2',
          }}
        >
          <p
            className="text-sm"
            style={{ color: '#5C5658' }}
          >
            💡 {generateFirstStep(recommendedTask.title)}
          </p>
        </div>

        {/* Meta Tags - 显示当前专注任务或推荐任务 */}
        {(currentFocusTask || recommendedTask) && (
          <div className="flex flex-wrap gap-4 mb-5">
            {getMetaTags(currentFocusTask || recommendedTask).map((tag, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: '#5C5658' }}
              >
                {tag.icon}
                <span>{tag.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* First Step Box */}
        {(currentFocusTask || recommendedTask) && (
          <div
            className="p-4 mb-6 rounded-xl"
            style={{
              background: '#FAF7F2',
              border: '1px solid #EDE8E2',
            }}
          >
            <p
              className="text-sm"
              style={{ color: '#5C5658' }}
            >
              💡 {isFocusing ? '保持专注，你做得很棒！' : generateFirstStep((currentFocusTask || recommendedTask).title)}
            </p>
          </div>
        )}

        {/* Action Buttons - 🎯 专注状态自动切换按钮 */}
        <div className="flex items-center gap-3">
          {isFocusing ? (
            <button
              onClick={pauseFocus}
              className="flex-1 px-6 py-3.5 rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{
                background: '#A8E6CF',
                color: '#2D5A4A',
                boxShadow: '4px 4px 0px #D6D3CD',
              }}
            >
              <Pause size={16} />
              暂停专注
            </button>
          ) : recommendedTask ? (
            <button
              onClick={() => setLaunchBoostOpen(true)}
              className="flex-1 px-6 py-3.5 rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{
                background: '#D4C4FB',
                color: '#4A3A6A',
                boxShadow: '4px 4px 0px #D6D3CD',
              }}
            >
              <Play size={16} />
              开始专注
            </button>
          ) : null}
          {!isFocusing && recommendedTask && (
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="px-4 py-3.5 rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{
                background: '#FFFFFF',
                border: '2px solid #D6D3CD',
                boxShadow: '4px 4px 0px #D6D3CD',
                color: '#3A3638',
              }}
              title="换一个任务推荐"
            >
              <RefreshCw size={16} />
              换一个
            </button>
          )}
        </div>
      </div>

      <FocusModal isOpen={focusModalOpen} onClose={() => setFocusModalOpen(false)} />
      <LaunchBoostModal
        isOpen={launchBoostOpen}
        onClose={() => setLaunchBoostOpen(false)}
        onStartFocus={handleStartFocus}
        task={recommendedTask}
      />
    </>
  )
}
