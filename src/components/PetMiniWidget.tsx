import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import type { AppState } from '../store/useAppStore'
import { IDLE_LONG } from './PetDialogue'

// ─── Constants ───

const IDLE_MESSAGES = [
  '今天天气真好呢～',
  '主人在忙什么呀？',
  '我打个盹儿...zzZ',
  '好想出去玩～',
  '专注的主人最帅啦！',
  '要不要休息一下？',
  '我最喜欢主人了！',
  '喵～喵～',
  '来摸摸我嘛～',
  '加油加油！',
  ...IDLE_LONG,
]

const LS_HIDDEN_KEY = 'merize-pet-mini-widget-hidden'
const LS_PET_NAME_KEY = 'merize-pet-mini-name'

// ─── Keyframes ───

const WIDGET_KEYFRAMES = `
@keyframes petWidgetSlideIn {
  0% { opacity: 0; transform: translateY(20px) scale(0.9); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes petWidgetBubbleIn {
  0% { opacity: 0; transform: scale(0.8) translateY(4px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes petWidgetBubbleOut {
  0% { opacity: 1; transform: scale(1) translateY(0); }
  100% { opacity: 0; transform: scale(0.85) translateY(4px); }
}
@keyframes petWidgetBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
`

const injectWidgetKeyframes = (() => {
  let injected = false
  return () => {
    if (injected) return
    injected = true
    const s = document.createElement('style')
    s.textContent = WIDGET_KEYFRAMES
    document.head.appendChild(s)
  }
})()

// ─── Helper ───

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ─── PetMiniWidget Component ───

export default function PetMiniWidget() {
  const navigate = useNavigate()

  // Try to get pet from store; fall back gracefully
  let storePetName = '小橘'
  let storePetLevel = 1
  try {
    const pet = useAppStore((s: AppState) => s.pet)
    if (pet) {
      storePetName = pet.name || '小橘'
      storePetLevel = pet.level || 1
    }
  } catch {
    // Store may not have pet; use defaults
  }

  // Check focus mode if available
  let isFocusMode = false
  try {
    const focusState = useAppStore((s: AppState) => s.focusState)
    isFocusMode = focusState === 'working'
  } catch {
    // focusState might not exist
  }

  // Resolve pet name: store > localStorage > default
  const petName = storePetName !== '小橘'
    ? storePetName
    : localStorage.getItem(LS_PET_NAME_KEY) || '小橘'
  const petLevel = storePetLevel

  // Hidden preference
  const [hidden, setHidden] = useState(() => {
    return localStorage.getItem(LS_HIDDEN_KEY) === 'true'
  })

  // Speech bubble state
  const [bubble, setBubble] = useState<{ text: string; visible: boolean }>({
    text: '',
    visible: false,
  })
  const [bubbleDismissing, setBubbleDismissing] = useState(false)
  const bubbleTimer = useRef<ReturnType<typeof setTimeout>>()
  const nextBubbleTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    injectWidgetKeyframes()
  }, [])

  // Schedule random speech bubbles
  const scheduleBubble = useCallback(() => {
    const delay = getRandomInterval(30000, 60000)
    nextBubbleTimer.current = setTimeout(() => {
      const msg = pickRandom(IDLE_MESSAGES)
      setBubble({ text: msg, visible: true })
      setBubbleDismissing(false)

      // Auto-hide after 5 seconds
      bubbleTimer.current = setTimeout(() => {
        setBubbleDismissing(true)
        setTimeout(() => {
          setBubble((prev) => ({ ...prev, visible: false }))
          setBubbleDismissing(false)
          scheduleBubble()
        }, 250)
      }, 5000)
    }, delay)
  }, [])

  useEffect(() => {
    // Show initial bubble after a short delay
    const initialTimer = setTimeout(() => {
      const msg = pickRandom(IDLE_MESSAGES)
      setBubble({ text: msg, visible: true })
      setBubbleDismissing(false)

      bubbleTimer.current = setTimeout(() => {
        setBubbleDismissing(true)
        setTimeout(() => {
          setBubble((prev) => ({ ...prev, visible: false }))
          setBubbleDismissing(false)
          scheduleBubble()
        }, 250)
      }, 5000)
    }, 3000)

    return () => {
      clearTimeout(initialTimer)
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current)
      if (nextBubbleTimer.current) clearTimeout(nextBubbleTimer.current)
    }
  }, [scheduleBubble])

  const handleHide = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setHidden(true)
    localStorage.setItem(LS_HIDDEN_KEY, 'true')
  }, [])

  const handleClick = useCallback(() => {
    navigate('/pet')
  }, [navigate])

  // Don't render if hidden or in focus mode
  if (hidden || isFocusMode) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        animation: 'petWidgetSlideIn 0.4s ease-out',
        cursor: 'pointer',
      }}
      onClick={handleClick}
      title="去看看宠物"
    >
      {/* Speech bubble */}
      {bubble.visible && (
        <div
          style={{
            position: 'relative',
            background: 'var(--color-bg-surface-1, #fff)',
            border: '1.5px solid var(--color-border-subtle, #e5e0db)',
            borderRadius: 10,
            padding: '4px 10px',
            maxWidth: 140,
            fontSize: 11,
            lineHeight: 1.5,
            color: 'var(--color-text-primary, #2c1810)',
            boxShadow: 'var(--shadow-card, 0 2px 8px rgba(44,24,16,0.06))',
            animation: bubbleDismissing
              ? 'petWidgetBubbleOut 0.25s ease-in forwards'
              : 'petWidgetBubbleIn 0.3s ease-out forwards',
            marginBottom: 2,
            textAlign: 'center',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}
        >
          {bubble.text}
          {/* Tail */}
          <div
            style={{
              position: 'absolute',
              bottom: -6,
              left: '50%',
              marginLeft: -5,
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '6px solid var(--color-border-subtle, #e5e0db)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              marginLeft: -4,
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid var(--color-bg-surface-1, #fff)',
            }}
          />
        </div>
      )}

      {/* Pet avatar area */}
      <div
        style={{
          position: 'relative',
          width: 48,
          height: 48,
          borderRadius: '1rem',
          background: 'var(--color-bg-surface-1, #fff)',
          border: '2px solid var(--color-border-subtle, #e5e0db)',
          boxShadow: 'var(--shadow-card, 0 2px 8px rgba(44,24,16,0.06)), 0 4px 12px rgba(44,24,16,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
        {/* Pixel cat face (40x40 area) */}
        <div
          style={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            animation: 'petWidgetBounce 2.5s ease-in-out infinite',
          }}
        >
          🐱
        </div>

        {/* Close button */}
        <button
          onClick={handleHide}
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--color-bg-surface-1, #fff)',
            border: '1.5px solid var(--color-border-subtle, #e5e0db)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            fontSize: 9,
            lineHeight: 1,
            color: 'var(--color-text-muted, #9a8a7c)',
            boxShadow: '0 1px 3px rgba(44,24,16,0.08)',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text-primary)'
            e.currentTarget.style.borderColor = 'var(--color-text-muted)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-muted)'
            e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
          }}
          title="隐藏宠物挂件"
          aria-label="隐藏宠物挂件"
        >
          ✕
        </button>

        {/* Level badge */}
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            background: 'var(--color-accent, #f5a623)',
            color: '#fff',
            fontSize: 8,
            fontWeight: 700,
            padding: '1px 4px',
            borderRadius: 6,
            lineHeight: 1.4,
            boxShadow: '0 1px 3px rgba(44,24,16,0.15)',
            letterSpacing: '0.02em',
          }}
        >
          Lv.{petLevel}
        </div>
      </div>

      {/* Pet name */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--color-text-muted, #9a8a7c)',
          textAlign: 'center',
          maxWidth: 60,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.3,
        }}
      >
        {petName}
      </div>
    </div>
  )
}
