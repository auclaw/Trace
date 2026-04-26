import type { TimeBlock, ActivityCategory } from '../../services/dataService'

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

interface TimeBlockProps {
  block: TimeBlock
  top: number
  height: number
  isSelected: boolean
  isDragging: boolean
  onMouseDown?: (e: React.MouseEvent) => void
  onClick?: () => void
  onResizeTop?: (e: React.MouseEvent) => void
  onResizeBottom?: (e: React.MouseEvent) => void
}

export default function TimeBlock({
  block,
  top,
  height,
  isSelected,
  isDragging,
  onMouseDown,
  onClick,
  onResizeTop,
  onResizeBottom,
}: TimeBlockProps) {
  const color = CATEGORY_COLORS[block.category] || CATEGORY_COLORS['其他']
  const endHour = new Date(block.endTime).getHours() + new Date(block.endTime).getMinutes() / 60
  const endMin = Math.round((endHour % 1) * 60)

  return (
    <div
      className={`absolute left-12 right-3 rounded-xl cursor-move transition-all ${
        isSelected ? 'ring-2 ring-offset-2' : ''
      } ${isDragging ? 'opacity-90 z-30 shadow-lg scale-[1.01]' : 'z-10 hover:shadow-md hover:scale-[1.005]'}`}
      style={{
        top,
        height,
        background: `linear-gradient(135deg, ${color} 0%, ${color}E0 100%)`,
        boxShadow: isSelected
          ? `0 0 0 2px ${color}, 4px 4px 12px rgba(0,0,0,0.15)`
          : '2px 2px 8px rgba(0,0,0,0.08)',
        '--tw-ring-color': color,
      } as React.CSSProperties}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      {/* Left Dot Indicator */}
      <div
        className="absolute left-1 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white/50"
        style={{ background: color, boxShadow: '0 0 0 2px rgba(255,255,255,0.3)' }}
      />

      {/* Top Resize Handle */}
      {onResizeTop && (
        <div
          className="resize-handle absolute top-0 left-4 right-4 cursor-ns-resize opacity-0 hover:opacity-100 transition-all"
          style={{ height: 12 }}
          onMouseDown={onResizeTop}
        >
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/30" />
        </div>
      )}

      {/* Block Content */}
      <div className="px-6 py-3 h-full overflow-hidden flex flex-col justify-center">
        <p className="text-white text-sm font-semibold truncate drop-shadow-sm">{block.title}</p>
        <p className="text-white/70 text-xs">{block.category}</p>
      </div>

      {/* Bottom Resize Handle */}
      {onResizeBottom && (
        <div
          className="resize-handle absolute bottom-0 left-4 right-4 cursor-ns-resize opacity-0 hover:opacity-100 transition-all"
          style={{ height: 12 }}
          onMouseDown={onResizeBottom}
        >
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/30" />
        </div>
      )}

      {/* End Time Label on Right */}
      <div
        className="absolute -right-10 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md text-xs font-medium"
        style={{
          background: color,
          color: 'white',
          fontSize: '10px',
        }}
      >
        {String(Math.floor(endHour)).padStart(2, '0')}:{String(endMin).padStart(2, '0')}
      </div>
    </div>
  )
}
