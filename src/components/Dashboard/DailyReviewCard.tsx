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
    if (efficiencyScore >= 80) return { text: 'Excellent focus today!', emoji: '🌟', color: '#A8E6CF' }
    if (efficiencyScore >= 60) return { text: 'Good progress, keep going!', emoji: '💪', color: '#79BEEB' }
    if (efficiencyScore >= 40) return { text: 'Getting better each day', emoji: '🌱', color: '#FFD3B6' }
    return { text: 'Tomorrow is a fresh start', emoji: '🌅', color: '#FF8C82' }
  }

  const feedback = getFeedback()

  return (
    <div
      className="p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px]"
      onClick={() => navigate('/analytics')}
      style={{
        background: '#FFFFFF',
        border: '2px solid #D6D3CD',
        boxShadow: '4px 4px 0px #D6D3CD',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: '#D4C4FB' }} />
          <h3
            className="text-base font-semibold"
            style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}
          >
            Daily Review
          </h3>
        </div>
        <ChevronRight size={16} style={{ color: '#9E9899' }} />
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
            style={{ color: '#79BEEB', fontFamily: 'Quicksand, sans-serif' }}
          >
            {Math.floor(totalMinutes / 60)}h
          </p>
          <p className="text-xs" style={{ color: '#9E9899' }}>
            Focus Time
          </p>
        </div>
        <div className="text-center">
          <p
            className="text-2xl font-bold"
            style={{ color: '#A8E6CF', fontFamily: 'Quicksand, sans-serif' }}
          >
            {efficiencyScore}%
          </p>
          <p className="text-xs" style={{ color: '#9E9899' }}>
            Efficiency
          </p>
        </div>
        <div className="text-center">
          <p
            className="text-2xl font-bold"
            style={{ color: '#D4C4FB', fontFamily: 'Quicksand, sans-serif' }}
          >
            {completedTasks}
          </p>
          <p className="text-xs" style={{ color: '#9E9899' }}>
            Tasks Done
          </p>
        </div>
      </div>
    </div>
  )
}
