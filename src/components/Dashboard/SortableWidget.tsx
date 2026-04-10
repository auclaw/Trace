// Sortable Widget wrapper for dnd-kit drag-drop
// Splitted from Dashboard.tsx

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableWidgetProps {
  id: string
  children: React.ReactNode
  isOverlay?: boolean
}

export default function SortableWidget({
  id,
  children,
  isOverlay = false,
}: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    position: isOverlay ? 'fixed' as const : undefined,
    zIndex: isOverlay ? 999 : undefined,
    boxShadow: isDragging
      ? '0 12px 32px rgba(0,0,0,0.15)'
      : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-2xl ${isDragging ? 'z-10' : ''}`}
      {...attributes}
      {...listeners}
    >
      {children}
      {/* Drag handle indicator */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity px-2 py-1 rounded-full bg-black/5 text-black dark:bg-white/10 dark:text-white"
        style={{ fontSize: '10px' }}
      >
        ⋮⋮
      </div>
    </div>
  )
}
