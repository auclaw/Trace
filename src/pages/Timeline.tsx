import { useState, useEffect, useMemo } from 'react'
import { Clock, Play, Pause, Tag, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

const CATEGORY_COLORS: Record<string, string> = {
  Work: '#79BEEB',
  Meeting: '#D4C4FB',
  Break: '#A8E6CF',
  Learning: '#FFD3B6',
  Other: '#9E9899',
}

// Generate time blocks for the day
const generateTimeBlocks = (_date: Date) => {
  const blocks = [
    { startHour: 9, startMin: 0, endHour: 10, endMin: 30, category: 'Work', title: 'Project planning', app: 'VS Code' },
    { startHour: 10, startMin: 30, endHour: 11, endMin: 0, category: 'Meeting', title: 'Team standup', app: 'Zoom' },
    { startHour: 11, startMin: 0, endHour: 12, endMin: 30, category: 'Work', title: 'Feature development', app: 'VS Code' },
    { startHour: 12, startMin: 30, endHour: 13, endMin: 15, category: 'Break', title: 'Lunch break', app: '' },
    { startHour: 13, startMin: 15, endHour: 14, endMin: 45, category: 'Learning', title: 'Documentation review', app: 'Chrome' },
    { startHour: 14, startMin: 45, endHour: 15, endMin: 30, category: 'Meeting', title: 'Design review', app: 'Figma' },
    { startHour: 15, startMin: 30, endHour: 17, endMin: 0, category: 'Work', title: 'Bug fixing', app: 'VS Code' },
  ]
  return blocks
}

export default function Timeline() {
  const loadActivities = useAppStore((s) => s.loadActivities)
  const dailyGoalMinutes = useAppStore((s) => s.dailyGoalMinutes)
  const [loading, setLoading] = useState(true)
  const [isTracking, setIsTracking] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const todayMinutes = useMemo(() => {
    const blocks = generateTimeBlocks(selectedDate)
    return blocks.reduce((sum, b) => {
      const duration = (b.endHour * 60 + b.endMin) - (b.startHour * 60 + b.startMin)
      return sum + duration
    }, 0)
  }, [selectedDate])

  const goalProgress = dailyGoalMinutes > 0 ? Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100)) : 0
  const timeBlocks = generateTimeBlocks(selectedDate)

  useEffect(() => {
    loadActivities().finally(() => setLoading(false))
  }, [loadActivities])

  const formatTime = (hour: number, min: number) => {
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
  }

  const prevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d)
  }

  const nextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-base)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg-base)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold mb-1" style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}>
              Timeline
            </h1>
            <p className="text-sm" style={{ color: '#9E9899' }}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevDay}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: '#FFFFFF', border: '2px solid #D6D3CD' }}
            >
              <ChevronLeft size={16} style={{ color: '#5C5658' }} />
            </button>
            <button
              onClick={nextDay}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: '#FFFFFF', border: '2px solid #D6D3CD' }}
            >
              <ChevronRight size={16} style={{ color: '#5C5658' }} />
            </button>
          </div>
        </div>

        {/* Top Summary Card */}
        <div
          className="p-5 rounded-2xl mb-6"
          style={{
            background: '#FFFFFF',
            border: '2px solid #D6D3CD',
            boxShadow: '4px 4px 0px #D6D3CD',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #79BEEB 0%, #5AACDF 100%)' }}
              >
                <Clock size={20} color="white" />
              </div>
              <div>
                <p className="text-xs" style={{ color: '#9E9899' }}>Total Focus</p>
                <p className="text-xl font-bold" style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}>
                  {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs" style={{ color: '#9E9899' }}>Goal Progress</p>
                <p className="text-sm font-semibold" style={{ color: '#A8E6CF' }}>{goalProgress}%</p>
              </div>
              <div className="w-32 h-3 rounded-full" style={{ background: '#F5F1EA' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${goalProgress}%`,
                    background: 'linear-gradient(90deg, #79BEEB 0%, #A8E6CF 100%)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Active Tracking Indicator */}
          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{
              background: isTracking ? 'rgba(168, 230, 207, 0.12)' : '#FAF7F2',
              border: isTracking ? '2px solid #A8E6CF' : '2px solid #E8E6E1',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ background: isTracking ? '#A8E6CF' : '#9E9899' }}
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: isTracking ? '#A8E6CF' : '#9E9899' }}>
                  {isTracking ? 'TRACKING NOW' : 'TRACKING PAUSED'}
                </p>
                {isTracking && (
                  <p className="text-xs mt-0.5" style={{ color: '#5C5658' }}>
                    Current: VS Code - Dashboard.tsx
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsTracking(!isTracking)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
              style={{
                background: isTracking ? '#FF8C82' : '#A8E6CF',
                boxShadow: isTracking ? '2px 2px 0px rgba(255, 140, 130, 0.3)' : '2px 2px 0px rgba(168, 230, 207, 0.3)',
              }}
            >
              {isTracking ? (
                <Pause size={18} color="white" />
              ) : (
                <Play size={18} color="white" />
              )}
            </button>
          </div>
        </div>

        {/* Time Blocks Timeline */}
        <div
          className="p-6 rounded-2xl"
          style={{
            background: '#FFFFFF',
            border: '2px solid #D6D3CD',
            boxShadow: '4px 4px 0px #D6D3CD',
          }}
        >
          <h3 className="text-base font-semibold mb-6" style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}>
            Today's Activity
          </h3>

          <div className="relative">
            {/* Time column */}
            <div className="flex">
              <div className="w-16 flex-shrink-0 pr-4">
                {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                  <div key={hour} className="h-12 flex items-start">
                    <span className="text-xs font-mono" style={{ color: '#9E9899' }}>
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Blocks area */}
              <div className="flex-1 relative">
                {/* Hour grid lines */}
                {Array.from({ length: 12 }, (_, i) => i).map((i) => (
                  <div
                    key={i}
                    className="h-12 border-t"
                    style={{ borderColor: i % 2 === 0 ? '#F5F1EA' : 'transparent' }}
                  />
                ))}

                {/* Activity blocks */}
                {timeBlocks.map((block, i) => {
                  const topOffset = (block.startHour - 8) * 48 + (block.startMin / 60) * 48
                  const height = ((block.endHour - block.startHour) * 60 + (block.endMin - block.startMin)) / 60 * 48
                  const color = CATEGORY_COLORS[block.category] || '#9E9899'

                  return (
                    <div
                      key={i}
                      className="absolute left-0 right-4 rounded-xl p-3 transition-all hover:scale-[1.01] hover:z-10 cursor-pointer"
                      style={{
                        top: `${topOffset}px`,
                        height: `${height - 4}px`,
                        background: `${color}25`,
                        borderLeft: `4px solid ${color}`,
                        borderRight: '2px solid #E8E6E1',
                        borderTop: '2px solid #E8E6E1',
                        borderBottom: '2px solid #E8E6E1',
                      }}
                    >
                      <div className="flex items-center justify-between h-full">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#3A3638' }}>{block.title}</p>
                          {block.app && (
                            <p className="text-xs" style={{ color: '#9E9899' }}>{block.app}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono" style={{ color: '#9E9899' }}>
                            {formatTime(block.startHour, block.startMin)} - {formatTime(block.endHour, block.endMin)}
                          </span>
                          <Tag size={12} style={{ color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
