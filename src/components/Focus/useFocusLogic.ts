import { useMemo, useEffect, useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { Task } from '../../services/dataService'

/**
 * 统一的 Focus 逻辑 Hook
 * 所有 Focus 相关的组件都应该使用这个 Hook 来获取状态和操作
 */
export function useFocusLogic() {
  // 状态
  const focusState = useAppStore((s) => s.focusState)
  const focusTimeLeft = useAppStore((s) => s.focusTimeLeft)
  const focusSessions = useAppStore((s) => s.focusSessions)
  const focusSettings = useAppStore((s) => s.focusSettings)
  const currentFocusTaskId = useAppStore((s) => s.currentFocusTaskId)
  const tasks = useAppStore((s) => s.tasks)

  // 操作
  const startFocus = useAppStore((s) => s.startFocus)
  const pauseFocus = useAppStore((s) => s.pauseFocus)
  const resetFocus = useAppStore((s) => s.resetFocus)
  const tickFocus = useAppStore((s) => s.tickFocus)
  const skipBreak = useAppStore((s) => s.skipBreak)
  const addToast = useAppStore((s) => s.addToast)

  // 当前专注的任务
  const currentFocusTask = useMemo(() => {
    if (!currentFocusTaskId) return null
    return tasks.find((t) => t.id === currentFocusTaskId) || null
  }, [currentFocusTaskId, tasks])

  // 自动 tick 计时器
  useEffect(() => {
    if (focusState === 'idle') return

    const interval = setInterval(() => {
      tickFocus()
    }, 1000)

    return () => clearInterval(interval)
  }, [focusState, tickFocus])

  // 格式化时间 - MM:SS
  const formatMMSS = useCallback((totalSeconds: number): string => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [])

  // 格式化时间 - HH:MM:SS
  const formatHHMMSS = useCallback((totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [])

  // 计算已过去的时间
  const elapsedSeconds = useMemo(() => {
    const totalSeconds =
      focusState === 'working'
        ? focusSettings.workMinutes * 60
        : focusState === 'break'
          ? focusSettings.breakMinutes * 60
          : focusState === 'longBreak'
            ? focusSettings.longBreakMinutes * 60
            : 0
    return Math.max(0, totalSeconds - focusTimeLeft)
  }, [focusState, focusTimeLeft, focusSettings])

  // 进度百分比
  const progressPercent = useMemo(() => {
    const totalSeconds =
      focusState === 'working'
        ? focusSettings.workMinutes * 60
        : focusState === 'break'
          ? focusSettings.breakMinutes * 60
          : focusState === 'longBreak'
            ? focusSettings.longBreakMinutes * 60
            : 0
    if (totalSeconds === 0) return 0
    return Math.round((elapsedSeconds / totalSeconds) * 100)
  }, [focusState, elapsedSeconds, focusSettings])

  // 开始专注 - 带 Toast
  const handleStartFocus = useCallback(
    (taskId?: string, durationMinutes?: number) => {
      startFocus(taskId, durationMinutes)
      addToast('success', '专注已开始！')
    },
    [startFocus, addToast]
  )

  // 暂停专注 - 带 Toast
  const handlePauseFocus = useCallback(() => {
    pauseFocus()
    addToast('info', '专注已暂停')
  }, [pauseFocus, addToast])

  // 重置专注 - 带 Toast
  const handleResetFocus = useCallback(() => {
    resetFocus()
    addToast('info', '专注已重置')
  }, [resetFocus, addToast])

  // 跳过休息 - 带 Toast
  const handleSkipBreak = useCallback(() => {
    skipBreak()
    addToast('info', '休息已跳过')
  }, [skipBreak, addToast])

  return {
    // 状态
    isIdle: focusState === 'idle',
    isWorking: focusState === 'working',
    isBreak: focusState === 'break',
    isLongBreak: focusState === 'longBreak',
    isPaused: focusState === 'idle' && focusSessions > 0,
    focusState,
    focusTimeLeft,
    focusSessions,
    focusSettings,
    currentFocusTaskId,
    currentFocusTask: currentFocusTask as Task | null,
    elapsedSeconds,
    progressPercent,

    // 格式化
    formatMMSS,
    formatHHMMSS,

    // 操作
    startFocus: handleStartFocus,
    pauseFocus: handlePauseFocus,
    resetFocus: handleResetFocus,
    skipBreak: handleSkipBreak,
  }
}

export default useFocusLogic
