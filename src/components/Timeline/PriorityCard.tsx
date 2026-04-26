import { Play, MoreHorizontal } from 'lucide-react'
import type { Task } from '../../services/dataService'

interface PriorityCardProps {
  task: Task
  onStartFocus: () => void
}

export default function PriorityCard({ task, onStartFocus }: PriorityCardProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: '#FFFFFF',
        border: '2px solid #D4C4FB',
        boxShadow: '4px 4px 0px rgba(212, 196, 251, 0.3)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: '#D4C4FB30', color: '#D4C4FB' }}
          >
            STRATEGIC PLAN
          </span>
        </div>
      </div>
      <h3 className="font-bold mb-4" style={{ color: '#3A3638', fontSize: '15px' }}>
        {task.title}
      </h3>
      <div className="flex items-center gap-2">
        <button
          onClick={onStartFocus}
          className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
          style={{ background: '#D4C4FB' }}
        >
          <Play size={14} />
          Focus Session
        </button>
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-gray-100"
          style={{ background: '#F5F1EA', border: '2px solid #D6D3CD' }}
        >
          <MoreHorizontal size={14} style={{ color: '#5C5658' }} />
        </button>
      </div>
    </div>
  )
}
