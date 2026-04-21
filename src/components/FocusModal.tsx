import { useState, useEffect } from 'react'
import { X, Pause, Play, RotateCcw } from 'lucide-react'

interface FocusModalProps {
  isOpen: boolean
  onClose: () => void
}

const FOCUS_OPTIONS = [5, 15, 25, 45, 60]

export default function FocusModal({ isOpen, onClose }: FocusModalProps) {
  const [selectedDuration, setSelectedDuration] = useState(25)
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [todaySessions, setTodaySessions] = useState(3)

  // 计时器逻辑
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      setTodaySessions((prev) => prev + 1)
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  const handleStart = () => {
    setTimeLeft(selectedDuration * 60)
    setIsRunning(true)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(selectedDuration * 60)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-md mx-4 rounded-3xl p-8 relative"
        style={{
          background: '#FFFFFF',
          border: '2px solid #D6D3CD',
          boxShadow: '8px 8px 0px rgba(0,0,0,0.1)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl transition-colors hover:bg-gray-100"
        >
          <X size={20} color="#9E9899" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-6" style={{ color: '#3A3638' }}>
          🍅 Focus Timer
        </h2>

        {/* Timer Display */}
        <div
          className="text-center mb-8 py-8 rounded-2xl"
          style={{ background: isRunning ? 'rgba(212, 196, 251, 0.2)' : 'rgba(212, 196, 251, 0.12)' }}
        >
          <div className="text-6xl font-bold tracking-wider" style={{ color: isRunning ? '#2D5A4A' : '#2A4A5E' }}>
            {formatTime(timeLeft)}
          </div>
          {isRunning && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#2D5A4A' }} />
              <span className="text-sm font-semibold" style={{ color: '#2D5A4A' }}>
                Focusing...
              </span>
            </div>
          )}
        </div>

        {/* Duration Selector (only show when not running) */}
        {!isRunning && (
          <div className="mb-6">
            <p className="text-sm font-semibold mb-3 text-center" style={{ color: '#5C5658' }}>
              Duration
            </p>
            <div className="flex justify-center gap-2">
              {FOCUS_OPTIONS.map((mins) => (
                <button
                  key={mins}
                  onClick={() => setSelectedDuration(mins)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: selectedDuration === mins ? '#D4C4FB' : '#F5F1EA',
                    color: selectedDuration === mins ? '#4A3A6A' : '#5C5658',
                  }}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mb-6">
          {isRunning ? (
            <>
              <button
                onClick={() => setIsRunning(false)}
                className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                style={{ background: '#B8A0E8', color: 'white' }}
              >
                <Pause size={18} className="inline mr-2" />
                Pause
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                style={{ background: '#F5F1EA', color: '#5C5658' }}
              >
                <RotateCcw size={18} className="inline mr-2" />
                Reset
              </button>
            </>
          ) : (
            <button
              onClick={handleStart}
              className="px-10 py-3 rounded-xl font-semibold transition-all hover:scale-105"
              style={{ background: '#D4C4FB', color: '#4A3A6A' }}
            >
              <Play size={18} className="inline mr-2" />
              Start
            </button>
          )}
        </div>

        {/* Today Stats */}
        <div className="text-center pt-4 border-t" style={{ borderColor: '#E8E6E1' }}>
          <p className="text-sm" style={{ color: '#9E9899' }}>
            <span className="font-bold" style={{ color: '#79BEEB' }}>{todaySessions}</span> sessions completed today
          </p>
          <p className="text-xs mt-1" style={{ color: '#9E9899' }}>
            Total focus time: {todaySessions * 25} min
          </p>
        </div>
      </div>
    </div>
  )
}
