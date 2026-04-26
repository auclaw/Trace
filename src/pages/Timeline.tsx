import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, Trash2, Plus, Play, CheckCircle2, Scissors, Merge, CalendarOff, Edit } from 'lucide-react'
import dataService from '../services/dataService'
import type { TimeBlock, Task } from '../services/dataService'
import { useToastFeedback } from '../hooks/useToastFeedback'
import ConfirmDialog from '../components/ConfirmDialog'
import DetailPanel from '../components/DetailPanel'
import ContextCard from '../components/ContextCard'
import UnscheduledTaskList from '../components/UnscheduledTaskList'
import { useAppStore } from '../store/useAppStore'
import { useFocusStore } from '../services/focusDetection'
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  HOUR_HEIGHT,
  START_HOUR,
  END_HOUR,
  DRAG_EDGE_HEIGHT,
  DAY_HEIGHT,
} from '../constants/timeline'

// 🧹 统一补零函数，消除所有 String(n).padStart 重复
const padZero = (n: number): string => String(n).padStart(2, '0')

const formatDateYMD = (date: Date): string => {
  const year = date.getFullYear()
  const month = padZero(date.getMonth() + 1)
  const day = padZero(date.getDate())
  return `${year}-${month}-${day}`
}

export default function Timeline() {
  const tasks = useAppStore((s) => s.tasks)
  const loadTasks = useAppStore((s) => s.loadTasks)
  const updateTask = useAppStore((s) => s.updateTask)

  // Load tasks on mount
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Sidebar resizable width
  const [sidebarWidth, setSidebarWidth] = useState(320) // 320px = w-80
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)
  const sidebarResizeStartX = useRef(0)
  const sidebarResizeStartWidth = useRef(0)

  const handleSidebarResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingSidebar(true)
    sidebarResizeStartX.current = e.clientX
    sidebarResizeStartWidth.current = sidebarWidth
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingSidebar) return
      const deltaX = sidebarResizeStartX.current - e.clientX
      const newWidth = Math.max(280, Math.min(500, sidebarResizeStartWidth.current + deltaX))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizingSidebar(false)
    }

    if (isResizingSidebar) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizingSidebar])

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [forceRefresh, setForceRefresh] = useState(0)

  // Infinite scroll - visible date range
  const [visibleDays, setVisibleDays] = useState<Date[]>([])
  const [loadedBlocks, setLoadedBlocks] = useState<Map<string, TimeBlock[]>>(new Map())
  const [loadingDays, setLoadingDays] = useState<Set<string>>(new Set())

  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null)
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showBatchConfirm, setShowBatchConfirm] = useState(false)
  const [showTaskDeleteConfirm, setShowTaskDeleteConfirm] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)
  const { success, error, info } = useToastFeedback()

  const [isResizing, setIsResizing] = useState(false)
  const [resizeType, setResizeType] = useState<'top' | 'bottom' | null>(null)
  const [resizeBlockId, setResizeBlockId] = useState<string | null>(null)
  const [resizeStartY, setResizeStartY] = useState(0)
  const [resizeOriginalStart, setResizeOriginalStart] = useState(0)
  const [resizeOriginalEnd, setResizeOriginalEnd] = useState(0)
  const [resizePreviewStart, setResizePreviewStart] = useState(0)
  const [resizePreviewEnd, setResizePreviewEnd] = useState(0)
  const [resizeDate, setResizeDate] = useState<string>('')

  const [isMoving, setIsMoving] = useState(false)
  const [moveBlockId, setMoveBlockId] = useState<string | null>(null)
  const [moveOriginalStart, setMoveOriginalStart] = useState(0)
  const [moveOriginalEnd, setMoveOriginalEnd] = useState(0)
  const [movePreviewStart, setMovePreviewStart] = useState(0)
  const [moveDate, setMoveDate] = useState<string>('')

  // 拖拽视觉反馈状态 - Optimization #1
  const [isDraggingTask, setIsDraggingTask] = useState(false)
  const [dragPreviewPosition, setDragPreviewPosition] = useState({ top: 0, height: 0, visible: false })
  const [dragDayIndex, setDragDayIndex] = useState<number | null>(null)

  const [isAdding, setIsAdding] = useState(false)
  const [addingDate, setAddingDate] = useState<string>(formatDateYMD(new Date()))

  // 🎯 统一使用 useAppStore 作为专注状态唯一来源
  const startFocus = useAppStore((s) => s.startFocus)

  // 右键菜单
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [contextMenuBlock, setContextMenuBlock] = useState<TimeBlock | null>(null)
  const [showPlannedTaskContextMenu, setShowPlannedTaskContextMenu] = useState(false)
  const [contextMenuPlannedTask, setContextMenuPlannedTask] = useState<Task | null>(null)

  // 今日成就聚合
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Focus detection store 状态
  const getContinuousFocusMinutes = useFocusStore(state => state.getContinuousFocusMinutes)
  const isOnBreak = useFocusStore(state => state.isOnBreak)
  const pendingEvent = useFocusStore(state => state.pendingEvent)

  const containerRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)

  // 🎯 专注状态跨页面自动同步 - 不再需要本地计时器
  // 所有状态由 useAppStore 统一管理，FocusMode 和 Timeline 自动保持一致

  // 小时转 ISO 时间字符串
  const hourToIsoTime = (hour: number, dateStr: string): string => {
    const h = Math.floor(hour)
    const m = Math.round((hour % 1) * 60)
    return `${dateStr}T${padZero(h)}:${padZero(m)}:00`
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0) {
      return mins > 0 ? `${hours} 小时 ${mins} 分` : `${hours} 小时`
    }
    return `${mins} 分钟`
  }

  const formatTimeOnly = (isoString: string): string => {
    const date = new Date(isoString)
    return `${padZero(date.getHours())}:${padZero(date.getMinutes())}`
  }

  // 按分类聚合时间块
  const aggregateBlocksByCategory = (blocks: TimeBlock[]) => {
    const grouped: Record<string, TimeBlock[]> = {}

    blocks.forEach(block => {
      if (!grouped[block.category]) {
        grouped[block.category] = []
      }
      grouped[block.category].push(block)
    })

    return Object.entries(grouped).map(([category, categoryBlocks]) => {
      const totalMinutes = categoryBlocks.reduce((sum, b) => sum + b.durationMinutes, 0)
      const sortedBlocks = [...categoryBlocks].sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
      const earliestTime = sortedBlocks[0].startTime
      const latestTime = sortedBlocks[sortedBlocks.length - 1].endTime

      return {
        category,
        blocks: sortedBlocks,
        totalMinutes,
        count: categoryBlocks.length,
        timeRange: `${formatTimeOnly(earliestTime)} - ${formatTimeOnly(latestTime)}`,
      }
    }).sort((a, b) => b.totalMinutes - a.totalMinutes)
  }

  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  // Initialize with 3 days: yesterday, today, tomorrow
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = [
      addDays(today, -1),
      today,
      addDays(today, 1),
    ]
    setVisibleDays(days)
    setSelectedDate(today)

    // Scroll to today's 8am
    setTimeout(() => {
      if (containerRef.current) {
        const todayIndex = days.findIndex(d => formatDateYMD(d) === formatDateYMD(today))
        const scrollTop = todayIndex * DAY_HEIGHT + 8 * HOUR_HEIGHT - 100
        containerRef.current.scrollTo({ top: scrollTop, behavior: 'auto' })
      }
    }, 100)
  }, [])

  // Load time blocks for visible days
  const loadDayBlocks = useCallback(async (date: Date, force: boolean = false) => {
    const dateStr = formatDateYMD(date)
    if (!force && (loadedBlocks.has(dateStr) || loadingDays.has(dateStr))) return

    setLoadingDays(prev => new Set([...prev, dateStr]))
    try {
      const blocks = await dataService.getTimeBlocks(dateStr)

      setLoadedBlocks(prev => {
        const next = new Map(prev)
        next.set(dateStr, blocks)
        return next
      })
    } catch (err) {
      console.error('Failed to load time blocks:', err)
    } finally {
      setLoadingDays(prev => {
        const next = new Set(prev)
        next.delete(dateStr)
        return next
      })
    }
  }, [loadedBlocks, loadingDays])

  useEffect(() => {
    visibleDays.forEach(day => loadDayBlocks(day))
  }, [visibleDays, loadDayBlocks])

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isScrolling) return

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const scrollThreshold = DAY_HEIGHT * 0.5

    // Load previous day (scroll top)
    if (scrollTop < scrollThreshold) {
      setIsScrolling(true)
      const firstDay = visibleDays[0]
      const newDay = addDays(firstDay, -1)
      setVisibleDays(prev => [newDay, ...prev])

      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: containerRef.current.scrollTop + DAY_HEIGHT,
            behavior: 'auto'
          })
        }
        setIsScrolling(false)
      }, 50)
    }

    // Load next day (scroll bottom)
    if (scrollTop + clientHeight > scrollHeight - scrollThreshold) {
      setIsScrolling(true)
      const lastDay = visibleDays[visibleDays.length - 1]
      const newDay = addDays(lastDay, 1)
      setVisibleDays(prev => [...prev, newDay])
      setIsScrolling(false)
    }
  }, [visibleDays, isScrolling])

  const timeToHour = (isoStr: string): number => {
    const date = new Date(isoStr)
    return date.getHours() + date.getMinutes() / 60
  }

  const hourToPx = (hour: number): number => {
    return (hour - START_HOUR) * HOUR_HEIGHT
  }

  const pxToHour = (px: number): number => {
    return px / HOUR_HEIGHT + START_HOUR
  }

  // Check if two time blocks overlap
  const blocksOverlap = (a: TimeBlock, b: TimeBlock): boolean => {
    const aStart = new Date(a.startTime).getTime()
    const aEnd = new Date(a.endTime).getTime()
    const bStart = new Date(b.startTime).getTime()
    const bEnd = new Date(b.endTime).getTime()
    return aStart < bEnd && bStart < aEnd
  }

  // Calculate column layout for overlapping blocks
  const calculateBlockLayout = (blocks: TimeBlock[]) => {
    const sorted = [...blocks].sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )

    const columns: TimeBlock[][] = []

    for (const block of sorted) {
      let placed = false
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const column = columns[colIndex]
        const lastInColumn = column[column.length - 1]

        if (!blocksOverlap(lastInColumn, block)) {
          column.push(block)
          placed = true
          break
        }
      }
      if (!placed) {
        columns.push([block])
      }
    }

    const result = new Map<string, { left: number; width: number; colIndex: number; totalCols: number }>()

    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      for (const block of columns[colIndex]) {
        const overlappingBlocks = sorted.filter(b => blocksOverlap(b, block))
        const maxOverlap = Math.max(...overlappingBlocks.map(b => {
          return sorted.filter(other => blocksOverlap(b, other)).length
        }))

        const totalCols = Math.max(maxOverlap, 1)
        const widthPercent = 100 / totalCols
        const gap = 0.2  // 块之间的微小间距百分比

        result.set(block.id, {
          left: colIndex * widthPercent + gap,
          width: widthPercent - gap * 2,
          colIndex,
          totalCols
        })
      }
    }

    return result
  }

  // Get day index offset + hour position within that day
  const getGlobalBlockStyle = (block: TimeBlock, dayIndex: number) => {
    const startHour = timeToHour(block.startTime)
    const endHour = timeToHour(block.endTime)
    const top = dayIndex * DAY_HEIGHT + hourToPx(startHour)
    const height = hourToPx(endHour) - hourToPx(startHour)
    return { top: Math.max(0, top), height: Math.max(30, height) }
  }

  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null)
  const [inlineTitle, setInlineTitle] = useState('')

  // 选中/取消选中单个块
  const toggleBlockSelection = (blockId: string) => {
    setSelectedBlockIds(prev => {
      const next = new Set(prev)
      if (next.has(blockId)) {
        next.delete(blockId)
      } else {
        next.add(blockId)
      }
      return next
    })
  }

  // 点击块内容区域（非标题行）：支持多选
  const handleBlockClick = (e: React.MouseEvent, block: TimeBlock) => {
    if (isResizing || isMoving) return
    e.stopPropagation()

    // 🎯 如果正在编辑其他块，取消编辑
    if (inlineEditingId && inlineEditingId !== block.id) {
      setInlineEditingId(null)
    }

    // Ctrl/Cmd 点击：切换选中状态，保留其他选择
    if (e.ctrlKey || e.metaKey) {
      toggleBlockSelection(block.id)
      setSelectedBlock(block)
    } else {
      // 普通点击：清除其他选中，只选中当前
      setSelectedBlockIds(new Set([block.id]))
      setSelectedBlock(block)
    }
  }

  // 打开批量确认弹窗
  const openBatchConfirmDialog = () => {
    if (selectedBlockIds.size === 0) return
    setShowBatchConfirm(true)
  }

  // 执行批量确认
  const executeBatchConfirm = async () => {
    const count = selectedBlockIds.size

    for (const blockId of selectedBlockIds) {
      await dataService.updateTimeBlock(blockId, { source: 'confirmed' })
    }

    // 重新加载所有受影响的日期数据
    const datesToReload = new Set<string>()
    for (const [date, blocks] of loadedBlocks) {
      for (const block of blocks) {
        if (selectedBlockIds.has(block.id)) {
          datesToReload.add(date)
          break
        }
      }
    }

    // 先清除缓存再强制重新加载
    setLoadedBlocks(prev => {
      const next = new Map(prev)
      datesToReload.forEach(date => next.delete(date))
      return next
    })

    for (const date of datesToReload) {
      await loadDayBlocks(new Date(date))
    }

    setSelectedBlockIds(new Set())
    setShowBatchConfirm(false)
    success(`已确认 ${count} 个时间块`)
  }

  const handleInlineEditSave = async (block: TimeBlock) => {
    if (inlineTitle.trim() && inlineTitle !== block.title) {
      await dataService.updateTimeBlock(block.id, { title: inlineTitle.trim() })
      // 重新加载当天数据
      await loadDayBlocks(new Date(block.startTime))
    }
    setInlineEditingId(null)
  }

  const handleInlineEditKeyDown = (e: React.KeyboardEvent, block: TimeBlock) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleInlineEditSave(block)
    } else if (e.key === 'Escape') {
      setInlineEditingId(null)
    }
  }

  const closePanel = () => {
    setEditingBlock(null)
    setIsAdding(false)
  }

  const addTimeBlock = async (blockData: Partial<TimeBlock>) => {
    if (!blockData.title?.trim()) return
    try {
      const dateStr = addingDate
      const durationMinutes = blockData.endTime && blockData.startTime
        ? Math.round((new Date(blockData.endTime).getTime() - new Date(blockData.startTime).getTime()) / 60000)
        : 60

      // 智能判断 completed：过去时间块标记为已完成
      const now = Date.now()
      const endMs = blockData.endTime ? new Date(blockData.endTime).getTime() : now
      const completed = endMs < now

      const newBlock = await dataService.addTimeBlock({
        title: blockData.title.trim(),
        category: (blockData as any).category || '其他',
        startTime: blockData.startTime || `${dateStr}T09:00:00`,
        endTime: blockData.endTime || `${dateStr}T10:00:00`,
        durationMinutes,
        date: dateStr,
        completed,
        source: 'manual',
        status: 'pending' as const,
        categoryId: (blockData as any).categoryId || undefined,
        description: (blockData as any).description || undefined,
        taskId: (blockData as any).taskId || undefined,
      })

      // 手动更新前端状态
      setLoadedBlocks(prev => {
        const next = new Map(prev)
        const existing = next.get(dateStr) || []
        next.set(dateStr, [...existing, newBlock])
        return next
      })

      setIsAdding(false)
      success('已创建时间块')
    } catch (err) {
      console.error('Failed to create time block:', err)
      error('创建失败，请重试')
    }
  }

  const saveBlockChanges = async (updated: TimeBlock) => {
    const block = editingBlock || selectedBlock
    if (!block) return
    try {
      await dataService.updateTimeBlock(block.id, updated)

      const dateStr = block.startTime.slice(0, 10)
      setLoadedBlocks(prev => {
        const next = new Map(prev)
        next.delete(dateStr)
        return next
      })

      closePanel()
      success('已保存')
    } catch (err) {
      console.error('Failed to update time block:', err)
      error('保存失败，请重试')
    }
  }

  // 拆分时间块
  const splitBlock = async (block: TimeBlock) => {
    try {
      const start = new Date(block.startTime).getTime()
      const end = new Date(block.endTime).getTime()
      const mid = new Date(start + (end - start) / 2)

      const block1Duration = Math.round((mid.getTime() - start) / (1000 * 60))
      const block2Duration = Math.round((end - mid.getTime()) / (1000 * 60))

      await dataService.deleteTimeBlock(block.id)

      // 解构掉 id，使用剩余属性创建新块
      const { id: _, ...blockWithoutId } = block

      await dataService.addTimeBlock({
        ...blockWithoutId,
        endTime: mid.toISOString(),
        durationMinutes: block1Duration,
      })

      await dataService.addTimeBlock({
        ...blockWithoutId,
        title: `${block.title} (2)`,
        startTime: mid.toISOString(),
        durationMinutes: block2Duration,
      })

      const dateStr = block.startTime.slice(0, 10)
      setLoadedBlocks(prev => {
        const next = new Map(prev)
        next.delete(dateStr)
        return next
      })

      success('已拆分时间块')
      setShowContextMenu(false)
    } catch (err) {
      console.error('Failed to split block:', err)
      error('拆分失败，请重试')
    }
  }

  // 合并相邻时间块
  const mergeAdjacentBlocks = async (block: TimeBlock) => {
    try {
      const dateStr = block.startTime.slice(0, 10)
      const blocks = loadedBlocks.get(dateStr) || []

      const blockStart = new Date(block.startTime).getTime()
      const blockEnd = new Date(block.endTime).getTime()

      const adjacentBlocks = blocks.filter(b => {
        if (b.id === block.id) return false
        if (b.category !== block.category) return false

        const start = new Date(b.startTime).getTime()
        const end = new Date(b.endTime).getTime()

        const threshold = 5 * 60 * 1000
        return (Math.abs(start - blockEnd) < threshold || Math.abs(end - blockStart) < threshold)
      })

      if (adjacentBlocks.length === 0) {
        info('没有找到可合并的相邻时间块')
        setShowContextMenu(false)
        return
      }

      const allToMerge = [block, ...adjacentBlocks]
      const minStart = Math.min(...allToMerge.map(b => new Date(b.startTime).getTime()))
      const maxEnd = Math.max(...allToMerge.map(b => new Date(b.endTime).getTime()))

      for (const b of allToMerge) {
        await dataService.deleteTimeBlock(b.id)
      }

      const totalDuration = Math.round((maxEnd - minStart) / (1000 * 60))
      const { id: _, ...blockWithoutId } = block
      await dataService.addTimeBlock({
        ...blockWithoutId,
        startTime: new Date(minStart).toISOString(),
        endTime: new Date(maxEnd).toISOString(),
        durationMinutes: totalDuration,
        source: 'confirmed'
      })

      setLoadedBlocks(prev => {
        const next = new Map(prev)
        next.delete(dateStr)
        return next
      })

      success(`已合并 ${allToMerge.length} 个时间块`)
      setShowContextMenu(false)
    } catch (err) {
      console.error('Failed to merge blocks:', err)
      error('合并失败，请重试')
    }
  }

  const handleContextMenu = (e: React.MouseEvent, block: TimeBlock) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenuPos({ x: e.clientX, y: e.clientY })
    setContextMenuBlock(block)
    setShowContextMenu(true)
  }

  // 点击任意位置（包括右键）关闭菜单
  useEffect(() => {
    const closeMenus = () => {
      setShowContextMenu(false)
      setShowPlannedTaskContextMenu(false)
    }
    if (showContextMenu || showPlannedTaskContextMenu) {
      document.addEventListener('click', closeMenus)
      document.addEventListener('contextmenu', closeMenus)  // 右键也关闭
    }
    return () => {
      document.removeEventListener('click', closeMenus)
      document.removeEventListener('contextmenu', closeMenus)
    }
  }, [showContextMenu, showPlannedTaskContextMenu])

  // 键盘 Delete 键删除
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // 如果正在编辑标题，不触发删除
        if (inlineEditingId) return
        // 如果有选中的块，打开删除确认弹窗
        if (selectedBlockIds.size > 0) {
          e.preventDefault()  // 🎯 阻止默认行为，避免浏览器后退
          setShowDeleteConfirm(true)
        }
      }
      // Escape 键取消选中
      if (e.key === 'Escape') {
        e.preventDefault()  // 🎯 阻止默认行为
        setSelectedBlockIds(new Set())
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedBlockIds, inlineEditingId])

  const handleConfirmDelete = async () => {
    // 批量删除
    if (selectedBlockIds.size > 0) {
      const datesToReload = new Set<string>()
      const deletedTitles: string[] = []

      for (const blockId of selectedBlockIds) {
        const block = Array.from(loadedBlocks.values())
          .flat()
          .find(b => b.id === blockId)

        if (block) {
          await dataService.deleteTimeBlock(blockId)
          datesToReload.add(block.startTime.slice(0, 10))
          deletedTitles.push(block.title)
        }
      }

      setLoadedBlocks(prev => {
        const next = new Map(prev)
        datesToReload.forEach(date => next.delete(date))
        return next
      })

      setSelectedBlockIds(new Set())
      setSelectedBlock(null)
      setEditingBlock(null)
      setShowDeleteConfirm(false)
      success(`已删除 ${deletedTitles.length} 个时间块`)
      return
    }

    // 单个删除
    const block = selectedBlock || editingBlock
    if (!block) return
    try {
      const dateStr = block.startTime.slice(0, 10)
      await dataService.deleteTimeBlock(block.id)

      setLoadedBlocks(prev => {
        const next = new Map(prev)
        next.delete(dateStr)
        return next
      })

      setEditingBlock(null)
      setSelectedBlock(null)
      setShowDeleteConfirm(false)
      success('已删除时间块')
    } catch (err) {
      console.error('Failed to delete time block:', err)
      error('删除失败')
    }
  }

  const startResize = (e: React.MouseEvent, block: TimeBlock, type: 'top' | 'bottom', _dayIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    const startHour = timeToHour(block.startTime)
    const endHour = timeToHour(block.endTime)

    setResizeType(type)
    setResizeBlockId(block.id)
    setResizeStartY(e.clientY)
    setResizeOriginalStart(startHour)
    setResizeOriginalEnd(endHour)
    setResizePreviewStart(startHour)
    setResizePreviewEnd(endHour)
    setResizeDate(block.startTime.slice(0, 10))
    setIsResizing(true)
  }

  // 🎯 拖拽优化：长按延迟 + 移动阈值，避免误触发
  const DRAG_THRESHOLD = 8  // 增大阈值，更难误触发
  const DRAG_DELAY = 150    // 长按 150ms 后才允许拖拽
  const [dragStartState, setDragStartState] = useState<{
    blockId: string
    startY: number
    originalStart: number
    originalEnd: number
    date: string
    allowDragAt: number  // 允许拖拽的时间点
  } | null>(null)

  const startMove = (e: React.MouseEvent, block: TimeBlock) => {
    // 如果正在内联编辑，不触发拖拽
    if (inlineEditingId === block.id) return

    e.preventDefault()
    e.stopPropagation()

    if ((e.target as HTMLElement).closest('.resize-handle')) return

    const startHour = timeToHour(block.startTime)
    const endHour = timeToHour(block.endTime)

    // 记录初始状态，设置允许拖拽的时间点（长按后）
    setDragStartState({
      blockId: block.id,
      startY: e.clientY,
      originalStart: startHour,
      originalEnd: endHour,
      date: block.startTime.slice(0, 10),
      allowDragAt: Date.now() + DRAG_DELAY,  // 150ms 后才允许拖拽
    })
  }

  // 🧲 15分钟刻度吸附
  const snapToGrid = (hour: number): number => {
    const minutes = hour * 60
    const snappedMinutes = Math.round(minutes / 15) * 15
    return snappedMinutes / 60
  }

  // Resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const scrollContainer = containerRef.current
      const relativeY = e.clientY - scrollContainer.getBoundingClientRect().top + scrollContainer.scrollTop

      const yInDay = relativeY % DAY_HEIGHT
      const rawHour = pxToHour(yInDay)
      const deltaHour = snapToGrid(rawHour) - resizeOriginalStart  // 🧲 吸附到15分钟刻度

      let newStart = resizePreviewStart
      let newEnd = resizePreviewEnd

      if (resizeType === 'top') {
        newStart = Math.max(START_HOUR, Math.min(resizeOriginalEnd - 0.25, resizeOriginalStart + deltaHour))
        setResizePreviewStart(newStart)
      } else if (resizeType === 'bottom') {
        newEnd = Math.max(resizeOriginalStart + 0.25, Math.min(END_HOUR, resizeOriginalEnd + deltaHour))
        setResizePreviewEnd(newEnd)
      }
    }

    const handleMouseUp = async () => {

      if (!isResizing || !resizeBlockId) {
        setIsResizing(false)
        return
      }

      setIsResizing(false)

      if (resizePreviewStart !== resizeOriginalStart || resizePreviewEnd !== resizeOriginalEnd) {
        try {
          const startTime = hourToIsoTime(resizePreviewStart, resizeDate)
          const endTime = hourToIsoTime(resizePreviewEnd, resizeDate)
          const durationMinutes = Math.round((resizePreviewEnd - resizePreviewStart) * 60)

          await dataService.updateTimeBlock(resizeBlockId, {
            startTime,
            endTime,
            durationMinutes,
          })

          setLoadedBlocks(prev => {
            const next = new Map(prev)
            next.delete(resizeDate)
            return next
          })
        } catch (err) {
          console.error('Failed to update time block:', err)
        }
      }

      setResizeBlockId(null)
      setResizeType(null)
      setResizeDate('')
    }

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeType, resizeBlockId, resizeStartY, resizeOriginalStart, resizeOriginalEnd, resizePreviewStart, resizePreviewEnd, resizeDate, visibleDays])

  // Move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 如果有拖拽起始状态但还没进入真正拖拽，检查长按延迟和移动距离
      if (dragStartState && !isMoving) {
        const deltaY = Math.abs(e.clientY - dragStartState.startY)
        const now = Date.now()
        // 🎯 只有同时满足：移动超过阈值 + 长按时间够，才进入拖拽模式
        if (deltaY > DRAG_THRESHOLD && now >= dragStartState.allowDragAt) {
          // 超过阈值，真正进入拖拽模式
          setMoveBlockId(dragStartState.blockId)
          setMoveOriginalStart(dragStartState.originalStart)
          setMoveOriginalEnd(dragStartState.originalEnd)
          setMovePreviewStart(dragStartState.originalStart)
          setMoveDate(dragStartState.date)
          setIsMoving(true)
        }
        return
      }

      if (!isMoving || !containerRef.current || !moveBlockId) return

      const scrollContainer = containerRef.current
      const relativeY = e.clientY - scrollContainer.getBoundingClientRect().top + scrollContainer.scrollTop

      // 🎯 修复跨天拖拽：直接计算鼠标在哪个日期内
      const newDayIndex = Math.floor(relativeY / DAY_HEIGHT)
      const yInDay = relativeY % DAY_HEIGHT
      const rawHour = pxToHour(yInDay)
      const snappedHour = snapToGrid(rawHour)

      // 确保日期索引在有效范围内
      const clampedDayIndex = Math.max(0, Math.min(visibleDays.length - 1, newDayIndex))
      const newDate = formatDateYMD(visibleDays[clampedDayIndex])

      // 计算新的开始时间（限制在一天内）
      const duration = moveOriginalEnd - moveOriginalStart
      const newStartHour = Math.max(START_HOUR, Math.min(END_HOUR - duration, snappedHour))

      // 更新预览位置和日期
      setMovePreviewStart(newStartHour)
      if (newDate !== moveDate) {
        setMoveDate(newDate)
      }
    }

    const handleMouseUp = async () => {
      // 🎯 使用 dragStartState 中的原始日期，而不是 moveDate（可能已更新）
      const oldDate = dragStartState?.date
      const oldStart = moveOriginalStart
      const newStart = movePreviewStart
      const newDate = moveDate

      setDragStartState(null)  // 清除拖拽起始状态

      if (!isMoving || !moveBlockId) {
        setIsMoving(false)
        return
      }

      setIsMoving(false)

      // 只有当时间或日期改变时才更新
      if (oldDate && (newStart !== oldStart || newDate !== oldDate)) {
        const duration = moveOriginalEnd - moveOriginalStart

        try {
          const startTime = hourToIsoTime(newStart, newDate)
          const endTime = hourToIsoTime(newStart + duration, newDate)
          const durationMinutes = Math.round(duration * 60)

          await dataService.updateTimeBlock(moveBlockId, {
            startTime,
            endTime,
            durationMinutes,
          })

          // 清除旧日期和新日期的缓存，强制重新加载
          setLoadedBlocks(prev => {
            const next = new Map(prev)
            next.delete(oldDate)
            next.delete(newDate)
            return next
          })
        } catch (err) {
          console.error('Failed to update time block:', err)
        }
      }

      setMoveBlockId(null)
      setMoveDate('')
    }

    // 有拖拽起始状态 或 正在拖拽时都需要监听事件
    if (isMoving || dragStartState) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isMoving, dragStartState, moveBlockId, moveOriginalStart, moveOriginalEnd, movePreviewStart, moveDate, visibleDays])

  // 点击外部关闭日历
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false)
      }
    }
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCalendar])

  // ⌨️ 键盘快捷键支持 - Optimization #4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在输入，不触发快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      // 选中时间块时的快捷键
      if (editingBlock || selectedBlock) {
        // Delete / Backspace 删除选中块
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault()
          setShowDeleteConfirm(true)
        }

        // Escape 取消选择
        if (e.key === 'Escape') {
          e.preventDefault()
          setEditingBlock(null)
          setEditingTask(null)
          setShowDeleteConfirm(false)
        }
      }

      // 全局快捷键
      switch (e.key) {
        // 方向键导航日期
        case 'ArrowLeft':
          if (!showCalendar && !isAdding) {
            e.preventDefault()
            navigateDate(-1)
          }
          break
        case 'ArrowRight':
          if (!showCalendar && !isAdding) {
            e.preventDefault()
            navigateDate(1)
          }
          break

        // 'N' 快速添加新事件
        case 'n':
        case 'N':
          if (!isAdding) {
            e.preventDefault()
            setAddingDate(formatDateYMD(selectedDate))
            setIsAdding(true)
          }
          break

        // Escape 关闭弹窗/菜单
        case 'Escape':
          if (isAdding) {
            closePanel()
          }
          if (showContextMenu) {
            setShowContextMenu(false)
            setContextMenuBlock(null)
          }
          if (showPlannedTaskContextMenu) {
            setShowPlannedTaskContextMenu(false)
            setContextMenuPlannedTask(null)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedBlock, selectedDate, isAdding, showCalendar, showContextMenu, showPlannedTaskContextMenu])


  // 智能上下文卡片状态判断
  const now = new Date()
  const todayStr = formatDateYMD(now)
  const todayBlocks = loadedBlocks.get(todayStr) || []
  const recentEndTime = todayBlocks.length > 0
    ? new Date(todayBlocks.sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())[0].endTime)
    : null

  // 状态1: 🔴 被打断后刚回来 (5分钟内)
  const wasInterrupted = recentEndTime &&
    now.getTime() - recentEndTime.getTime() < 5 * 60 * 1000 &&
    now.getTime() - recentEndTime.getTime() > 30 * 1000



  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

  const formatDateHeader = () => {
    return selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
  }

  // 生成日历日期
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return { days, monthName: firstDay.toLocaleDateString('zh-CN', { month: 'long', year: 'numeric' }) }
  }

  const startFocusSession = (task: Task) => {
    // 🎯 通过 useAppStore 统一启动专注，跨页面自动同步
    startFocus(task.id)
  }

  // 任务拖拽开始 - Optimization #1
  const handleTaskDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.effectAllowed = 'move'
    setIsDraggingTask(true)
  }

  const navigateDate = (direction: number) => {
    const newSelected = addDays(selectedDate, direction)
    setSelectedDate(newSelected)

    // Scroll to that day
    if (containerRef.current) {
      const dayIndex = visibleDays.findIndex(d => formatDateYMD(d) === formatDateYMD(newSelected))
      if (dayIndex >= 0) {
        containerRef.current.scrollTo({
          top: dayIndex * DAY_HEIGHT + 8 * HOUR_HEIGHT - 100,
          behavior: 'smooth'
        })
      } else {
        // If day not in visible range, add it and scroll
        let newDays: Date[]
        if (direction < 0) {
          newDays = []
          let d = newSelected
          for (let i = 0; i < 3; i++) {
            newDays.push(d)
            d = addDays(d, 1)
          }
        } else {
          newDays = []
          let d = newSelected
          for (let i = 2; i >= 0; i--) {
            newDays.push(addDays(d, -i))
          }
        }
        setVisibleDays(newDays)
        // 找到新日期在新数组中的索引，然后滚动到正确位置
        const targetIndex = newDays.findIndex(d => formatDateYMD(d) === formatDateYMD(newSelected))
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTo({
              top: Math.max(0, targetIndex * DAY_HEIGHT + 8 * HOUR_HEIGHT - 100),
              behavior: 'smooth'
            })
          }
        }, 100)
      }
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#FDFBF7' }}>
      {/* Main Timeline Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Date Navigation Header - Sticky */}
        <div
          className="p-5 mx-6 mt-6 rounded-2xl flex items-center justify-between flex-shrink-0 z-20"
          style={{
            background: '#FFFFFF',
            border: '2px solid #D6D3CD',
            boxShadow: '4px 4px 0px #D6D3CD',
          }}
        >
          {/* 点击左边日期弹出日历 */}
          <div className="relative" ref={calendarRef}>
            <h1
              className="text-xl font-bold cursor-pointer hover:opacity-70 transition-all"
              style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}
              onClick={() => setShowCalendar(!showCalendar)}
            >
              {formatDateHeader()}
            </h1>

              {/* 日历选择器弹窗 */}
              {showCalendar && (
                <div
                  className="absolute top-full left-0 mt-2 p-4 rounded-xl z-[100] w-64"
                  style={{
                    background: '#FFFFFF',
                    border: '2px solid #D6D3CD',
                    boxShadow: '4px 4px 0px #D6D3CD',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => {
                        const d = new Date(selectedDate)
                        d.setMonth(d.getMonth() - 1)
                        setSelectedDate(d)
                      }}
                      className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-sm font-medium" style={{ color: '#3A3638' }}>
                      {generateCalendarDays().monthName}
                    </span>
                    <button
                      onClick={() => {
                        const d = new Date(selectedDate)
                        d.setMonth(d.getMonth() + 1)
                        setSelectedDate(d)
                      }}
                      className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                      <span key={day} className="text-xs py-1" style={{ color: '#9E9899' }}>{day}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays().days.map((day, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (day) {
                            setSelectedDate(day)
                            setShowCalendar(false)
                            // 滚动到选中日期的当前时间（或今天的8点）
                            if (containerRef.current) {
                              const dayIndex = visibleDays.findIndex(d => formatDateYMD(d) === formatDateYMD(day))
                              const now = new Date()
                              const isToday = formatDateYMD(day) === formatDateYMD(now)
                              const targetHour = isToday ? now.getHours() + now.getMinutes() / 60 : 8
                              const scrollTop = Math.max(0, dayIndex * DAY_HEIGHT + hourToPx(targetHour) - 100)
                              containerRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' })
                            }
                          }
                        }}
                        disabled={!day}
                        className="w-8 h-8 rounded-lg text-xs transition-all hover:bg-gray-100 flex items-center justify-center"
                        style={{
                          background: day && formatDateYMD(day) === formatDateYMD(selectedDate)
                            ? '#79BEEB'
                            : day && formatDateYMD(day) === formatDateYMD(new Date())
                              ? '#79BEEB30'
                              : 'transparent',
                          color: day && formatDateYMD(day) === formatDateYMD(selectedDate)
                            ? '#FFFFFF'
                            : day
                              ? '#3A3638'
                              : 'transparent',
                          fontWeight: day && formatDateYMD(day) === formatDateYMD(new Date()) ? 'bold' : 'normal',
                        }}
                      >
                        {day?.getDate()}
                      </button>
                    ))}
                  </div>

                  {/* 今天按钮 */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        const today = new Date()
                        setSelectedDate(today)
                        setShowCalendar(false)

                        // 🎯 确保今天在可见范围内，然后滚动到当前时间位置
                        if (containerRef.current) {
                          // 先检查今天是否在 visibleDays 中
                          let todayIndex = visibleDays.findIndex(d => formatDateYMD(d) === formatDateYMD(today))

                          // 如果今天不在可见范围内，重新初始化 visibleDays 为以今天为中心的3天
                          if (todayIndex < 0) {
                            today.setHours(0, 0, 0, 0)
                            const newDays = [
                              addDays(today, -1),
                              today,
                              addDays(today, 1),
                            ]
                            setVisibleDays(newDays)
                            todayIndex = 1  // 今天在中间位置

                            // 等待状态更新后再滚动
                            setTimeout(() => {
                              if (containerRef.current) {
                                const now = new Date()
                                const currentHour = now.getHours() + now.getMinutes() / 60
                                const scrollTop = Math.max(0, todayIndex * DAY_HEIGHT + hourToPx(currentHour) - 100)
                                containerRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' })
                              }
                            }, 50)
                          } else {
                            // 今天已经在可见范围内，直接滚动
                            const now = new Date()
                            const currentHour = now.getHours() + now.getMinutes() / 60
                            const scrollTop = Math.max(0, todayIndex * DAY_HEIGHT + hourToPx(currentHour) - 100)
                            containerRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' })
                          }
                        }
                      }}
                      className="w-full py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-100 flex items-center justify-center gap-1"
                      style={{ color: '#79BEEB' }}
                    >
                      回到今天
                    </button>
                  </div>
                </div>
              )}
            </div>

          {/* 只有左右箭头，中间没有日期 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateDate(-1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
            >
              <ChevronLeft size={16} style={{ color: '#5C5658' }} />
            </button>
            <button
              onClick={() => navigateDate(1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
            >
              <ChevronRight size={16} style={{ color: '#5C5658' }} />
            </button>
          </div>
        </div>

        {/* Scrollable Timeline Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto mx-6 my-4 rounded-2xl"
          style={{
            background: '#FFFFFF',
            border: '2px solid #D6D3CD',
            boxShadow: '4px 4px 0px #D6D3CD',
          }}
          onScroll={handleScroll}
        >
          {/* Days Container - Infinite Scroll */}
          {visibleDays.map((day, dayIndex) => {
            const dateStr = formatDateYMD(day)
            const blocks = loadedBlocks.get(dateStr) || []
            const isToday = dateStr === formatDateYMD(new Date())
            const isSelected = dateStr === formatDateYMD(selectedDate)

            return (
              <div
                key={dateStr}
                className="relative"
                style={{ height: DAY_HEIGHT }}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  setAddingDate(formatDateYMD(day))
                  setIsAdding(true)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'

                  // 拖拽视觉反馈 - Optimization #1
                  if (!isDraggingTask) return

                  const rect = e.currentTarget.getBoundingClientRect()
                  const dropY = e.clientY - rect.top
                  const dropHour = (dropY / DAY_HEIGHT) * 24
                  const snappedHour = snapToGrid(dropHour)

                  setDragPreviewPosition({
                    top: hourToPx(snappedHour),
                    height: hourToPx(snappedHour + 1) - hourToPx(snappedHour),
                    visible: true,
                  })
                  setDragDayIndex(dayIndex)
                }}
                onDragLeave={() => {
                  if (isDraggingTask) {
                    setDragPreviewPosition({ top: 0, height: 0, visible: false })
                    setDragDayIndex(null)
                  }
                }}
                onDrop={async (e) => {
                  e.preventDefault()
                  // 清理拖拽状态 - Optimization #1
                  setIsDraggingTask(false)
                  setDragPreviewPosition({ top: 0, height: 0, visible: false })
                  setDragDayIndex(null)

                  const taskId = e.dataTransfer.getData('taskId')
                  if (!taskId) return

                  const task = tasks.find(t => t.id === taskId)
                  if (!task) return

                  const rect = e.currentTarget.getBoundingClientRect()
                  const dropY = e.clientY - rect.top
                  const dropHour = (dropY / DAY_HEIGHT) * 24
                  const startHour = snapToGrid(dropHour) // 使用吸附 - Optimization #2
                  const durationHours = (task.estimatedMinutes || 60) / 60
                  const endHour = startHour + durationHours

                  // 创建时间块（Bug 6 修复）
                  const dateStr = formatDateYMD(day)
                  const startTime = `${dateStr}T${padZero(Math.floor(startHour))}:${padZero(Math.round((startHour % 1) * 60))}:00`
                  const endTime = `${dateStr}T${padZero(Math.floor(endHour))}:${padZero(Math.round((endHour % 1) * 60))}:00`

                  // 创建时间块 - 关联任务ID
                  const newBlock = await dataService.addTimeBlock({
                    title: task.title,
                    category: '工作', // 默认分类
                    startTime,
                    endTime,
                    durationMinutes: Math.round(durationHours * 60),
                    date: dateStr,
                    completed: false,
                    source: 'confirmed',
                    taskId: taskId, // 关联任务ID
                    isTaskTimer: true, // 标记为任务计时器创建的时间块
                  })

                  // 标记任务为已安排 - 使用store更新确保前端状态同步
                  await updateTask(taskId, {
                    scheduledStartTime: startTime,
                    scheduledDate: dateStr,
                  })

                  // 更新时间块列表
                  setLoadedBlocks(prev => {
                    const next = new Map(prev)
                    const existing = next.get(dateStr) || []
                    next.set(dateStr, [...existing, newBlock])
                    return next
                  })

                  success('已开始专注此任务')
                }}
              >
                {/* Day Separator Header */}
                <div
                  className="absolute left-0 right-0 z-10 flex items-center gap-3 px-4 py-2"
                  style={{
                    top: 0,
                    background: isToday
                      ? 'linear-gradient(180deg, rgba(121, 190, 235, 0.15) 0%, transparent 100%)'
                      : isSelected
                        ? 'linear-gradient(180deg, rgba(212, 196, 251, 0.1) 0%, transparent 100%)'
                        : 'linear-gradient(180deg, rgba(245, 241, 234, 0.5) 0%, transparent 100%)',
                    borderBottom: isToday ? '2px solid #79BEEB' : '1px solid #E8E6E1',
                  }}
                >
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-lg"
                    style={{
                      color: isToday ? '#79BEEB' : isSelected ? '#D4C4FB' : '#5C5658',
                      background: isToday ? 'rgba(121, 190, 235, 0.2)' : 'transparent',
                    }}
                  >
                    {day.toLocaleDateString('zh-CN', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {isToday && ' 今天'}
                  </span>
                </div>

                {/* Hour Grid Lines for this day */}
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-b border-gray-50"
                    style={{ top: hourToPx(hour) }}
                  >
                    <span
                      className="absolute left-3 text-xs"
                      style={{ color: hour === 0 ? '#9E9899' : hour < 6 ? '#D6D3CD' : '#9E9899', top: -8 }}
                    >
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}

                {/* Current Time Indicator - only on today */}
                {isToday && (
                  <div
                    className="absolute left-0 right-0 z-30"
                    style={{ top: hourToPx(new Date().getHours() + new Date().getMinutes() / 60) }}
                  >
                    <div className="h-0.5 bg-red-500 relative">
                      <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500 shadow-md" />
                    </div>
                  </div>
                )}

                {/* New Block Preview */}
                {isAdding && addingDate === dateStr && (
                  <div
                    className="absolute left-12 right-3 rounded-xl z-20 border-2 border-dashed animate-pulse"
                    style={{
                      top: hourToPx(9),
                      height: hourToPx(10) - hourToPx(9),
                      background: `${CATEGORY_COLORS['其他']}30`,
                      borderColor: CATEGORY_COLORS['其他'],
                    }}
                  >
                    <div className="px-4 py-3 h-full flex items-center">
                      <p className="text-sm font-medium" style={{ color: '#3A3638' }}>
                        + 新活动
                      </p>
                    </div>
                  </div>
                )}

                {/* 🎯 任务拖拽预览块 - Optimization #1 */}
                {isDraggingTask && dragPreviewPosition.visible && dragDayIndex === dayIndex && (
                  <div
                    className="absolute left-12 right-3 rounded-xl z-40 pointer-events-none transition-all duration-75"
                    style={{
                      top: dragPreviewPosition.top,
                      height: dragPreviewPosition.height,
                      background: 'linear-gradient(135deg, rgba(121, 190, 235, 0.7) 0%, rgba(121, 190, 235, 0.5) 100%)',
                      border: '2px solid #79BEEB',
                      boxShadow: '4px 4px 0px rgba(121, 190, 235, 0.3)',
                    }}
                  >
                    <div className="px-4 py-3 h-full flex items-center">
                      <div className="w-2 h-2 rounded-full bg-white/80 mr-2" />
                      <p className="text-sm font-semibold" style={{ color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                        安排到这里
                      </p>
                    </div>
                  </div>
                )}

                {/* Planned Tasks (from Tasks that have scheduled time) */}
                {(() => {
                  // 筛选: 有计划时间的任务，并且时间在这一天
                  const plannedTasksForDay = tasks.filter(task => {
                    if (task.status === 'completed') return false
                    if (!task.scheduledStartTime) return false
                    const taskDate = task.scheduledStartTime.slice(0, 10)
                    return taskDate === dateStr
                  })

                  return plannedTasksForDay.map(task => {
                    const startHour = timeToHour(task.scheduledStartTime!)
                    const durationHours = (task.estimatedMinutes || 60) / 60
                    const endHour = Math.min(startHour + durationHours, END_HOUR)
                    const top = dayIndex * DAY_HEIGHT + hourToPx(startHour)
                    const height = hourToPx(endHour) - hourToPx(startHour)

                    // 任务的优先级颜色
                    const priorityColor = task.priority >= 4 ? '#F87171' :
                                          task.priority >= 3 ? '#D4C4FB' : '#79BEEB'

                    return (
                      <div
                        key={`planned-${task.id}`}
                        className="absolute rounded-xl cursor-pointer transition-all z-10 hover:shadow-md hover:scale-[1.005]"
                        style={{
                          top: Math.max(0, top),
                          height: Math.max(30, height),
                          left: 'calc(48px + 2%)',
                          right: 'calc(12px + 2%)',
                          background: `repeating-linear-gradient(
                            45deg,
                            ${priorityColor}30,
                            ${priorityColor}30 8px,
                            ${priorityColor}20 8px,
                            ${priorityColor}20 16px
                          )`,
                          border: `2px dashed ${priorityColor}`,
                          boxShadow: 'none',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          // 点击计划任务可以开始专注
                          startFocusSession(task)
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setContextMenuPlannedTask(task)
                          setContextMenuPos({ x: e.clientX, y: e.clientY })
                          setShowPlannedTaskContextMenu(true)
                        }}
                      >
                        <div className="px-4 py-2 h-full overflow-hidden flex flex-col justify-center">
                          <p className="text-sm font-semibold truncate drop-shadow-sm" style={{ color: '#3A3638' }}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-1 flex-wrap">
                            <p className="text-xs" style={{ color: '#5C5658' }}>
                              {task.project || '未分类'}
                            </p>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                              style={{ background: `${priorityColor}40`, color: priorityColor }}
                            >
                              TASK
                            </span>
                            {task.priority >= 4 && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                                style={{ background: 'rgba(248, 113, 113, 0.2)', color: '#F87171' }}
                              >
                                🔥 HIGH
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}

                {/* Time Blocks */}
                {(() => {
                  const blockLayout = calculateBlockLayout(blocks)

                  return blocks.map(block => {
                    const isResizingThis = resizeBlockId === block.id
                    const isMovingThis = moveBlockId === block.id

                    // 🎯 跨天拖拽时，只在目标日期渲染预览块
                    if (isMovingThis) {
                      const currentBlockDate = block.startTime.slice(0, 10)
                      // 如果当前渲染的日期不是拖拽目标日期，不渲染这个块
                      if (currentBlockDate !== moveDate) {
                        return null
                      }
                    }

                    let style = getGlobalBlockStyle(block, dayIndex)

                    if (isResizingThis && resizeType) {
                      const previewTop = dayIndex * DAY_HEIGHT + hourToPx(resizePreviewStart)
                      const previewHeight = hourToPx(resizePreviewEnd) - hourToPx(resizePreviewStart)
                      style = { top: previewTop, height: previewHeight }
                    } else if (isMovingThis) {
                      const duration = moveOriginalEnd - moveOriginalStart
                      // 在正确的日期内计算预览位置
                      const previewTop = dayIndex * DAY_HEIGHT + hourToPx(movePreviewStart)
                      const previewHeight = hourToPx(movePreviewStart + duration) - hourToPx(movePreviewStart)
                      style = { top: previewTop, height: previewHeight }
                    }

                    const layout = blockLayout.get(block.id) || { left: 0, width: 95, colIndex: 0, totalCols: 1 }
                    const color = CATEGORY_COLORS[block.category] || CATEGORY_COLORS['其他']

                    const now = new Date()
                    const blockStart = new Date(block.startTime)
                    const isFuture = blockStart > now

                    // 只有真正的自动追踪事件才显示 AUTO 样式
                    // 手动添加的 = 已确认的 = 完整样式
                    const showAutoStyle = block.source === 'auto'

                    const startHour = timeToHour(block.startTime)
                    const endHourVal = timeToHour(block.endTime)
                    const blockHeight = hourToPx(endHourVal) - hourToPx(startHour)
                    const showStatusTags = blockHeight > 55  // 足够高才显示完整标签

                    const isBlockSelected = selectedBlockIds.has(block.id)
                    const isHovered = hoveredBlockId === block.id

                    return (
                      <div
                        key={block.id}
                        className="absolute"
                        style={{
                          top: style.top,
                          height: style.height,
                          left: `calc(48px + ${layout.left}%)`,
                          right: `calc(12px + ${100 - layout.left - layout.width}%)`,
                          zIndex: isBlockSelected || isHovered ? 50 : undefined,
                        }}
                        onMouseEnter={() => setHoveredBlockId(block.id)}
                        onMouseLeave={() => setHoveredBlockId(null)}
                      >
                        {/* ======================
                            主时间块
                            ====================== */}
                        <div
                          className={`time-block w-full h-full rounded-xl cursor-move ${
                            isBlockSelected ? 'ring-2 ring-offset-2' : ''
                          } ${isResizingThis || isMovingThis ? 'shadow-lg scale-[1.01] transition-all' : 'transition-all duration-200 ease-in-out hover:scale-[1.01] hover:shadow-xl'}`}
                          style={{
                            // ======================
                            // 🎨 三种状态视觉系统 - 差异最大化
                            // ======================
                            background: isFuture
                              // 1. 🗓️ 未来计划: 纯实色
                              ? color
                              : showAutoStyle
                                // 2. 🔍 待确认/进行中: 更深的彩色斜线纹理（增强对比度）
                                ? `repeating-linear-gradient(
                                    45deg,
                                    ${color}70,
                                    ${color}70 4px,
                                    ${color}30 4px,
                                    ${color}30 8px
                                  )`
                                // 3. ✓ 已确认(过去): 浅灰色底色
                                : 'rgba(120, 120, 120, 0.25)',
                            // 边框区分 - 按你要求重新设计
                            border: isFuture
                              ? `2px solid ${color}`  // 未来: 实色实线边框
                              : showAutoStyle
                                ? `2px dashed ${color}`  // 待确认: 虚线实色边框
                                : `4px solid ${color}`,  // 已确认(过去): 彩色加粗实线边框
                            opacity: 1,
                            boxShadow: isBlockSelected
                              ? `0 0 0 2px ${color}, 4px 4px 12px rgba(0,0,0,0.15)`
                              : '2px 2px 8px rgba(0,0,0,0.08)',
                            '--tw-ring-color': color,
                          } as React.CSSProperties}
                          onClick={(e) => handleBlockClick(e, block)}
                          onMouseDown={(e) => startMove(e, block)}
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            // 双击：打开完整编辑弹窗
                            setInlineEditingId(null)
                            setEditingBlock(block)
                          }}
                          onContextMenu={(e) => handleContextMenu(e, block)}
                        >
                          {/* ============================================
                              ✅ 左上角选中复选框 - 悬浮/已选中时显示
                              ============================================ */}
                          {(isHovered || isBlockSelected) && !inlineEditingId && (
                            <button
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-10"
                              style={{
                                background: isBlockSelected ? color : 'rgba(255,255,255,0.8)',
                                borderColor: color,
                                cursor: 'pointer',
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleBlockSelection(block.id)
                              }}
                            >
                              {isBlockSelected && (
                                <span className="text-white text-xs font-bold">✓</span>
                              )}
                            </button>
                          )}

                          {/* ============================================
                              🎯 时间范围 - 右上角显示
                              ============================================ */}
                          <p
                            className="absolute font-mono text-right"
                            style={{
                              top: '6px',
                              right: '8px',
                              color: '#3A3638',
                              fontSize: '11px',
                              opacity: 0.95,
                            }}
                          >
                            {formatTimeOnly(block.startTime)} - {formatTimeOnly(block.endTime)}
                          </p>

                          {/* ============================================
                              左侧分类圆点 - 向右偏移，给复选框留位置
                              ============================================ */}
                          {!isHovered && !isBlockSelected && (
                            <div
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
                              style={{
                                background: color,
                                borderColor: isFuture
                                  ? `${color}60`
                                  : showAutoStyle
                                    ? 'rgba(255,255,255,0.5)'
                                    : 'rgba(255,255,255,0.8)',
                                boxShadow: isFuture || showAutoStyle
                                  ? 'none'
                                  : '0 1px 3px rgba(0,0,0,0.15)',
                              }}
                            />
                          )}

                          {/* Top Resize Handle */}
                          <div
                            className="resize-handle absolute top-0 left-4 right-4 cursor-ns-resize opacity-0 hover:opacity-100 transition-all"
                            style={{ height: DRAG_EDGE_HEIGHT }}
                            onMouseDown={(e) => startResize(e, block, 'top', dayIndex)}
                          >
                            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/30" />
                          </div>

                          {/* ============================================
                              🏆 块内内容 - 视觉分层：
                              1. 标题 (最重) - 左下方区域，统一白色文字
                              2. 分类标签 (次之) - 白色半透明圆角背景框
                              3. 状态标签 (最轻) - 不同状态明显区分
                              ============================================ */}
                          <div className="h-full overflow-hidden flex flex-col justify-center" style={{ paddingLeft: '28px', paddingRight: '12px', paddingTop: '18px', paddingBottom: '6px' }}>
                            {/* 1. 标题 - 单击标题行可内联编辑 */}
                            {inlineEditingId === block.id ? (
                              <input
                                autoFocus
                                value={inlineTitle}
                                onChange={(e) => setInlineTitle(e.target.value)}
                                onBlur={() => handleInlineEditSave(block)}
                                onKeyDown={(e) => handleInlineEditKeyDown(e, block)}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="w-full bg-white/80 rounded px-2 py-1 outline-none border-2 border-blue-400"
                                style={{
                                  color: '#3A3638',
                                  fontSize: '14px',
                                  lineHeight: '18px',
                                  marginBottom: '6px',
                                }}
                              />
                            ) : (
                              <p
                                className="truncate font-bold cursor-text"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setInlineEditingId(block.id)
                                  setInlineTitle(block.title)
                                }}
                                style={{
                                  color: '#3A3638',
                                  fontSize: '14px',
                                  lineHeight: '18px',
                                  marginBottom: '6px',
                                }}
                              >
                                {block.title}
                              </p>
                            )}

                            {/* 2. 分类标签 - 自适应文字长度的圆角背景框 */}
                            <span
                              className="inline-flex px-2 py-0.5 rounded-full w-fit"
                              style={{
                                background: `${color}40`,
                                color: '#3A3638',
                                fontSize: '10px',
                                lineHeight: '14px',
                              }}
                            >
                              {block.category}
                            </span>

                            {/* 3. 状态标签 */}
                            {showStatusTags && isFuture && (
                              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                <span
                                  className="px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    background: `${color}40`,
                                    color: '#5C5658',
                                    fontSize: '9px',
                                  }}
                                >
                                  📅 计划中
                                </span>
                              </div>
                            )}

                          </div>

                          {/* ============================================
                              待确认图标 - 右下角勾选按钮，点击确认单个
                              ============================================ */}
                          {showAutoStyle && (
                            <button
                              className="absolute bottom-2 right-2 flex items-center justify-center w-7 h-7 rounded-full hover:scale-110 transition-transform z-10"
                              style={{
                                background: color,
                                color: 'white',
                                fontSize: '14px',
                                cursor: 'pointer',
                              }}
                              onClick={async (e) => {
                                e.stopPropagation()
                                await dataService.updateTimeBlock(block.id, { source: 'confirmed' })
                                await loadDayBlocks(new Date(block.startTime), true)
                                success('已确认')
                              }}
                            >
                              ✓
                            </button>
                          )}

                          {/* Bottom Resize Handle */}
                          <div
                            className="resize-handle absolute bottom-0 left-4 right-4 cursor-ns-resize opacity-0 hover:opacity-100 transition-all"
                            style={{ height: DRAG_EDGE_HEIGHT }}
                            onMouseDown={(e) => startResize(e, block, 'bottom', dayIndex)}
                          >
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/30" />
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}

              </div>
            )
          })}

          {/* Loading indicator at bottom */}
          {loadingDays.size > 0 && (
            <div className="py-8 text-center">
              <div className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs mt-2" style={{ color: '#9E9899' }}>加载中...</p>
            </div>
          )}
        </div>

        {/* ============================================
            📋 底部批量操作栏 - 选中块时显示
            ============================================ */}
        {selectedBlockIds.size > 0 && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl flex items-center gap-4"
            style={{
              background: '#FFFFFF',
              border: '2px solid #D6D3CD',
              boxShadow: '8px 8px 0px rgba(0,0,0,0.1)',
            }}
          >
            <span className="text-sm font-medium" style={{ color: '#5C5658' }}>
              已选中 {selectedBlockIds.size} 个事件
            </span>
            <button
              onClick={() => {
                // 全选当前日期的所有块
                const dateStr = formatDateYMD(selectedDate)
                const blocks = loadedBlocks.get(dateStr) || []
                setSelectedBlockIds(new Set(blocks.map(b => b.id)))
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-blue-50"
              style={{ color: '#3B82F6' }}
            >
              全选当天
            </button>
            <button
              onClick={() => {
                // 全选所有待确认的块
                const pendingIds: string[] = []
                loadedBlocks.forEach(blocks => {
                  blocks.forEach(b => {
                    if (b.source === 'auto') pendingIds.push(b.id)
                  })
                })
                setSelectedBlockIds(new Set(pendingIds))
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-yellow-50"
              style={{ color: '#F59E0B' }}
            >
              全选待确认
            </button>
            <button
              onClick={() => {
                // 全选所有可见块
                const allIds: string[] = []
                loadedBlocks.forEach(blocks => {
                  blocks.forEach(b => allIds.push(b.id))
                })
                setSelectedBlockIds(new Set(allIds))
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-gray-100"
              style={{ color: '#3A3638' }}
            >
              全选全部
            </button>
            <button
              onClick={openBatchConfirmDialog}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-green-50"
              style={{ color: '#10B981' }}
            >
              批量确认
            </button>
            <button
              onClick={() => {
                setShowDeleteConfirm(true)
              }}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-red-50"
              style={{ color: '#EF4444' }}
            >
              批量删除
            </button>
            <button
              onClick={() => setSelectedBlockIds(new Set())}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-gray-100"
              style={{ color: '#9E9899' }}
            >
              取消
            </button>
          </div>
        )}
      </div>

      {/* Resize Handle for Sidebar */}
      <div
        className="w-1 cursor-ew-resize hover:bg-blue-400 transition-colors flex-shrink-0 h-screen relative group"
        style={{
          background: isResizingSidebar ? '#79BEEB' : 'transparent',
          marginLeft: '-4px',
        }}
        onMouseDown={handleSidebarResizeStart}
      >
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 rounded-full transition-colors"
          style={{
            background: isResizingSidebar ? '#79BEEB' : '#D6D3CD',
          }}
        />
      </div>

      {/* Right Sidebar */}
      <div
        className="p-6 pl-2 flex-shrink-0 overflow-y-auto h-screen"
        style={{ width: `${sidebarWidth}px` }}
      >

        {/* 🧭 关注现在 - 上下文智能卡片（三状态自动切换） */}
        <ContextCard
          tasks={tasks}
          todayBlocks={todayBlocks}
          wasInterrupted={wasInterrupted}
          recentEndTime={recentEndTime}
          onStartFocus={startFocusSession}
          className="mb-4"
        />

        {/* 🏆 今日成就 */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{
            background: '#FFFFFF',
            border: '2px solid #D6D3CD',
            boxShadow: '4px 4px 0px #D6D3CD',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🏆</span>
            <h3 className="font-semibold" style={{ color: '#3A3638' }}>今日成就</h3>
          </div>

          {(() => {
            const todayStr = formatDateYMD(selectedDate)
            const blocks = loadedBlocks.get(todayStr) || []
            if (blocks.length === 0) {
              return (
                <div className="text-center py-6">
                  <p className="text-sm" style={{ color: '#9E9899' }}>
                    今天还没有记录任何时间 🕐
                  </p>
                  <p className="text-xs mt-2" style={{ color: '#D6D3CD' }}>
                    开始专注或添加时间块来追踪你的时间
                  </p>
                </div>
              )
            }

            const aggregated = aggregateBlocksByCategory(blocks)

            return (
              <div className="space-y-3">
                {aggregated.map((item) => {
                  const isExpanded = expandedCategory === item.category
                  const icon = CATEGORY_ICONS[item.category] || '📌'

                  return (
                    <div
                      key={item.category}
                      className="rounded-xl transition-all cursor-pointer hover:shadow-md overflow-hidden"
                      style={{
                        background: '#FAF8F5',
                        border: '1px solid #E8E6E1',
                      }}
                      onClick={() => setExpandedCategory(isExpanded ? null : item.category)}
                    >
                      {/* 点击整个头部切换展开状态 */}
                      <div className="flex items-center gap-2 p-3">
                        <span className="text-lg">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm" style={{ color: '#3A3638' }}>
                            {item.category}
                          </p>
                          <p className="text-xs" style={{ color: '#9E9899' }}>
                            {item.count} 个时间块 · 总共 {formatDuration(item.totalMinutes)}
                          </p>
                        </div>
                        {/* 右侧小箭头图标 */}
                        <ChevronDown
                          size={18}
                          style={{
                            color: '#9E9899',
                            transition: 'transform 0.2s ease',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                          }}
                        />
                      </div>

                      {/* 展开后显示的时间列表 */}
                      {isExpanded && (
                        <div
                          className="px-3 pb-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="pt-3 border-t" style={{ borderColor: '#E8E6E1' }}>
                            {item.blocks.map((block) => (
                              <div key={block.id} className="flex items-center justify-between py-1.5">
                                <span className="text-xs" style={{ color: '#9E9899' }}>
                                  {formatTimeOnly(block.startTime)} - {formatTimeOnly(block.endTime)}
                                </span>
                                <span className="text-xs truncate ml-3" style={{ color: '#3A3638' }}>
                                  {block.title}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* TODO: AI 智能鼓励文案 - 接入 LLM 后根据具体活动动态生成
                                示例："今天学习了3小时英语 - 既背了单词，又做了听力 👏" */}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>

        {/* 🧭 上下文智能卡片 - 只有有内容时才渲染 */}
        {(() => {
          const continuousFocusMinutes = getContinuousFocusMinutes()
          const hasContent = pendingEvent || (continuousFocusMinutes > 0 && !isOnBreak)

          if (!hasContent) return null

          return (
            <div
              className="rounded-2xl p-5 mb-4"
              style={{
                background: '#FFFFFF',
                border: '2px solid #D6D3CD',
                boxShadow: '4px 4px 0px #D6D3CD',
              }}
            >
              {/* ============================================
              // 🔴 状态 1: 被打断后刚回来（有分心检测事件）
              // ============================================ */}
              {pendingEvent && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
                    <h3 className="font-semibold text-sm" style={{ color: '#DC2626' }}>
                      你刚才分心了 {pendingEvent.durationMinutes} 分钟
                    </h3>
                  </div>
                  <p className="text-sm mb-4" style={{ color: '#5C5658' }}>
                    你在使用「<span className="font-medium" style={{ color: '#3A3638' }}>{pendingEvent.appName}</span>」
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => useFocusStore.getState().handleUserChoice('work', pendingEvent.id)}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: '#34D39920', color: '#34D399' }}
                    >
                      这是工作
                    </button>
                    <button
                      onClick={() => useFocusStore.getState().handleUserChoice('break', pendingEvent.id)}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: '#79BEEB20', color: '#79BEEB' }}
                    >
                      我在休息
                    </button>
                    <button
                      onClick={() => useFocusStore.getState().handleUserChoice('distraction', pendingEvent.id)}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: '#DC262620', color: '#DC2626' }}
                    >
                      分心了
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================
              // 🟢 状态 2: 连续专注中
              // ============================================ */}
              {continuousFocusMinutes > 0 && !isOnBreak && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                    <h3 className="font-semibold text-sm" style={{ color: '#34D399' }}>
                      好状态！连续专注中
                    </h3>
                  </div>
                  <div className="text-center py-4">
                    <p className="text-3xl font-bold mb-2" style={{ color: '#3A3638' }}>
                      {continuousFocusMinutes}
                    </p>
                    <p className="text-sm" style={{ color: '#9E9899' }}>分钟</p>
                  </div>
                  <button
                    onClick={() => useFocusStore.getState().startBreak(5)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                    style={{ background: '#A8E6CF40', color: '#2E7D32' }}
                  >
                    ☕ 休息 5 分钟
                  </button>
                </div>
              )}
            </div>
          )
        })()}

        {/* 时间块编辑 - 居中弹窗 */}
        {editingBlock && !isAdding && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            onClick={() => setEditingBlock(null)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <DetailPanel
                data={editingBlock}
                mode="edit"
                onClose={() => setEditingBlock(null)}
                onSave={(updated) => {
                  saveBlockChanges(updated)
                  setEditingBlock(null)
                }}
                onDelete={() => {
                  setSelectedBlock(editingBlock)
                  setShowDeleteConfirm(true)
                  setEditingBlock(null)
                }}
              />
            </div>
          </div>
        )}

        {/* 任务编辑 - 居中弹窗 */}
        {editingTask && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            onClick={() => setEditingTask(null)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <DetailPanel
                data={editingTask}
                mode="edit"
                onClose={() => setEditingTask(null)}
                onSave={(updated) => {
                  dataService.updateTask(editingTask.id, updated)
                  setForceRefresh(prev => prev + 1)
                  setEditingTask(null)
                  success('任务已更新')
                }}
                onDelete={() => {
                  dataService.deleteTask(editingTask.id)
                  setForceRefresh(prev => prev + 1)
                  setEditingTask(null)
                  success('任务已删除')
                }}
              />
            </div>
          </div>
        )}


        {/* 📋 待安排任务列表 */}
        <UnscheduledTaskList
          key={forceRefresh}
          tasks={tasks}
          onTaskDragStart={handleTaskDragStart}
          onTaskClick={(task) => setEditingTask(task)}
          onStartFocus={startFocusSession}
          onEditTask={(task) => setEditingTask(task)}
          onDeleteTask={(task) => {
            setTaskToDelete(task)
            setShowTaskDeleteConfirm(true)
          }}
          className="mt-4"
        />
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={selectedBlockIds.size > 0 ? '批量删除事件' : '删除事件'}
        message={selectedBlockIds.size > 0 ? `确定要删除选中的 ${selectedBlockIds.size} 个事件吗？此操作无法撤销。` : '确定要删除这个事件吗？此操作无法撤销。'}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showBatchConfirm}
        onClose={() => setShowBatchConfirm(false)}
        onConfirm={executeBatchConfirm}
        title="批量确认事件"
        message={`确定要确认选中的 ${selectedBlockIds.size} 个事件吗？确认后这些时间块将被标记为已确认状态。`}
        confirmText="确认"
        cancelText="取消"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={showTaskDeleteConfirm}
        onClose={() => {
          setShowTaskDeleteConfirm(false)
          setTaskToDelete(null)
        }}
        onConfirm={() => {
          if (taskToDelete) {
            dataService.deleteTask(taskToDelete.id)
            setForceRefresh(prev => prev + 1)
            success('任务已删除')
            setShowTaskDeleteConfirm(false)
            setTaskToDelete(null)
          }
        }}
        title="删除任务"
        message={taskToDelete ? `确定要删除任务「${taskToDelete.title}」吗？此操作无法撤销。` : '确定要删除这个任务吗？此操作无法撤销。'}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />

      {/* 右键菜单 */}
      {showContextMenu && contextMenuBlock && (
        <div
          className="fixed z-50 rounded-xl py-2"
          style={{
            left: contextMenuPos.x,
            top: contextMenuPos.y,
            background: '#FFFFFF',
            border: '2px solid #D6D3CD',
            boxShadow: '8px 8px 0px rgba(0,0,0,0.1)',
            minWidth: 180,
          }}
        >
          {contextMenuBlock.source === 'auto' && (
            <button
              onClick={() => {
                dataService.updateTimeBlock(contextMenuBlock.id, { source: 'confirmed' })
                const dateStr = contextMenuBlock.startTime.slice(0, 10)
                setLoadedBlocks(prev => {
                  const next = new Map(prev)
                  next.delete(dateStr)
                  return next
                })
                setShowContextMenu(false)
                success('已确认')
              }}
              className="w-full px-4 py-2.5 text-left text-sm transition-all hover:bg-gray-50 flex items-center gap-2"
              style={{ color: '#3A3638' }}
            >
              <CheckCircle2 size={14} style={{ color: '#34D399' }} />
              确认此条记录
            </button>
          )}
          <button
            onClick={() => splitBlock(contextMenuBlock)}
            className="w-full px-4 py-2.5 text-left text-sm transition-all hover:bg-gray-50 flex items-center gap-2"
            style={{ color: '#3A3638' }}
          >
            <Scissors size={14} style={{ color: '#FB923C' }} />
            拆分时间块
          </button>
          <button
            onClick={() => mergeAdjacentBlocks(contextMenuBlock)}
            className="w-full px-4 py-2.5 text-left text-sm transition-all hover:bg-gray-50 flex items-center gap-2"
            style={{ color: '#3A3638' }}
          >
            <Merge size={14} style={{ color: '#D4C4FB' }} />
            合并相邻同类块
          </button>
          <div className="my-1 mx-2" style={{ borderTop: '1px solid #E8E6E1' }} />
          <button
            onClick={() => {
              setShowContextMenu(false)
              setEditingBlock(contextMenuBlock)
            }}
            className="w-full px-4 py-2.5 text-left text-sm transition-all hover:bg-gray-50 flex items-center gap-2"
            style={{ color: '#3A3638' }}
          >
            <Edit size={14} style={{ color: '#60A5FA' }} />
            编辑详情
          </button>
          <button
            onClick={() => {
              setSelectedBlock(contextMenuBlock)
              setShowContextMenu(false)
              setShowDeleteConfirm(true)
            }}
            className="w-full px-4 py-2.5 text-left text-sm transition-all hover:bg-red-50 flex items-center gap-2"
            style={{ color: '#DC2626' }}
          >
            <Trash2 size={14} />
            删除
          </button>
        </div>
      )}

      {/* Planned Task Context Menu */}
      {showPlannedTaskContextMenu && contextMenuPlannedTask && (
        <div
          className="fixed z-50 rounded-xl py-2"
          style={{
            left: contextMenuPos.x,
            top: contextMenuPos.y,
            background: '#FFFFFF',
            border: '2px solid #D6D3CD',
            boxShadow: '8px 8px 0px rgba(0,0,0,0.1)',
            minWidth: 180,
          }}
        >
          <button
            onClick={() => {
              startFocusSession(contextMenuPlannedTask)
              setShowPlannedTaskContextMenu(false)
            }}
            className="w-full px-4 py-2.5 text-left text-sm transition-all hover:bg-gray-50 flex items-center gap-2"
            style={{ color: '#3A3638' }}
          >
            <Play size={14} style={{ color: '#34D399' }} />
            开始专注
          </button>
          <button
            onClick={async () => {
              try {
                await dataService.updateTask(contextMenuPlannedTask.id, {
                  scheduledStartTime: undefined,
                  scheduledDate: undefined,
                })
                setShowPlannedTaskContextMenu(false)
                success('已取消安排')
              } catch (err) {
                console.error('Failed to unschedule task:', err)
                error('取消安排失败')
              }
            }}
            className="w-full px-4 py-2.5 text-left text-sm transition-all hover:bg-gray-50 flex items-center gap-2"
            style={{ color: '#3A3638' }}
          >
            <CalendarOff size={14} style={{ color: '#79BEEB' }} />
            取消安排
          </button>
        </div>
      )}

      {/* 🎯 右下角悬浮 + 号按钮 */}
      <button
        onClick={() => {
          setAddingDate(formatDateYMD(selectedDate))
          setIsAdding(true)
        }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 hover:shadow-2xl z-50"
        style={{ background: '#79BEEB' }}
      >
        <Plus size={24} color="white" />
      </button>

      {/* 📝 添加时间块 - 使用 DetailPanel 统一组件 */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={closePanel}>
          <div onClick={(e) => e.stopPropagation()}>
            <DetailPanel
              data={null}
              mode="add"
              defaultDate={addingDate}
              onClose={closePanel}
              onSave={(newBlock) => addTimeBlock(newBlock)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
