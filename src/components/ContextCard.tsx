import { Play, BrainCircuit, Coffee, Clock } from 'lucide-react'
import { useFocusStore } from '../services/focusDetection'
import { scoreAndSortTasks } from '../services/taskRecommendation'
import type { Task, ActivityCategory } from '../services/dataService'

const PRIORITY_COLORS: Record<number, string> = {
  1: '#9E9899',
  2: '#79BEEB',
  3: '#FFD3B6',
  4: '#FF8C82',
  5: '#FF5252',
}

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  '开发': '#79BEEB',
  '工作': '#79BEEB',
  '会议': '#D4C4FB',
  '休息': '#A8E6CF',
  '学习': '#FFD3B6',
  '娱乐': '#FFB3C6',
  '运动': '#FFE5B4',
  '阅读': '#B4D4FF',
  '其他': '#9E9899',
}

interface ContextCardProps {
  tasks: Task[]
  todayBlocks: any[]
  wasInterrupted: boolean | null
  recentEndTime: Date | null
  onStartFocus: (task: Task) => void
  className?: string
}

export default function ContextCard({
  tasks,
  todayBlocks,
  wasInterrupted,
  recentEndTime,
  onStartFocus,
  className = '',
}: ContextCardProps) {
  const continuousFocusMinutes = useFocusStore(state => state.getContinuousFocusMinutes())
  const isOnBreak = useFocusStore(state => state.isOnBreak)
  const pendingEvent = useFocusStore(state => state.pendingEvent)
  const handleUserChoice = useFocusStore(state => state.handleUserChoice)

  const now = new Date()

  // ============================================
  // 🔔 状态 1: 检测到中断事件 (分心检测)
  // ============================================
  if (pendingEvent) {
    return (
      <div
        className={`rounded-2xl p-5 ${className}`}
        style={{
          background: '#FFFFFF',
          border: '2px solid #D6D3CD',
          boxShadow: '4px 4px 0px #D6D3CD',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="font-semibold text-sm" style={{ color: '#B45309' }}>
            检测到使用其他应用
          </h3>
        </div>
        <p className="text-sm mb-4" style={{ color: '#5C5658' }}>
          当前打开：<span className="font-medium" style={{ color: '#3A3638' }}>{pendingEvent.appName}</span>
          <span className="ml-2 text-xs" style={{ color: '#9E9899' }}>({pendingEvent.durationMinutes} 分钟)</span>
        </p>
        <p className="text-xs mb-4" style={{ color: '#9E9899' }}>
          这段时间你在做什么？
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleUserChoice('work', pendingEvent.id)}
            className="flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#34D39920', color: '#059669' }}
          >
            💻 工作中
          </button>
          <button
            onClick={() => handleUserChoice('break', pendingEvent.id)}
            className="flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#79BEEB20', color: '#0284C7' }}
          >
            ☕ 休息
          </button>
          <button
            onClick={() => handleUserChoice('distraction', pendingEvent.id)}
            className="flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#F8717120', color: '#DC2626' }}
          >
            🙈 分心了
          </button>
        </div>
      </div>
    )
  }

  // ============================================
  // ⏰ 状态 2: 时间段中断后刚回来
  // ============================================
  if (wasInterrupted && recentEndTime) {
    const lastBlock = [...todayBlocks].sort(
      (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    )[0]
    const minutesAgo = Math.round((now.getTime() - recentEndTime.getTime()) / 1000 / 60)

    return (
      <div
        className={`rounded-2xl p-5 ${className}`}
        style={{
          background: '#FFFFFF',
          border: '2px solid #D6D3CD',
          boxShadow: '4px 4px 0px #D6D3CD',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
          <h3 className="font-semibold text-sm" style={{ color: '#3B82F6' }}>
            欢迎回来 👋
          </h3>
          <span className="text-xs ml-auto" style={{ color: '#9E9899' }}>
            离开 {minutesAgo} 分钟
          </span>
        </div>
        {lastBlock && (
          <div
            className="p-4 rounded-xl mb-4"
            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
          >
            <p className="text-xs mb-1" style={{ color: '#60A5FA' }}>上次进行的任务：</p>
            <p className="text-sm font-medium" style={{ color: '#1E40AF' }}>
              {lastBlock.title}
            </p>
          </div>
        )}
        <button
          onClick={() => onStartFocus(tasks[0] || { title: '继续专注', id: 'temp' })}
          className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          style={{ background: '#3B82F6' }}
        >
          <Play size={16} /> 继续专注
        </button>
      </div>
    )
  }

  // ============================================
  // 🔥 状态 3: 正在连续专注中
  // ============================================
  if (continuousFocusMinutes > 0 && !isOnBreak) {
    return (
      <div
        className={`rounded-2xl p-5 ${className}`}
        style={{
          background: '#FFFFFF',
          border: '2px solid #D6D3CD',
          boxShadow: '4px 4px 0px #D6D3CD',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
          <h3 className="font-semibold text-sm" style={{ color: '#059669' }}>
            🔥 专注状态
          </h3>
        </div>
        <div className="text-center py-5 mb-4" style={{ background: '#ECFDF5', borderRadius: '12px' }}>
          <p className="text-4xl font-bold mb-1" style={{ color: '#047857' }}>
            {continuousFocusMinutes}
          </p>
          <p className="text-xs" style={{ color: '#6EE7B7' }}>分钟</p>
        </div>
        <button
          onClick={() => useFocusStore.getState().startBreak(5)}
          className="w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          style={{ background: '#A8E6CF30', color: '#2D5A4A' }}
        >
          <Coffee size={16} /> 休息 5 分钟
        </button>
      </div>
    )
  }

  // ============================================
  // 💡 状态 4: 空闲中 - AI 推荐接下来做什么
  // ============================================
  const recommendedTasks = scoreAndSortTasks(tasks, undefined, 60).slice(0, 2)

  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: '#FFFFFF',
        border: '2px solid #D6D3CD',
        boxShadow: '4px 4px 0px #D6D3CD',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <BrainCircuit size={18} style={{ color: '#F59E0B' }} />
        <span className="text-base font-semibold" style={{ color: '#D97706' }}>
          智能建议
        </span>
      </div>

      {recommendedTasks.length > 0 ? (
        <div className="space-y-3">
          {recommendedTasks.map(({ task, reason }) => (
            <div
              key={task.id}
              className="p-4 rounded-xl transition-all hover:shadow-md"
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
            >
              <div className="flex items-start gap-2 mb-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                  style={{ background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[1] }}
                  title={`优先级: ${task.priority}`}
                />
                <p className="text-sm font-medium flex-1 truncate" style={{ color: '#3A3638' }}>
                  {task.title}
                </p>
              </div>
              <p className="text-xs mb-3 ml-4" style={{ color: '#92400E' }}>
                💡 {reason}
              </p>
              <div className="flex items-center gap-2 mb-3 ml-4">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: `${CATEGORY_COLORS[task.project as ActivityCategory] || CATEGORY_COLORS['其他']}30`,
                    color: CATEGORY_COLORS[task.project as ActivityCategory] || CATEGORY_COLORS['其他'],
                  }}
                >
                  {task.project || '待分类'}
                </span>
                {task.estimatedMinutes && (
                  <span className="text-xs flex items-center gap-1" style={{ color: '#9E9899' }}>
                    <Clock size={10} />
                    {task.estimatedMinutes} 分钟
                  </span>
                )}
              </div>
              <button
                className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2.5 rounded-lg font-semibold transition-all hover:opacity-80"
                style={{ background: '#34D399', color: 'white' }}
                onClick={() => onStartFocus(task)}
              >
                <Play size={12} /> 开始专注
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8" style={{ background: '#FAF8F5', borderRadius: '12px' }}>
          <p className="text-lg mb-1">🎉</p>
          <p className="text-sm font-medium" style={{ color: '#3A3638' }}>
            今日任务全部完成
          </p>
          <p className="text-xs mt-1" style={{ color: '#9E9899' }}>
            享受你的自由时光吧！
          </p>
        </div>
      )}
    </div>
  )
}
