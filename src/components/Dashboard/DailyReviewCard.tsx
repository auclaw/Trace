import { ChevronRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Props {
  totalMinutes: number
  efficiencyScore: number
  completedTasks: number
}

export default function DailyReviewCard({ totalMinutes, efficiencyScore, completedTasks }: Props) {
  const navigate = useNavigate()

  const getFeedback = () => {
    if (efficiencyScore >= 80) return { text: 'Excellent focus today!', emoji: '🌟', color: 'var(--color-green)' }
    if (efficiencyScore >= 60) return { text: 'Good progress, keep going!', emoji: '💪', color: 'var(--color-blue)' }
    if (efficiencyScore >= 40) return { text: 'Getting better each day', emoji: '🌱', color: 'var(--color-lemon)' }
    return { text: 'Tomorrow is a fresh start', emoji: '🌅', color: 'var(--color-coral)' }
  }

  const feedback = getFeedback()

  return (
    <div
      className="p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px]"
      onClick={() => navigate('/analytics')}
      style={{
        background: 'var(--color-bg-surface-1)',
        border: '2px solid var(--color-border-strong)',
        boxShadow: '4px 4px 0px var(--color-border-strong)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: 'var(--color-purple)' }} />
          <h3
            className="text-base font-semibold"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'Quicksand, sans-serif' }}
          >
            Daily Review
          </h3>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
      </div>

      {/* Feedback Message */}
      <div
        className="p-4 rounded-xl mb-5 text-center"
        style={{ background: `${feedback.color}20` }}
      >
        <span className="text-2xl mr-2">{feedback.emoji}</span>
        <span className="text-sm font-semibold" style={{ color: feedback.color }}>
          {feedback.text}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p
            className="text-2xl font-bold"
            style={{ color: 'var(--color-blue)', fontFamily: 'Quicksand, sans-serif' }}
          >
            {Math.floor(totalMinutes / 60)}h
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Focus Time
          </p>
        </div>
        <div className="text-center">
          <p
            className="text-2xl font-bold"
            style={{ color: 'var(--color-green)', fontFamily: 'Quicksand, sans-serif' }}
          >
            {efficiencyScore}%
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Efficiency
          </p>
        </div>
        <div className="text-center">
          <p
            className="text-2xl font-bold"
            style={{ color: 'var(--color-purple)', fontFamily: 'Quicksand, sans-serif' }}
          >
            {completedTasks}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Tasks Done
          </p>
        </div>
      </div>
    </div>
  )
}
