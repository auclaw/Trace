import { useState, useCallback, useEffect, useRef } from 'react'

export interface DragState {
  isDragging: boolean
  type: 'resize-top' | 'resize-bottom' | 'move' | null
  blockId: string | null
}

export interface DragHandlers {
  startResizeTop: (e: React.MouseEvent, blockId: string, startHour: number, endHour: number) => void
  startResizeBottom: (e: React.MouseEvent, blockId: string, startHour: number, endHour: number) => void
  startMove: (e: React.MouseEvent, blockId: string, startHour: number, endHour: number) => void
  previewStart: number
  previewEnd: number
  isDragging: boolean
}

interface UseDragHandlersOptions {
  hourHeight: number
  startHour: number
  endHour: number
  containerRef: React.RefObject<HTMLDivElement>
  onUpdate: (blockId: string, startHour: number, endHour: number) => Promise<void>
}

export function useDragHandlers({
  hourHeight,
  startHour: globalStart,
  endHour: globalEnd,
  containerRef,
  onUpdate,
}: UseDragHandlersOptions): DragHandlers {
  const [state, setState] = useState<DragState>({
    isDragging: false,
    type: null,
    blockId: null,
  })

  const originalStart = useRef(0)
  const originalEnd = useRef(0)
  const startY = useRef(0)
  const [previewStart, setPreviewStart] = useState(0)
  const [previewEnd, setPreviewEnd] = useState(0)

  const pxToHour = useCallback((px: number) => px / hourHeight + globalStart, [hourHeight, globalStart])

  const startDrag = useCallback((
    e: React.MouseEvent,
    type: 'resize-top' | 'resize-bottom' | 'move',
    blockId: string,
    start: number,
    end: number
  ) => {
    e.preventDefault()
    e.stopPropagation()
    startY.current = e.clientY
    originalStart.current = start
    originalEnd.current = end
    setPreviewStart(start)
    setPreviewEnd(end)
    setState({ isDragging: true, type, blockId })
  }, [])

  const startResizeTop = useCallback((e: React.MouseEvent, blockId: string, startHour: number, endHour: number) => {
    startDrag(e, 'resize-top', blockId, startHour, endHour)
  }, [startDrag])

  const startResizeBottom = useCallback((e: React.MouseEvent, blockId: string, startHour: number, endHour: number) => {
    startDrag(e, 'resize-bottom', blockId, startHour, endHour)
  }, [startDrag])

  const startMove = useCallback((e: React.MouseEvent, blockId: string, startHour: number, endHour: number) => {
    // Don't start move if clicking on resize handles
    if ((e.target as HTMLElement).closest('.resize-handle')) return
    startDrag(e, 'move', blockId, startHour, endHour)
  }, [startDrag])

  useEffect(() => {
    if (!state.isDragging || !containerRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const relativeY = e.clientY - rect.top + container.scrollTop
      const dayY = relativeY % (hourHeight * 24)
      const deltaHour = pxToHour(dayY) - originalStart.current

      switch (state.type) {
        case 'resize-top': {
          const newStart = Math.max(
            globalStart,
            Math.min(originalEnd.current - 0.25, originalStart.current + deltaHour)
          )
          setPreviewStart(newStart)
          break
        }
        case 'resize-bottom': {
          const newEnd = Math.max(
            originalStart.current + 0.25,
            Math.min(globalEnd, originalEnd.current + deltaHour)
          )
          setPreviewEnd(newEnd)
          break
        }
        case 'move': {
          const duration = originalEnd.current - originalStart.current
          const newStart = Math.max(
            globalStart,
            Math.min(globalEnd - duration, originalStart.current + deltaHour)
          )
          setPreviewStart(newStart)
          setPreviewEnd(newStart + duration)
          break
        }
      }
    }

    const handleMouseUp = async () => {
      if (state.blockId && (previewStart !== originalStart.current || previewEnd !== originalEnd.current)) {
        await onUpdate(state.blockId, previewStart, previewEnd)
      }
      setState({ isDragging: false, type: null, blockId: null })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [state.isDragging, state.type, state.blockId, previewStart, previewEnd, containerRef, hourHeight, pxToHour, globalStart, globalEnd, onUpdate])

  return {
    startResizeTop,
    startResizeBottom,
    startMove,
    previewStart,
    previewEnd,
    isDragging: state.isDragging,
  }
}
