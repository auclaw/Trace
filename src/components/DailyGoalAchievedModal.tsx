import { useEffect, useState } from 'react'
import { X, Trophy, Target, Clock, Share2 } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  totalMinutes: number
  goalMinutes: number
}

export default function DailyGoalAchievedModal({ isOpen, onClose, totalMinutes }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
    }
  }, [isOpen])

  if (!isOpen || !visible) return null

  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(58, 54, 56, 0.5)' }}>
      <div
        className="mx-4 max-w-sm w-full transition-all duration-300 scale-100"
        style={{
          background: '#FFFFFF',
          border: '2px solid #D6D3CD',
          borderRadius: '24px',
          boxShadow: '8px 8px 0px rgba(121, 190, 235, 0.3)',
        }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: '#E8E6E1' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-8" />
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FFD3B6 0%, #FF8C82 100%)' }}
            >
              <Trophy size={24} color="white" />
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F5F1EA' }}>
              <X size={16} style={{ color: '#9E9899' }} />
            </button>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold mb-2" style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}>
              You reached your daily goal!
            </h2>
            <p className="text-sm" style={{ color: '#9E9899' }}>
              Wrap up your day and see how you did
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl text-center" style={{ background: '#79BEEB20' }}>
              <Clock size={20} style={{ color: '#79BEEB' }} className="mx-auto mb-2" />
              <p className="text-2xl font-bold" style={{ color: '#2A4A5E', fontFamily: 'Quicksand, sans-serif' }}>
                {hours}h {mins}m
              </p>
              <p className="text-xs" style={{ color: '#9E9899' }}>Total Focus</p>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: '#A8E6CF20' }}>
              <Target size={20} style={{ color: '#A8E6CF' }} className="mx-auto mb-2" />
              <p className="text-2xl font-bold" style={{ color: '#2D5A4A', fontFamily: 'Quicksand, sans-serif' }}>
                100%
              </p>
              <p className="text-xs" style={{ color: '#9E9899' }}>Goal Completed</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="p-4 rounded-xl mb-6" style={{ background: '#FAF7F2' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9E9899' }}>
              Breakdown
            </p>
            <div className="space-y-3">
              {[
                { name: 'Work', color: '#79BEEB', minutes: 120, pct: 40 },
                { name: 'Meeting', color: '#D4C4FB', minutes: 60, pct: 20 },
                { name: 'Learning', color: '#FFD3B6', minutes: 50, pct: 17 },
                { name: 'Other', color: '#9E9899', minutes: 70, pct: 23 },
              ].map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                  <span className="text-xs font-medium w-16" style={{ color: '#5C5658' }}>{cat.name}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: '#E8E6E1' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${cat.pct}%`, background: cat.color }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-10 text-right" style={{ color: '#5C5658' }}>
                    {Math.floor(cat.minutes / 60)}h {cat.minutes % 60}m
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #79BEEB 0%, #5AACDF 100%)', boxShadow: '4px 4px 0px rgba(121, 190, 235, 0.3)' }}
            >
              View Full Report
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold transition-all"
              style={{ background: '#F5F1EA', color: '#5C5658' }}
            >
              <Share2 size={16} className="inline mr-2" />
              Share Achievement
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
