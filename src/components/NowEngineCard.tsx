import { useState } from 'react'
import { Sparkles, Play, RefreshCw, Clock, Plus, Zap, CalendarClock } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import FocusModal from './FocusModal'

// Mock AI recommendation engine
const getAIRecForTask = (tasks: any[]) => {
  const pendingTasks = tasks.filter((t) => t.status !== 'completed')
  if (pendingTasks.length === 0) return null

  // Simple priority-based recommendation
  const sorted = [...pendingTasks].sort((a, b) => (b.priority || 0) - (a.priority || 0))
  return sorted[0]
}

const generateFirstStep = (taskName: string) => {
  const steps = [
    `Start by opening the project files for "${taskName}"`,
    `First: Spend 5 minutes planning your approach for this task`,
    `Let's break this down — start with the first sub-task`,
    `Clear your workspace and focus on just this one thing now`,
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
      label: hours > 0 ? `Est. ${hours}h ${mins}m` : `Est. ${mins}m`,
    })
  }

  if (task.dueDate) {
    tags.push({
      icon: <CalendarClock size={12} />,
      label: 'Due soon',
    })
  }

  if (task.priority && task.priority >= 4) {
    tags.push({
      icon: <Zap size={12} />,
      label: 'High priority',
    })
  }

  return tags
}

export default function NowEngineCard() {
  const tasks = useAppStore((s) => s.tasks)
  const [focusModalOpen, setFocusModalOpen] = useState(false)
  const [_, setRefreshKey] = useState(0)

  const recommendedTask = getAIRecForTask(tasks)
  const metaTags = recommendedTask ? getMetaTags(recommendedTask) : []

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
            No tasks yet
          </h3>
          <p
            className="text-sm mb-6"
            style={{ color: '#9E9899' }}
          >
            Create your first task and let AI guide your day
          </p>
          <button
            className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
            style={{
              background: '#79BEEB',
              boxShadow: '4px 4px 0px #D6D3CD',
            }}
          >
            <Plus size={16} className="inline mr-2" />
            Create Task
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
          border: '2px solid #79BEEB',
          borderRadius: '24px',
          boxShadow: '4px 4px 0px rgba(121,190,235,0.4)',
        }}
      >
        {/* NOW Label */}
        <div className="mb-4">
          <span
            className="text-xs font-semibold tracking-wider uppercase"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              color: '#79BEEB',
            }}
          >
            Now →
          </span>
        </div>

        {/* Task Name */}
        <h2
          className="text-2xl font-bold mb-3"
          style={{
            fontFamily: 'Quicksand, sans-serif',
            color: '#3A3638',
          }}
        >
          {recommendedTask.title}
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

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFocusModalOpen(true)}
            className="flex-1 px-6 py-3.5 rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            style={{
              background: '#D4C4FB',
              color: '#4A3A6A',
              boxShadow: '4px 4px 0px #D6D3CD',
            }}
          >
            <Play size={16} />
            Start Focus
          </button>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="px-4 py-3.5 rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            style={{
              background: '#FFFFFF',
              border: '2px solid #D6D3CD',
              boxShadow: '4px 4px 0px #D6D3CD',
              color: '#3A3638',
            }}
          >
            <RefreshCw size={16} />
            Another
          </button>
        </div>
      </div>

      <FocusModal isOpen={focusModalOpen} onClose={() => setFocusModalOpen(false)} />
    </>
  )
}
