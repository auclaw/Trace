import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { AppState } from '../store/useAppStore'

// ─── Pre-defined Message Triggers ───

export const HABIT_COMPLETE = [
  '太棒了！🎉 继续保持哦～',
  '做得好！我好开心！',
  '又完成一个习惯！你真棒～',
  '坚持就是胜利！继续加油！',
  '打卡成功！奖励自己一下吧～',
]

export const FOCUS_END = [
  '辛苦了！休息一下吧～',
  '专注完成！你真厉害！',
  '好专注呀！让眼睛休息一下～',
  '一轮专注结束！喝口水吧～',
  '效率满满！我为你骄傲～',
]

export const LOGIN_STREAK = [
  '又见面啦！今天也要加油哦！',
  '连续登录！你的坚持让我好感动～',
  '每天都来看我，好开心！',
  '今天也一起努力吧！💪',
]

export const IDLE_LONG = [
  '你去哪了？我好想你...',
  '主人～快回来陪我嘛～',
  '好久不见...我一个人好无聊',
  '终于回来了！我等你好久了～',
]

export const PLAN_DEVIATION = [
  '计划有变？没关系，调整一下继续！',
  '灵活应变也是一种能力哦～',
  '没关系的，重新安排就好！',
  '计划赶不上变化，加油～',
]

export const GOAL_COMPLETE = [
  '今天的目标完成啦！🎊 你真厉害！',
  '目标达成！今天的你超级棒！',
  '全部完成！可以好好休息了～',
  '任务清零！给你一个大大的赞！👍',
]

export const HABIT_BROKEN = [
  '昨天忘了打卡...没关系，今天重新开始！💪',
  '断了一天而已，不要放弃哦～',
  '没事没事，重新来过就好！',
  '偶尔休息也可以的，今天继续！',
]

// ─── Mood Emoji Map ───

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  neutral: '😺',
  excited: '🤩',
}

// ─── Keyframes (injected once) ───

const DIALOGUE_KEYFRAMES = `
@keyframes petDialogueBubbleIn {
  0% { opacity: 0; transform: scale(0.85) translateY(4px); }
  60% { opacity: 1; transform: scale(1.03) translateY(-1px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes petDialogueBubbleOut {
  0% { opacity: 1; transform: scale(1) translateY(0); }
  100% { opacity: 0; transform: scale(0.9) translateY(4px); }
}
`

const injectDialogueKeyframes = (() => {
  let injected = false
  return () => {
    if (injected) return
    injected = true
    const s = document.createElement('style')
    s.textContent = DIALOGUE_KEYFRAMES
    document.head.appendChild(s)
  }
})()

// ─── Helper ───

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── PetDialogue Component ───

export interface PetDialogueProps {
  message: string
  petName?: string
  mood?: 'happy' | 'sad' | 'neutral' | 'excited'
  onDismiss?: () => void
  autoHide?: number
  visible?: boolean
}

export function PetDialogue({
  message,
  petName,
  mood = 'happy',
  onDismiss,
  autoHide = 5000,
  visible = true,
}: PetDialogueProps) {
  const storePet = useAppStore((s: AppState) => s.pet)
  const resolvedName = petName ?? storePet?.name ?? '小橘'
  const [dismissing, setDismissing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    injectDialogueKeyframes()
  }, [])

  // Auto-dismiss timer
  useEffect(() => {
    if (!visible || autoHide <= 0) return
    timerRef.current = setTimeout(() => {
      handleDismiss()
    }, autoHide)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [visible, autoHide, message])

  const handleDismiss = useCallback(() => {
    setDismissing(true)
    setTimeout(() => {
      setDismissing(false)
      onDismiss?.()
    }, 200)
  }, [onDismiss])

  if (!visible) return null

  const moodEmoji = MOOD_EMOJI[mood] || '😺'

  return (
    <div
      onClick={handleDismiss}
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        gap: 8,
        cursor: 'pointer',
        animation: dismissing
          ? 'petDialogueBubbleOut 0.2s ease-in forwards'
          : 'petDialogueBubbleIn 0.35s ease-out forwards',
        userSelect: 'none',
      }}
    >
      {/* Pixel pet avatar */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--color-accent-soft, rgba(245,166,35,0.15))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
          border: '2px solid var(--color-border-subtle, #e5e0db)',
          boxShadow: '0 2px 6px rgba(44,24,16,0.08)',
        }}
        title={resolvedName}
      >
        {moodEmoji}
      </div>

      {/* Speech bubble */}
      <div
        style={{
          position: 'relative',
          background: 'var(--color-bg-surface-1, #fff)',
          border: '2px solid var(--color-border-subtle, #e5e0db)',
          borderRadius: 16,
          padding: '8px 14px',
          maxWidth: 260,
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--color-text-primary, #2c1810)',
          boxShadow: 'var(--shadow-card, 0 2px 8px rgba(44,24,16,0.06))',
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: 'var(--color-text-muted, #9a8a7c)',
            fontWeight: 600,
            marginBottom: 2,
          }}
        >
          {resolvedName}
        </div>
        <div>{message}</div>

        {/* Bubble tail */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: -7,
            width: 0,
            height: 0,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: '7px solid var(--color-border-subtle, #e5e0db)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 9,
            left: -4,
            width: 0,
            height: 0,
            borderTop: '5px solid transparent',
            borderBottom: '5px solid transparent',
            borderRight: '5px solid var(--color-bg-surface-1, #fff)',
          }}
        />
      </div>
    </div>
  )
}

// ─── usePetDialogue Hook ───

export function usePetDialogue() {
  const [state, setState] = useState<{
    visible: boolean
    message: string
    mood: 'happy' | 'sad' | 'neutral' | 'excited'
  }>({
    visible: false,
    message: '',
    mood: 'happy',
  })

  const showDialogue = useCallback(
    (message: string, mood: 'happy' | 'sad' | 'neutral' | 'excited' = 'happy') => {
      setState({ visible: true, message, mood })
    },
    [],
  )

  const handleDismiss = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }))
  }, [])

  const dialogueProps: PetDialogueProps = {
    message: state.message,
    mood: state.mood,
    visible: state.visible,
    onDismiss: handleDismiss,
  }

  return { showDialogue, dialogueProps }
}

// ─── Convenience: pick a random message from a trigger category ───

export function getRandomMessage(
  trigger:
    | typeof HABIT_COMPLETE
    | typeof FOCUS_END
    | typeof LOGIN_STREAK
    | typeof IDLE_LONG
    | typeof PLAN_DEVIATION
    | typeof GOAL_COMPLETE
    | typeof HABIT_BROKEN,
): string {
  return pickRandom(trigger)
}

export default PetDialogue
