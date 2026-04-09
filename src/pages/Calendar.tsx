import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Calendar view is now integrated into the Planner page.
// This component redirects to /planner with the calendar view.

export default function Calendar() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/planner?view=calendar', { replace: true })
  }, [navigate])

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
        <span className="text-sm text-[var(--color-text-muted)]">跳转到日历视图...</span>
      </div>
    </div>
  )
}
