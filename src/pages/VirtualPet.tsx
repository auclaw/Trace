import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import { Button, Modal, Input, Progress } from '../components/ui'

// Pet ASCII art by type
const PET_ART: Record<string, string[]> = {
  cat: [
    '  /\\_/\\  ',
    ' ( o.o ) ',
    '  > ^ <  ',
    ' /|   |\\ ',
    '(_|   |_)',
  ],
  dog: [
    '  / \\__  ',
    ' (    @\\___',
    '  /         O',
    ' /   (_____/',
    '/_____/',
  ],
  rabbit: [
    '  (\\ /)  ',
    '  ( . .) ',
    '  c(")(") ',
  ],
}

const TYPE_LABELS: Record<string, string> = {
  cat: '猫咪',
  dog: '狗狗',
  rabbit: '兔子',
}

const PET_EMOJI: Record<string, string> = {
  cat: '🐱',
  dog: '🐶',
  rabbit: '🐰',
}

function getMoodEmoji(hunger: number, mood: number, level: number, type: string): string {
  if (hunger < 20) return '😿'
  if (mood < 20) return '😢'
  if (hunger < 40) return '🙁'
  if (mood < 40) return '😐'
  if (level >= 20) return '🌟'
  if (level >= 10) return '😻'
  return PET_EMOJI[type] || '🐱'
}

function getHungerColor(v: number): string {
  if (v < 30) return '#ef4444'
  if (v < 60) return '#f59e0b'
  return '#22c55e'
}

/* --- keyframe styles injected once --- */
const injectKeyframes = (() => {
  let injected = false
  return () => {
    if (injected) return
    injected = true
    const style = document.createElement('style')
    style.textContent = `
      @keyframes petBreathe {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-6px) scale(1.03); }
      }
      @keyframes petGlow {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 0.85; }
      }
    `
    document.head.appendChild(style)
  }
})()

export default function VirtualPet() {
  const { isDark } = useTheme()
  const pet = useAppStore((s) => s.pet)
  const loadPet = useAppStore((s) => s.loadPet)
  const feedPet = useAppStore((s) => s.feedPet)
  const interactPet = useAppStore((s) => s.interactPet)
  const renamePet = useAppStore((s) => s.renamePet)

  const [renameOpen, setRenameOpen] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    loadPet()
  }, [loadPet])

  useEffect(() => {
    injectKeyframes()
  }, [])

  const xpToNext = pet.level * 100
  const xpPercent = Math.min(100, (pet.xp / xpToNext) * 100)

  const emoji = useMemo(
    () => getMoodEmoji(pet.hunger, pet.mood, pet.level, pet.type),
    [pet.hunger, pet.mood, pet.level, pet.type],
  )

  const handleOpenRename = () => {
    setNewName(pet.name)
    setRenameOpen(true)
  }

  const handleRename = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    renamePet(trimmed)
    setRenameOpen(false)
  }

  const asciiLines = PET_ART[pet.type] || PET_ART.cat

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
        {/* === Pet Display Area === */}
        <div
          className="md:col-span-2 flex flex-col items-center"
          style={{
            background: isDark
              ? 'linear-gradient(145deg, var(--color-bg-surface-1) 0%, var(--color-bg-surface-2) 100%)'
              : 'linear-gradient(145deg, #fffcf7 0%, var(--color-bg-surface-2) 100%)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: '2rem 1.75rem',
          }}
        >
          {/* Decorative background circle with glow */}
          <div
            className="relative flex items-center justify-center rounded-full mb-6"
            style={{
              width: '14rem',
              height: '14rem',
              background: isDark
                ? 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0.04) 50%, transparent 75%)'
                : 'radial-gradient(circle, rgba(249,115,22,0.10) 0%, rgba(255,213,79,0.08) 40%, transparent 75%)',
            }}
          >
            {/* Soft glow layer */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, var(--color-accent-soft) 0%, transparent 65%)',
                filter: 'blur(12px)',
                animation: 'petGlow 3s ease-in-out infinite',
              }}
            />
            {/* ASCII art pet with breathing animation */}
            <pre
              className="relative text-sm leading-tight select-none font-mono"
              style={{
                color: 'var(--color-accent)',
                animation: 'petBreathe 3s ease-in-out infinite',
                textShadow: isDark
                  ? '0 0 12px rgba(249,115,22,0.3)'
                  : '0 0 8px rgba(249,115,22,0.15)',
              }}
            >
              {asciiLines.join('\n')}
            </pre>
            {/* Mood emoji overlay */}
            <span
              className="absolute text-4xl"
              style={{
                bottom: '-0.25rem',
                right: '-0.25rem',
                filter: 'drop-shadow(0 2px 4px rgba(44,24,16,0.15))',
              }}
            >
              {emoji}
            </span>
          </div>

          {/* Pet name (clickable) + level badge */}
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
          <p className="text-sm text-[var(--color-text-muted)] mb-8">
            {TYPE_LABELS[pet.type] || pet.type}
          </p>

          {/* === Status Bars === */}
          <div className="w-full max-w-md space-y-5 mb-8">
            {/* Hunger */}
            <div
              style={{
                background: isDark ? 'var(--color-bg-surface-2)' : 'rgba(34,197,94,0.04)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
              }}
            >
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[var(--color-text-secondary)] font-medium">🍖 饱食度</span>
                <span className="text-[var(--color-text-primary)] tabular-nums font-semibold">
                  <span className="metric-value" style={{ fontSize: '0.85rem' }}>{pet.hunger}</span>
                  <span className="text-[var(--color-text-muted)]"> / 100</span>
                </span>
              </div>
              <Progress
                value={pet.hunger}
                color={getHungerColor(pet.hunger)}
                showLabel
                size="md"
              />
            </div>

            {/* Mood */}
            <div
              style={{
                background: isDark ? 'var(--color-bg-surface-2)' : 'rgba(236,72,153,0.04)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
              }}
            >
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[var(--color-text-secondary)] font-medium">💕 心情</span>
                <span className="text-[var(--color-text-primary)] tabular-nums font-semibold">
                  <span className="metric-value" style={{ fontSize: '0.85rem' }}>{pet.mood}</span>
                  <span className="text-[var(--color-text-muted)]"> / 100</span>
                </span>
              </div>
              <Progress value={pet.mood} color="#ec4899" showLabel size="md" />
            </div>

            {/* XP */}
            <div
              style={{
                background: isDark ? 'var(--color-bg-surface-2)' : 'var(--color-accent-soft)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
              }}
            >
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[var(--color-text-secondary)] font-medium">⚡ 升级进度</span>
                <span className="text-[var(--color-text-primary)] tabular-nums font-semibold">
                  <span className="metric-value" style={{ fontSize: '0.85rem' }}>{pet.xp}</span>
                  <span className="text-[var(--color-text-muted)]"> / {xpToNext} XP</span>
                </span>
              </div>
              <Progress value={xpPercent} color="var(--color-accent)" showLabel size="md" />
            </div>
          </div>

          {/* === Actions Row === */}
          <div className="flex flex-wrap items-center gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => feedPet()}
              disabled={pet.hunger >= 100 || pet.coins < 5}
              icon={<span className="text-lg">🥖</span>}
              className="shadow-[var(--shadow-accent)]"
            >
              喂食 (-5 币)
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => interactPet()}
              disabled={pet.mood >= 100}
              icon={<span className="text-lg">🎾</span>}
            >
              互动
            </Button>
            {/* Coin badge with golden gradient */}
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
              <span className="tabular-nums metric-value" style={{ fontSize: '1rem', lineHeight: 1.2, background: 'linear-gradient(135deg, #5d4037, #3e2723)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {pet.coins}
              </span>
            </div>
          </div>
        </div>

        {/* === Sidebar Info === */}
        <div className="space-y-5">
          {/* Stats card */}
          <div
            style={{
              background: isDark
                ? 'linear-gradient(145deg, var(--color-bg-surface-1), var(--color-bg-surface-2))'
                : 'linear-gradient(145deg, #fffcf7, var(--color-bg-surface-2))',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              padding: '1.5rem',
            }}
          >
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-4 text-sm flex items-center gap-2">
              <span>📊</span> 统计信息
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-muted)]">等级</span>
                <span className="metric-value" style={{ fontSize: '1.1rem' }}>{pet.level}</span>
              </div>
              <div
                style={{
                  height: '1px',
                  background: 'var(--color-border-subtle)',
                }}
              />
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-muted)]">经验</span>
                <span className="text-[var(--color-text-primary)] font-semibold tabular-nums">{pet.xp} XP</span>
              </div>
              <div
                style={{
                  height: '1px',
                  background: 'var(--color-border-subtle)',
                }}
              />
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-muted)]">金币</span>
                <span
                  className="font-semibold tabular-nums"
                  style={{
                    background: 'var(--color-gold-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {pet.coins}
                </span>
              </div>
              <div
                style={{
                  height: '1px',
                  background: 'var(--color-border-subtle)',
                }}
              />
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-muted)]">类型</span>
                <span className="text-[var(--color-text-primary)] font-medium">
                  {PET_EMOJI[pet.type]} {TYPE_LABELS[pet.type]}
                </span>
              </div>
            </div>
          </div>

          {/* Growth rules */}
          <div
            style={{
              background: isDark
                ? 'linear-gradient(145deg, var(--color-bg-surface-1), var(--color-bg-surface-2))'
                : 'linear-gradient(145deg, #fffcf7, var(--color-bg-surface-2))',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              padding: '1.5rem',
            }}
          >
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-4 text-sm flex items-center gap-2">
              <span>📖</span> 成长规则
            </h4>
            <ul className="text-xs space-y-3 text-[var(--color-text-muted)] leading-relaxed">
              <li className="flex gap-2.5 items-start">
                <span
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-accent-soft)',
                    fontSize: '0.7rem',
                  }}
                >📈</span>
                <span>每完成一轮专注 +专注分钟数 XP</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,213,79,0.15)',
                    fontSize: '0.7rem',
                  }}
                >💰</span>
                <span>每 5 分钟专注 +1 金币</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-success-soft)',
                    fontSize: '0.7rem',
                  }}
                >🥖</span>
                <span>喂食消耗 5 金币，+15 饱食 +5 心情</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-info-soft)',
                    fontSize: '0.7rem',
                  }}
                >🎾</span>
                <span>互动免费，+10 心情</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-warning-soft)',
                    fontSize: '0.7rem',
                  }}
                >⬆️</span>
                <span>升级需要 等级 x 100 XP</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* === Rename Modal === */}
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
              onClick={handleRename}
              disabled={!newName.trim() || newName.trim() === pet.name}
            >
              保存
            </Button>
          </>
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          <Input
            label="宠物名字"
            value={newName}
            onChange={setNewName}
            placeholder="给宠物起个名字吧"
          />
        </div>
      </Modal>
    </div>
  )
}
