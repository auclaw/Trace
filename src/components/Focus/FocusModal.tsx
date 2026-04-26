import { useState, useEffect } from 'react'
import { X, Minus, Pause, Play, RotateCcw, SkipForward, Square } from 'lucide-react'
import { useFocusLogic } from './useFocusLogic'
import { useAppStore } from '../../store/useAppStore'
import type { Task } from '../../services/dataService'

// 预设的专注时长选项
const FOCUS_DURATION_OPTIONS = [5, 15, 25, 45, 60]

// 窗口模式类型
export type FocusWindowMode = 'fullscreen' | 'window' | 'minimized'

interface FocusModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: FocusWindowMode
  preselectedTask?: Task | null
}

export default function FocusModal({
  isOpen,
  onClose,
  initialMode = 'fullscreen',
  preselectedTask,
}: FocusModalProps) {
  const [windowMode, setWindowMode] = useState<FocusWindowMode>(initialMode)
  const [selectedDuration, setSelectedDuration] = useState(25)
  const [localTaskId, setLocalTaskId] = useState<string | null>(null)

  const addToast = useAppStore((s) => s.addToast)

  const {
    isIdle,
    isWorking,
    isBreak,
    isLongBreak,
    focusTimeLeft,
    focusSessions,
    focusSettings,
    currentFocusTask,
    currentFocusTaskId,
    progressPercent,
    formatMMSS,
    startFocus,
    pauseFocus,
    resetFocus,
    skipBreak,
  } = useFocusLogic()

  // 同步外部传入的预设任务
  useEffect(() => {
    if (preselectedTask && isOpen) {
      setLocalTaskId(preselectedTask.id)
    }
  }, [preselectedTask, isOpen])

  // 打开时重置本地状态
  useEffect(() => {
    if (isOpen) {
      setWindowMode(initialMode)
      if (!currentFocusTaskId) {
        setLocalTaskId(preselectedTask?.id || null)
      }
    }
  }, [isOpen, initialMode, currentFocusTaskId, preselectedTask])

  // 真正使用的任务 ID（优先全局专注中的任务，其次本地选择，最后预设）
  const effectiveTaskId = currentFocusTaskId || localTaskId

  // 处理开始按钮
  const handleStart = () => {
    const taskIdToUse = effectiveTaskId || undefined
    startFocus(taskIdToUse, selectedDuration)
    addToast('success', '开始专注！')
  }

  // 暂停
  const handlePause = () => {
    pauseFocus()
    addToast('info', '已暂停专注')
  }

  // 重置/放弃
  const handleReset = () => {
    const totalMinutes = Math.round((focusSettings.workMinutes * 60 - focusTimeLeft) / 60)
    resetFocus()
    if (isWorking && totalMinutes > 0) {
      addToast('info', `已放弃专注，累计 ${totalMinutes} 分钟`)
    } else {
      addToast('info', '已重置计时器')
    }
  }

  // 跳过休息
  const handleSkipBreak = () => {
    skipBreak()
    addToast('info', '休息已跳过')
  }

  // 切换到窗口模式
  const setWindowModeWithToast = (mode: FocusWindowMode) => {
    setWindowMode(mode)
    if (mode === 'minimized') {
      addToast('info', '已最小化到托盘，点击图标恢复')
    }
  }

  // 如果没打开，返回 null
  if (!isOpen) return null

  // ──────────────────────────────────────────────────────
  // 📱 最小化模式 - 右下角小浮窗
  // ──────────────────────────────────────────────────────
  if (windowMode === 'minimized') {
    const bgColor = isWorking ? '#79BEEB' : isBreak || isLongBreak ? '#A8E6CF' : '#D4C4FB'
    const textColor = 'white'

    return (
      <div
        className="fixed right-5 bottom-5 z-[100] cursor-pointer hover:scale-105 transition-all duration-200"
        onClick={() => setWindowModeWithToast('fullscreen')}
      >
        <div
          className="px-4 py-3 rounded-2xl flex items-center gap-3"
          style={{
            background: bgColor,
            boxShadow: '4px 4px 0px rgba(0,0,0,0.15)',
          }}
        >
          <span className="text-xl">🍅</span>
          <div>
            <div
              className="text-lg font-bold font-mono tabular-nums"
              style={{ color: textColor }}
            >
              {formatMMSS(focusTimeLeft)}
            </div>
            {isWorking && (
              <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                专注中...
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="ml-1 p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X size={14} color="white" />
          </button>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────
  // 🖥️ 全屏模式 / 窗口模式
  // ──────────────────────────────────────────────────────
  const isFullscreen = windowMode === 'fullscreen'

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center transition-all duration-200 ${
        isFullscreen ? 'bg-black/40 backdrop-blur-sm' : 'pointer-events-none'
      }`}
    >
      <div
        className={`pointer-events-auto w-full max-w-md mx-4 rounded-3xl p-8 relative transition-all duration-200 ${
          !isFullscreen ? 'shadow-2xl' : ''
        }`}
        style={{
          background: '#FFFFFF',
          border: '2px solid #D6D3CD',
          boxShadow: isFullscreen ? '8px 8px 0px rgba(0,0,0,0.1)' : '12px 12px 30px rgba(0,0,0,0.15)',
          position: isFullscreen ? 'relative' : ('fixed' as any),
          right: isFullscreen ? undefined : '24px',
          bottom: isFullscreen ? undefined : '24px',
        }}
      >
        {/* ─── 顶部控制按钮 ─── */}
        <div className="absolute top-4 right-4 flex gap-1">
          {/* 最小化按钮 */}
          <button
            onClick={() => setWindowModeWithToast('minimized')}
            className="p-2 rounded-xl transition-colors hover:bg-gray-100"
            title="最小化"
          >
            <Minus size={18} color="#9E9899" />
          </button>
          {/* 窗口模式按钮 */}
          <button
            onClick={() => setWindowModeWithToast('window')}
            className={`p-2 rounded-xl transition-colors ${windowMode === 'window' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            title="窗口模式"
          >
            <Square size={16} color="#9E9899" strokeWidth={2} />
          </button>
          {/* 全屏模式按钮 */}
          <button
            onClick={() => setWindowModeWithToast('fullscreen')}
            className={`p-2 rounded-xl transition-colors ${windowMode === 'fullscreen' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            title="全屏模式"
          >
            <Square size={18} color="#9E9899" />
          </button>
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-gray-100 ml-1"
            title="关闭"
          >
            <X size={18} color="#9E9899" />
          </button>
        </div>

        {/* ─── 标题 ─── */}
        <h2
          className="text-2xl font-bold text-center mb-6"
          style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}
        >
          🍅 Focus Timer
        </h2>

        {/* ─── 当前专注任务显示 ─── */}
        {currentFocusTask && (
          <div
            className="mb-6 p-4 rounded-xl text-center"
            style={{ background: 'rgba(121, 190, 235, 0.1)', border: '1px solid #79BEEB30' }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: '#79BEEB' }}>
              当前任务
            </p>
            <p className="text-sm font-medium" style={{ color: '#3A3638' }}>
              {currentFocusTask.title}
            </p>
          </div>
        )}

        {/* ─── 计时器显示 ─── */}
        <div
          className="text-center mb-8 py-8 rounded-2xl"
          style={{
            background: isWorking
              ? 'rgba(121, 190, 235, 0.15)'
              : isBreak || isLongBreak
                ? 'rgba(168, 230, 207, 0.15)'
                : 'rgba(212, 196, 251, 0.1)',
          }}
        >
          <div
            className="text-5xl font-bold tracking-wider font-mono"
            style={{ color: isWorking ? '#2D7A9A' : isBreak || isLongBreak ? '#2D8A6A' : '#5A4A8A' }}
          >
            {formatMMSS(focusTimeLeft)}
          </div>

          {/* 状态标签 */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {isWorking && (
              <>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#79BEEB' }} />
                <span className="text-sm font-semibold" style={{ color: '#79BEEB' }}>
                  专注中...
                </span>
              </>
            )}
            {(isBreak || isLongBreak) && (
              <>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#A8E6CF' }} />
                <span className="text-sm font-semibold" style={{ color: '#A8E6CF' }}>
                  {isLongBreak ? '长休息' : '休息中'}
                </span>
              </>
            )}
            {isIdle && (
              <span className="text-sm font-semibold" style={{ color: '#9E9899' }}>
                准备开始
              </span>
            )}
          </div>

          {/* 进度条 */}
          {(isWorking || isBreak || isLongBreak) && (
            <div className="mt-4 px-8">
              <div className="h-2 rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${progressPercent}%`,
                    background: isWorking ? '#79BEEB' : '#A8E6CF',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ─── 时长选择器（仅在空闲时显示） ─── */}
        {isIdle && (
          <div className="mb-6">
            <p className="text-sm font-semibold mb-3 text-center" style={{ color: '#5C5658' }}>
              选择专注时长
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {FOCUS_DURATION_OPTIONS.map((mins) => (
                <button
                  key={mins}
                  onClick={() => setSelectedDuration(mins)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                  style={{
                    background: selectedDuration === mins ? '#D4C4FB' : '#F5F1EA',
                    color: selectedDuration === mins ? '#5A4A8A' : '#5C5658',
                    border: selectedDuration === mins ? '2px solid #B8A0E8' : '2px solid transparent',
                  }}
                >
                  {mins} 分钟
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── 操作按钮 ─── */}
        <div className="flex justify-center gap-3 mb-6">
          {isWorking ? (
            <>
              <button
                onClick={handlePause}
                className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 flex items-center gap-2"
                style={{ background: '#B8A0E8', color: 'white' }}
              >
                <Pause size={18} />
                暂停
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 flex items-center gap-2"
                style={{ background: '#F5F1EA', color: '#5C5658' }}
              >
                <RotateCcw size={18} />
                放弃
              </button>
            </>
          ) : isBreak || isLongBreak ? (
            <>
              <button
                onClick={handleSkipBreak}
                className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 flex items-center gap-2"
                style={{ background: '#79BEEB', color: 'white' }}
              >
                <SkipForward size={18} />
                跳过休息
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 flex items-center gap-2"
                style={{ background: '#F5F1EA', color: '#5C5658' }}
              >
                <RotateCcw size={18} />
                结束
              </button>
            </>
          ) : (
            <button
              onClick={handleStart}
              className="px-10 py-3 rounded-xl font-semibold transition-all hover:scale-105 flex items-center gap-2"
              style={{ background: '#D4C4FB', color: '#5A4A8A' }}
            >
              <Play size={18} />
              开始专注
            </button>
          )}
        </div>

        {/* ─── 今日统计 ─── */}
        <div className="text-center pt-4 border-t" style={{ borderColor: '#E8E6E1' }}>
          <p className="text-sm" style={{ color: '#9E9899' }}>
            今日已完成{' '}
            <span className="font-bold" style={{ color: '#79BEEB' }}>
              {focusSessions}
            </span>{' '}
            个专注
          </p>
          <p className="text-xs mt-1" style={{ color: '#9E9899' }}>
            累计专注时长: {focusSessions * focusSettings.workMinutes} 分钟
          </p>
        </div>
      </div>
    </div>
  )
}
