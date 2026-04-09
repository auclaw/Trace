import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import { Button, Modal, Input, Progress } from '../components/ui'
import PetShop from '../components/PetShop'

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
]

const FEED_COST = 5
const P = 4 // pixel size in px

// ─── CSS Keyframes (injected once) ───

const KEYFRAME_CSS = `
@keyframes petIdle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes petHappy {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(-3deg); }
  75% { transform: translateY(-8px) rotate(3deg); }
}
@keyframes petSad {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(2px) rotate(-2deg); }
}
@keyframes petEat {
  0%, 100% { transform: scale(1); }
  30% { transform: scale(1.08); }
  60% { transform: scale(0.95); }
}
@keyframes petSleep {
  0%, 100% { transform: translateY(0); opacity: 0.85; }
  50% { transform: translateY(1px); opacity: 0.7; }
}
@keyframes floatHeart {
  0% { opacity: 1; transform: translateY(0) scale(0.5); }
  100% { opacity: 0; transform: translateY(-30px) scale(1.2); }
}
@keyframes tearDrop {
  0% { opacity: 0; transform: translateY(0); }
  20% { opacity: 1; }
  100% { opacity: 0; transform: translateY(14px); }
}
@keyframes zzz {
  0% { opacity: 0; transform: translate(0,0) scale(0.6); }
  50% { opacity: 1; }
  100% { opacity: 0; transform: translate(12px,-18px) scale(1.1); }
}
@keyframes bubbleIn {
  0% { opacity: 0; transform: scale(0.8) translateY(6px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes petGlow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.75; }
}
@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}
`

const injectKeyframes = (() => {
  let injected = false
  return () => {
    if (injected) return
    injected = true
    const s = document.createElement('style')
    s.textContent = KEYFRAME_CSS
    document.head.appendChild(s)
  }
})()

// ─── Pixel Cat Sprite (box-shadow based) ───

function buildPixelShadows(grid: string[][], palette: Record<string, string>, px: number): string {
  const shadows: string[] = []
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const c = grid[y][x]
      if (c !== '.' && palette[c]) {
        shadows.push(`${x * px}px ${y * px}px 0 0 ${palette[c]}`)
      }
    }
  }
  return shadows.join(',')
}

const CAT_PALETTE: Record<string, string> = {
  B: '#2c1810', // dark outline
  O: '#f5a623', // orange fur
  o: '#e8913a', // orange shadow
  W: '#fff8f0', // white
  w: '#f0e0d0', // off-white
  P: '#ffb6c1', // pink (nose/ears)
  G: '#3a3a3a', // dark grey (eyes)
  E: '#1a1a1a', // pupils
  N: '#ff8fa0', // nose
  M: '#d4956a', // mouth area
}

// 16x16 cat pixel art grid
const CAT_GRID = [
  '.....B..........B.....',
  '....BOB........BOB....',
  '...BOOB......BOOB.....',
  '..BOPOB....BOPOB......',
  '..BOOOB....BOOOB......',
  '..BOOOBBBBBOOOOB......',
  '.BOOOOOOOOOOOOOOB.....',
  '.BOWOEOBWWBOEOWOB.....',
  '.BOWOEOBBBBOEOWOB.....',
  '.BOOWWOBNNBOWWOOB.....',
  '..BOOOOOBBOOOOOOB.....',
  '..BOOOOOMMOOOOB.......',
  '...BOOOOOOOOOOB.......',
  '...BOOOOOOOOOOB.......',
  '....BOOOOOOOB.........',
  '....BBOOOOOOBB........',
  '...B..BBBBB..B........',
].map(r => r.split(''))

const CAT_SHADOW = buildPixelShadows(CAT_GRID, CAT_PALETTE, P)

// sleeping cat (eyes closed)
const CAT_SLEEP_GRID = CAT_GRID.map((row, y) => {
  if (y === 7 || y === 8) {
    return row.map((c) => (c === 'E' || c === 'G') ? 'B' : c)
  }
  return row
})
const CAT_SLEEP_SHADOW = buildPixelShadows(CAT_SLEEP_GRID, CAT_PALETTE, P)

// eating cat (open mouth)
const CAT_EAT_GRID = CAT_GRID.map((row, y) => {
  if (y === 11) {
    return row.map((c) => (c === 'M') ? 'B' : c)
  }
  return row
})
const CAT_EAT_SHADOW = buildPixelShadows(CAT_EAT_GRID, CAT_PALETTE, P)

type PetAnim = 'idle' | 'happy' | 'sad' | 'eating' | 'sleeping'

function getAnimForState(hunger: number, mood: number, anim: PetAnim | null): { shadow: string; animation: string } {
  const active = anim || 'idle'
  switch (active) {
    case 'happy':
      return { shadow: CAT_SHADOW, animation: 'petHappy 0.6s ease-in-out infinite' }
    case 'sad':
      return { shadow: CAT_SHADOW, animation: 'petSad 2s ease-in-out infinite' }
    case 'eating':
      return { shadow: CAT_EAT_SHADOW, animation: 'petEat 0.5s ease-in-out 3' }
    case 'sleeping':
      return { shadow: CAT_SLEEP_SHADOW, animation: 'petSleep 3s ease-in-out infinite' }
    default:
      if (hunger < 20) return { shadow: CAT_SHADOW, animation: 'petSad 2s ease-in-out infinite' }
      if (mood < 20) return { shadow: CAT_SHADOW, animation: 'petSad 2s ease-in-out infinite' }
      return { shadow: CAT_SHADOW, animation: 'petIdle 2.5s ease-in-out infinite' }
  }
}

// ─── PixelCat Component ───

function PixelCat({ hunger, mood, anim }: { hunger: number; mood: number; anim: PetAnim | null }) {
  const { shadow, animation } = getAnimForState(hunger, mood, anim)
  const gridW = 22
  const gridH = 17
  return (
    <div className="relative" style={{ width: gridW * P + P, height: gridH * P + P }}>
      <div
        style={{
          width: P,
          height: P,
          boxShadow: shadow,
          animation,
          imageRendering: 'pixelated',
        }}
      />
      {/* Hearts overlay for happy */}
      {anim === 'happy' && (
        <>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                top: -8,
                left: 20 + i * 22,
                fontSize: 14,
                animation: `floatHeart 1s ease-out ${i * 0.25}s infinite`,
                pointerEvents: 'none',
              }}
            >
              &#10084;
            </span>
          ))}
        </>
      )}
      {/* Tear for sad */}
      {(anim === 'sad' || (!anim && (hunger < 20 || mood < 20))) && (
        <span
          style={{
            position: 'absolute',
            top: 32,
            left: 18,
            fontSize: 10,
            color: '#5bc0de',
            animation: 'tearDrop 1.5s ease-in infinite',
            pointerEvents: 'none',
          }}
        >
          &#9679;
        </span>
      )}
      {/* Zzz for sleeping */}
      {anim === 'sleeping' && (
        <>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                top: -4 - i * 6,
                right: -14 + i * 6,
                fontSize: 10 + i * 2,
                color: 'var(--color-text-muted)',
                animation: `zzz 2s ease-out ${i * 0.5}s infinite`,
                pointerEvents: 'none',
              }}
            >
              z
            </span>
          ))}
        </>
      )}
    </div>
  )
}

// ─── Speech Bubble ───

function SpeechBubble({ text, mini }: { text: string; mini?: boolean }) {
  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--color-bg-surface-1)',
        border: '2px solid var(--color-border-subtle)',
        borderRadius: mini ? 10 : 16,
        padding: mini ? '4px 10px' : '10px 18px',
        maxWidth: mini ? 160 : 280,
        fontSize: mini ? 11 : 14,
        color: 'var(--color-text-primary)',
        animation: 'bubbleIn 0.3s ease-out',
        boxShadow: 'var(--shadow-md)',
        lineHeight: 1.5,
      }}
    >
      {text}
      <div
        style={{
          position: 'absolute',
          bottom: -8,
          left: mini ? 16 : 28,
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid var(--color-border-subtle)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -5,
          left: mini ? 18 : 30,
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid var(--color-bg-surface-1)',
        }}
      />
    </div>
  )
}

// ─── Stat Bar ───

function StatBar({
  label,
  icon,
  value,
  max,
  color,
  bgTint,
}: {
  label: string
  icon: string
  value: number
  max: number
  color: string | ((v: number) => string)
  bgTint: string
}) {
  const resolvedColor = typeof color === 'function' ? color(value) : color
  return (
    <div
      style={{
        background: bgTint,
        borderRadius: 'var(--radius-md)',
        padding: '0.65rem 1rem',
      }}
    >
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-[var(--color-text-secondary)] font-medium">
          {icon} {label}
        </span>
        <span className="text-[var(--color-text-primary)] tabular-nums font-semibold">
          <span className="metric-value" style={{ fontSize: '0.85rem' }}>{value}</span>
          <span className="text-[var(--color-text-muted)]"> / {max}</span>
        </span>
      </div>
      <Progress value={Math.min(100, (value / max) * 100)} color={resolvedColor} showLabel size="md" />
    </div>
  )
}

// ─── Hunger color helper ───
function hungerColor(v: number): string {
  if (v < 30) return '#ef4444'
  if (v < 60) return '#f59e0b'
  return '#22c55e'
}

// ─── Dialogue logic ───

function getDialogue(hunger: number, mood: number, _name: string, anim: PetAnim | null, idleIdx: number): string {
  if (anim === 'eating') return '谢谢！好好吃～'
  if (anim === 'happy') return '今天效率好高！我好开心～'
  if (hunger < 25) return '肚子好饿...能给我点吃的吗？'
  if (mood < 25) return '你好像很久没休息了...要不要休息一下？'
  if (anim === 'sleeping') return 'zzZ... zzZ...'
  // idle rotation
  return IDLE_MESSAGES[idleIdx % IDLE_MESSAGES.length]
}

// ─── Main Component ───

export default function VirtualPet() {
  const { isDark } = useTheme()
  const pet = useAppStore((s) => s.pet)
  const loadPet = useAppStore((s) => s.loadPet)
  const feedPet = useAppStore((s) => s.feedPet)
  const interactPet = useAppStore((s) => s.interactPet)
  const renamePet = useAppStore((s) => s.renamePet)

  const [anim, setAnim] = useState<PetAnim | null>(null)
  const [idleIdx, setIdleIdx] = useState(0)
  const [energy, setEnergy] = useState(80)
  const [namingOpen, setNamingOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [firstVisitChecked, setFirstVisitChecked] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const animTimeout = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    loadPet()
    injectKeyframes()
  }, [loadPet])

  // Check first visit (naming)
  useEffect(() => {
    if (firstVisitChecked) return
    const named = localStorage.getItem('merize-pet-named')
    if (!named) {
      setNamingOpen(true)
    }
    setFirstVisitChecked(true)
  }, [firstVisitChecked])

  // Idle message rotation every 30s
  useEffect(() => {
    const iv = setInterval(() => {
      setIdleIdx((i) => i + 1)
    }, 30000)
    return () => clearInterval(iv)
  }, [])

  const playAnim = useCallback((a: PetAnim, duration: number) => {
    if (animTimeout.current) clearTimeout(animTimeout.current)
    setAnim(a)
    animTimeout.current = setTimeout(() => setAnim(null), duration)
  }, [])

  const handleFeed = useCallback(() => {
    feedPet()
    playAnim('eating', 1800)
  }, [feedPet, playAnim])

  const handleInteract = useCallback(() => {
    interactPet()
    setEnergy((e) => Math.max(0, e - 8))
    playAnim('happy', 2000)
  }, [interactPet, playAnim])

  const handleTouch = useCallback(() => {
    // small mood boost via interact (store only has interactPet, we call it for small boost)
    playAnim('happy', 1200)
  }, [playAnim])

  const handleNameSave = useCallback(() => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    renamePet(trimmed)
    localStorage.setItem('merize-pet-named', '1')
    setNamingOpen(false)
    setRenameOpen(false)
  }, [nameInput, renamePet])

  const handleOpenRename = useCallback(() => {
    setNameInput(pet.name)
    setRenameOpen(true)
  }, [pet.name])

  const xpToNext = pet.level * 100

  const dialogue = useMemo(
    () => getDialogue(pet.hunger, pet.mood, pet.name, anim, idleIdx),
    [pet.hunger, pet.mood, pet.name, anim, idleIdx],
  )

  // Welcome message on first render
  const [welcomeShown, setWelcomeShown] = useState(false)
  const displayText = useMemo(() => {
    if (!welcomeShown) return `欢迎回来，${pet.name}的主人！今天要一起努力哦～`
    return dialogue
  }, [welcomeShown, pet.name, dialogue])

  useEffect(() => {
    const t = setTimeout(() => setWelcomeShown(true), 5000)
    return () => clearTimeout(t)
  }, [])

  const cardBg = isDark
    ? 'linear-gradient(145deg, var(--color-bg-surface-1) 0%, var(--color-bg-surface-2) 100%)'
    : 'linear-gradient(145deg, #fffcf7 0%, var(--color-bg-surface-2) 100%)'
  const cardBorder = '1px solid var(--color-border-subtle)'

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          效率宠物
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          专注涨经验，喂食保饱食，和你的效率宠物一起成长
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ═══ Pet Display Area ═══ */}
        <div
          className="md:col-span-2 flex flex-col items-center"
          style={{
            background: cardBg,
            border: cardBorder,
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: '2rem 1.75rem',
          }}
        >
          {/* Speech bubble */}
          <div style={{ marginBottom: 16, minHeight: 56 }}>
            <SpeechBubble text={displayText} />
          </div>

          {/* Pixel pet with glow background */}
          <div
            className="relative flex items-center justify-center rounded-full mb-6"
            style={{
              width: '12rem',
              height: '12rem',
              background: isDark
                ? 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 75%)'
                : 'radial-gradient(circle, rgba(249,115,22,0.10) 0%, rgba(255,213,79,0.08) 40%, transparent 75%)',
              cursor: 'pointer',
            }}
            onClick={handleTouch}
            title="摸一摸宠物"
          >
            {/* Soft glow */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, var(--color-accent-soft) 0%, transparent 65%)',
                filter: 'blur(12px)',
                animation: 'petGlow 3s ease-in-out infinite',
              }}
            />
            <div className="relative">
              <PixelCat hunger={pet.hunger} mood={pet.mood} anim={anim} />
              {pet.decoration && (
                <span
                  style={{
                    position: 'absolute',
                    top: -12,
                    right: -8,
                    fontSize: 22,
                    pointerEvents: 'none',
                    filter: 'drop-shadow(0 1px 2px rgba(44,24,16,0.3))',
                  }}
                >
                  {pet.decoration}
                </span>
              )}
            </div>
          </div>

          {/* Name + level badge */}
          <div className="flex items-center gap-2.5 mb-1">
            <button
              onClick={handleOpenRename}
              className="text-xl font-bold text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
            >
              {pet.name}
            </button>
            <span
              className="inline-flex items-center gap-1 font-semibold"
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-accent-soft)',
                fontSize: '0.8rem',
              }}
            >
              <span style={{ color: 'var(--color-accent)' }}>Lv.</span>
              <span className="metric-value" style={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
                {pet.level}
              </span>
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-6">点击名字可重命名 | 点击宠物可摸摸</p>

          {/* ═══ Stat Bars ═══ */}
          <div className="w-full max-w-md space-y-3 mb-6">
            <StatBar
              label="饱食度"
              icon="🍖"
              value={pet.hunger}
              max={100}
              color={hungerColor}
              bgTint={isDark ? 'var(--color-bg-surface-2)' : 'var(--color-success-soft)'}
            />
            <StatBar
              label="心情"
              icon="💕"
              value={pet.mood}
              max={100}
              color="#ec4899"
              bgTint={isDark ? 'var(--color-bg-surface-2)' : 'rgba(236,72,153,0.06)'}
            />
            <StatBar
              label="体力"
              icon="⚡"
              value={energy}
              max={100}
              color="#8b5cf6"
              bgTint={isDark ? 'var(--color-bg-surface-2)' : 'rgba(139,92,246,0.06)'}
            />
            <StatBar
              label="升级进度"
              icon="✨"
              value={pet.xp}
              max={xpToNext}
              color="var(--color-accent)"
              bgTint={isDark ? 'var(--color-bg-surface-2)' : 'var(--color-accent-soft)'}
            />
          </div>

          {/* ═══ Action Buttons ═══ */}
          <div className="flex flex-wrap items-center gap-3 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={handleFeed}
              disabled={pet.hunger >= 100 || pet.coins < FEED_COST}
              icon={<span className="text-lg">🍎</span>}
              className="shadow-[var(--shadow-accent)]"
            >
              喂食 (-{FEED_COST}币)
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleInteract}
              disabled={pet.mood >= 100 || energy < 8}
              icon={<span className="text-lg">🎾</span>}
            >
              玩耍 (-8体力)
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleTouch}
              icon={<span className="text-lg">🤚</span>}
            >
              摸摸
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShopOpen(true)}
              icon={<span className="text-lg">🛒</span>}
            >
              商店
            </Button>
            {/* Coin badge */}
            <div
              className="flex items-center gap-2 font-semibold select-none"
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-gold-gradient)',
                color: '#5d4037',
                boxShadow: '0 2px 8px rgba(255,183,77,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
                fontSize: '0.95rem',
              }}
            >
              <span className="text-lg">💰</span>
              <span
                className="tabular-nums metric-value"
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.2,
                  background: 'linear-gradient(135deg, #5d4037, #3e2723)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {pet.coins}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ Sidebar ═══ */}
        <div className="space-y-5">
          {/* Stats card */}
          <div
            style={{
              background: cardBg,
              border: cardBorder,
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              padding: '1.5rem',
            }}
          >
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-4 text-sm flex items-center gap-2">
              📊 统计信息
            </h4>
            <div className="space-y-3 text-sm">
              {[
                ['等级', <span className="metric-value" style={{ fontSize: '1.1rem' }}>{pet.level}</span>],
                ['经验', <span className="text-[var(--color-text-primary)] font-semibold tabular-nums">{pet.xp} XP</span>],
                ['金币', <span className="font-semibold tabular-nums" style={{ background: 'var(--color-gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{pet.coins}</span>],
                ['类型', <span className="text-[var(--color-text-primary)] font-medium">{pet.type === 'cat' ? '🐱 猫咪' : pet.type === 'bird' ? '🐦 蓝鸟' : pet.type === 'duck' ? '🐤 黄鸭' : pet.type === 'rabbit' ? '🐰 白兔' : pet.type === 'panda' ? '🐼 熊猫' : '🐱 猫咪'}</span>],
                ['体力', <span className="text-[var(--color-text-primary)] font-semibold tabular-nums">{energy}/100</span>],
              ].map(([lbl, val], i) => (
                <div key={i}>
                  {i > 0 && <div style={{ height: 1, background: 'var(--color-border-subtle)', marginBottom: 12 }} />}
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-muted)]">{lbl}</span>
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Growth rules */}
          <div
            style={{
              background: cardBg,
              border: cardBorder,
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              padding: '1.5rem',
            }}
          >
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-4 text-sm flex items-center gap-2">
              📖 成长规则
            </h4>
            <ul className="text-xs space-y-3 text-[var(--color-text-muted)] leading-relaxed">
              {[
                { icon: '📈', bg: 'var(--color-accent-soft)', text: '每完成一轮专注 → +专注分钟数 XP' },
                { icon: '💰', bg: 'rgba(255,213,79,0.15)', text: '每 5 分钟专注 → +1 金币' },
                { icon: '🍎', bg: 'var(--color-success-soft)', text: `喂食消耗 ${FEED_COST} 金币 → +15 饱食 +5 心情` },
                { icon: '🎾', bg: 'var(--color-info-soft)', text: '玩耍消耗 8 体力 → +10 心情' },
                { icon: '🤚', bg: 'rgba(236,72,153,0.08)', text: '摸摸免费 → +3 心情' },
                { icon: '⬆️', bg: 'var(--color-warning-soft)', text: '升级需要 等级 x 100 XP' },
                { icon: '😴', bg: 'rgba(139,92,246,0.08)', text: '体力每小时自动恢复 10 点' },
              ].map((r, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span
                    className="shrink-0 flex items-center justify-center"
                    style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: r.bg,
                      fontSize: '0.7rem',
                    }}
                  >
                    {r.icon}
                  </span>
                  <span>{r.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ═══ Naming Modal (first visit) ═══ */}
      <Modal
        isOpen={namingOpen}
        onClose={() => {
          localStorage.setItem('merize-pet-named', '1')
          setNamingOpen(false)
        }}
        title="给你的新宠物起个名字吧！"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.setItem('merize-pet-named', '1')
                setNamingOpen(false)
              }}
            >
              先用默认名
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleNameSave}
              disabled={!nameInput.trim()}
            >
              确定
            </Button>
          </>
        }
      >
        <div style={{ padding: '0.5rem 0', textAlign: 'center' }}>
          <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
            <PixelCat hunger={80} mood={80} anim="happy" />
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            一只可爱的像素猫咪来到了你身边！给它起个名字吧～
          </p>
          <Input
            label="宠物名字"
            value={nameInput}
            onChange={setNameInput}
            placeholder="例如：小橘、团子、咪咪..."
          />
        </div>
      </Modal>

      {/* ═══ Rename Modal ═══ */}
      <Modal
        isOpen={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="重命名宠物"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setRenameOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleNameSave}
              disabled={!nameInput.trim() || nameInput.trim() === pet.name}
            >
              保存
            </Button>
          </>
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          <Input
            label="宠物名字"
            value={nameInput}
            onChange={setNameInput}
            placeholder="给宠物起个名字吧"
          />
        </div>
      </Modal>

      {/* ═══ Pet Shop Modal ═══ */}
      <PetShop isOpen={shopOpen} onClose={() => setShopOpen(false)} />
    </div>
  )
}

// ─── Mini Widget (for embedding in other pages) ───

export function PetMiniWidget() {
  const pet = useAppStore((s) => s.pet)
  const loadPet = useAppStore((s) => s.loadPet)

  useEffect(() => {
    loadPet()
    injectKeyframes()
  }, [loadPet])

  const idleMsg = IDLE_MESSAGES[Math.floor(Date.now() / 30000) % IDLE_MESSAGES.length]
  const msg = pet.hunger < 25
    ? '好饿...'
    : pet.mood < 25
    ? '不开心...'
    : idleMsg

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        width: 100,
      }}
    >
      <SpeechBubble text={msg} mini />
      <div style={{ transform: 'scale(0.65)', transformOrigin: 'center center' }}>
        <PixelCat hunger={pet.hunger} mood={pet.mood} anim={null} />
      </div>
      <span
        style={{
          fontSize: 10,
          color: 'var(--color-text-muted)',
          fontWeight: 600,
        }}
      >
        {pet.name} Lv.{pet.level}
      </span>
    </div>
  )
}
