import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import { Card, Badge, Button, Modal, Input, Progress } from '../components/ui'

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
        <Card className="md:col-span-2 flex flex-col items-center" padding="lg">
          {/* Decorative background circle */}
          <div
            className="relative flex items-center justify-center w-48 h-48 rounded-full mb-4"
            style={{
              background: isDark
                ? 'radial-gradient(circle, var(--color-accent-soft) 0%, transparent 70%)'
                : 'radial-gradient(circle, var(--color-accent-soft) 0%, transparent 70%)',
            }}
          >
            {/* ASCII art pet */}
            <pre className="text-[var(--color-accent)] font-mono text-sm leading-tight select-none">
              {asciiLines.join('\n')}
            </pre>
            {/* Mood emoji overlay */}
            <span className="absolute -bottom-1 -right-1 text-3xl">{emoji}</span>
          </div>

          {/* Pet name (clickable) + level badge */}
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={handleOpenRename}
              className="text-xl font-bold text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
            >
              {pet.name}
            </button>
            <Badge variant="accent" size="md">Lv.{pet.level}</Badge>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            {TYPE_LABELS[pet.type] || pet.type}
          </p>

          {/* === Status Bars === */}
          <div className="w-full max-w-md space-y-4 mb-6">
            {/* Hunger */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--color-text-secondary)]">饱食度</span>
                <span className="text-[var(--color-text-primary)] tabular-nums">
                  {pet.hunger} / 100
                </span>
              </div>
              <Progress
                value={pet.hunger}
                color={getHungerColor(pet.hunger)}
                showLabel
              />
            </div>

            {/* Mood */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--color-text-secondary)]">心情</span>
                <span className="text-[var(--color-text-primary)] tabular-nums">
                  {pet.mood} / 100
                </span>
              </div>
              <Progress value={pet.mood} color="#3b82f6" showLabel />
            </div>

            {/* XP */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--color-text-secondary)]">升级进度</span>
                <span className="text-[var(--color-text-primary)] tabular-nums">
                  {pet.xp} / {xpToNext} XP
                </span>
              </div>
              <Progress value={xpPercent} color="var(--color-accent)" showLabel />
            </div>
          </div>

          {/* === Actions Row === */}
          <div className="flex flex-wrap items-center gap-3 justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => feedPet()}
              disabled={pet.hunger >= 100 || pet.coins < 5}
              icon={<span>🥖</span>}
            >
              喂食 (-5 币)
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => interactPet()}
              disabled={pet.mood >= 100}
              icon={<span>🎾</span>}
            >
              互动
            </Button>
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--color-bg-surface-2)] text-sm font-medium text-[var(--color-text-primary)]">
              <span>💰</span>
              <span className="tabular-nums">{pet.coins}</span>
            </div>
          </div>
        </Card>

        {/* === Sidebar Info === */}
        <div className="space-y-4">
          {/* Stats card */}
          <Card padding="md">
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-3 text-sm">
              统计信息
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">等级</span>
                <span className="text-[var(--color-text-primary)] font-medium">{pet.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">经验</span>
                <span className="text-[var(--color-text-primary)] font-medium">{pet.xp} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">金币</span>
                <span className="text-[var(--color-text-primary)] font-medium">{pet.coins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">类型</span>
                <span className="text-[var(--color-text-primary)] font-medium">
                  {PET_EMOJI[pet.type]} {TYPE_LABELS[pet.type]}
                </span>
              </div>
            </div>
          </Card>

          {/* Growth rules */}
          <Card padding="md">
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-3 text-sm">
              成长规则
            </h4>
            <ul className="text-xs space-y-1.5 text-[var(--color-text-muted)] leading-relaxed">
              <li className="flex gap-2">
                <span className="shrink-0">📈</span>
                每完成一轮专注 +专注分钟数 XP
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">💰</span>
                每 5 分钟专注 +1 金币
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">🥖</span>
                喂食消耗 5 金币，+15 饱食 +5 心情
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">🎾</span>
                互动免费，+10 心情
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">⬆️</span>
                升级需要 等级 x 100 XP
              </li>
            </ul>
          </Card>
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
        <Input
          label="宠物名字"
          value={newName}
          onChange={setNewName}
          placeholder="给宠物起个名字吧"
        />
      </Modal>
    </div>
  )
}
