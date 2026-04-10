import { useState, useCallback, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { AppState } from '../store/useAppStore'
import { Button, Modal } from './ui'

// ─── Types & Data ───

type ShopTab = 'food' | 'decorations' | 'pets'

interface FoodItem {
  id: string
  name: string
  emoji: string
  cost: number
  hunger: number
  mood: number
  xp: number
  description: string
}

interface DecorationItem {
  id: string
  name: string
  emoji: string
  cost: number
}

interface PetTypeItem {
  id: string
  name: string
  emoji: string
  type: string
  cost: number
}

const FOOD_ITEMS: FoodItem[] = [
  { id: 'food-1', name: '普通猫粮', emoji: '🍚', cost: 5, hunger: 15, mood: 0, xp: 0, description: '+15 饱食度' },
  { id: 'food-2', name: '高级猫粮', emoji: '🥩', cost: 10, hunger: 30, mood: 5, xp: 0, description: '+30 饱食 +5 心情' },
  { id: 'food-3', name: '金色鱼干', emoji: '🐟', cost: 15, hunger: 20, mood: 15, xp: 0, description: '+20 饱食 +15 心情' },
  { id: 'food-4', name: '生日蛋糕', emoji: '🎂', cost: 25, hunger: 40, mood: 25, xp: 10, description: '+40 饱食 +25 心情 +10 XP' },
  { id: 'food-5', name: '神秘药水', emoji: '🧪', cost: 50, hunger: 0, mood: 50, xp: 25, description: '+50 心情 +25 XP' },
]

const DECORATION_ITEMS: DecorationItem[] = [
  { id: 'deco-1', name: '蝴蝶结', emoji: '🎀', cost: 20 },
  { id: 'deco-2', name: '小礼帽', emoji: '🎩', cost: 30 },
  { id: 'deco-3', name: '皇冠', emoji: '👑', cost: 50 },
  { id: 'deco-4', name: '围巾', emoji: '🧣', cost: 25 },
  { id: 'deco-5', name: '花环', emoji: '🌸', cost: 15 },
  { id: 'deco-6', name: '墨镜', emoji: '😎', cost: 35 },
]

const PET_TYPE_ITEMS: PetTypeItem[] = [
  { id: 'pet-cat', name: '小橘猫', emoji: '🐱', type: 'cat', cost: 0 },
  { id: 'pet-bird', name: '小蓝鸟', emoji: '🐦', type: 'bird', cost: 100 },
  { id: 'pet-duck', name: '小黄鸭', emoji: '🐤', type: 'duck', cost: 150 },
  { id: 'pet-rabbit', name: '小白兔', emoji: '🐰', type: 'rabbit', cost: 200 },
  { id: 'pet-panda', name: '小熊猫', emoji: '🐼', type: 'panda', cost: 300 },
]

const LS_DECORATIONS = 'trace-pet-decorations'
const LS_UNLOCKED = 'trace-pet-unlocked'

function loadOwned(key: string, fallback: string[]): string[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveOwned(key: string, data: string[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

// ─── Component ───

interface PetShopProps {
  isOpen: boolean
  onClose: () => void
}

export default function PetShop({ isOpen, onClose }: PetShopProps) {
  const [tab, setTab] = useState<ShopTab>('food')
  const pet = useAppStore((s: AppState) => s.pet)
  const updatePetStats = useAppStore((s: AppState) => s.updatePetStats)
  const setPetType = useAppStore((s: AppState) => s.setPetType)
  const setPetDecoration = useAppStore((s: AppState) => s.setPetDecoration)
  const addToast = useAppStore((s: AppState) => s.addToast)

  const [ownedDecorations, setOwnedDecorations] = useState<string[]>(() =>
    loadOwned(LS_DECORATIONS, [])
  )
  const [unlockedPets, setUnlockedPets] = useState<string[]>(() =>
    loadOwned(LS_UNLOCKED, ['cat'])
  )

  // ─── Food purchase ───
  const handleBuyFood = useCallback(
    (item: FoodItem) => {
      if (pet.coins < item.cost) {
        addToast('warning', '金币不足！')
        return
      }
      const updates: Record<string, number | string> = {
        coins: pet.coins - item.cost,
      }
      if (item.hunger > 0) {
        updates.hunger = Math.min(100, pet.hunger + item.hunger)
      }
      if (item.mood > 0) {
        updates.mood = Math.min(100, pet.mood + item.mood)
      }
      if (item.xp > 0) {
        const newXp = pet.xp + item.xp
        const xpPerLevel = pet.level * 100
        if (newXp >= xpPerLevel) {
          updates.level = pet.level + 1
          updates.xp = newXp - xpPerLevel
          addToast('success', `宠物升级到 ${updates.level} 级！`)
        } else {
          updates.xp = newXp
        }
      }
      updates.lastFed = new Date().toISOString()
      updatePetStats(updates)
      addToast('success', `购买了 ${item.name}！`)
    },
    [pet, updatePetStats, addToast],
  )

  // ─── Decoration purchase/equip ───
  const handleDecoAction = useCallback(
    (item: DecorationItem) => {
      const owned = ownedDecorations.includes(item.id)
      if (owned) {
        // Toggle equip
        const newDeco = pet.decoration === item.emoji ? '' : item.emoji
        setPetDecoration(newDeco)
        addToast('success', newDeco ? `装备了 ${item.name}！` : `卸下了 ${item.name}`)
      } else {
        if (pet.coins < item.cost) {
          addToast('warning', '金币不足！')
          return
        }
        updatePetStats({ coins: pet.coins - item.cost })
        const next = [...ownedDecorations, item.id]
        setOwnedDecorations(next)
        saveOwned(LS_DECORATIONS, next)
        setPetDecoration(item.emoji)
        addToast('success', `购买并装备了 ${item.name}！`)
      }
    },
    [pet, ownedDecorations, setPetDecoration, updatePetStats, addToast],
  )

  // ─── Pet unlock/switch ───
  const handlePetAction = useCallback(
    (item: PetTypeItem) => {
      const unlocked = unlockedPets.includes(item.type)
      if (unlocked) {
        setPetType(item.type)
        addToast('success', `切换为 ${item.name}！`)
      } else {
        if (pet.coins < item.cost) {
          addToast('warning', '金币不足！')
          return
        }
        updatePetStats({ coins: pet.coins - item.cost })
        const next = [...unlockedPets, item.type]
        setUnlockedPets(next)
        saveOwned(LS_UNLOCKED, next)
        setPetType(item.type)
        addToast('success', `解锁并切换为 ${item.name}！`)
      }
    },
    [pet, unlockedPets, setPetType, updatePetStats, addToast],
  )

  const tabs: { key: ShopTab; label: string; emoji: string }[] = useMemo(
    () => [
      { key: 'food', label: '食物', emoji: '🍖' },
      { key: 'decorations', label: '装饰', emoji: '👗' },
      { key: 'pets', label: '新宠物', emoji: '🐾' },
    ],
    [],
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🛒 宠物商店" size="lg">
      {/* Coin balance */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer"
              style={{
                background:
                  tab === t.key ? 'var(--color-accent-soft)' : 'transparent',
                color:
                  tab === t.key
                    ? 'var(--color-accent)'
                    : 'var(--color-text-muted)',
                border:
                  tab === t.key
                    ? '1px solid var(--color-accent)'
                    : '1px solid transparent',
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
        <div
          className="flex items-center gap-1.5 font-semibold select-none"
          style={{
            padding: '0.4rem 0.9rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-gold-gradient)',
            color: '#5d4037',
            fontSize: '0.85rem',
            boxShadow:
              '0 2px 8px rgba(255,183,77,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
          }}
        >
          <span>💰</span>
          <span className="tabular-nums">{pet.coins}</span>
        </div>
      </div>

      {/* Tab content */}
      {tab === 'food' && (
        <FoodTab items={FOOD_ITEMS} coins={pet.coins} onBuy={handleBuyFood} />
      )}
      {tab === 'decorations' && (
        <DecoTab
          items={DECORATION_ITEMS}
          coins={pet.coins}
          owned={ownedDecorations}
          equipped={pet.decoration}
          onAction={handleDecoAction}
        />
      )}
      {tab === 'pets' && (
        <PetTab
          items={PET_TYPE_ITEMS}
          coins={pet.coins}
          unlocked={unlockedPets}
          activeType={pet.type}
          onAction={handlePetAction}
        />
      )}
    </Modal>
  )
}

// ─── Food Tab ───

function FoodTab({
  items,
  coins,
  onBuy,
}: {
  items: FoodItem[]
  coins: number
  onBuy: (item: FoodItem) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => {
        const canAfford = coins >= item.cost
        return (
          <div
            key={item.id}
            style={{
              background: 'var(--color-bg-surface-2)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              boxShadow: '0 1px 4px rgba(44,24,16,0.06)',
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                    {item.name}
                  </span>
                  <span
                    className="text-xs font-semibold tabular-nums"
                    style={{ color: canAfford ? '#d4a017' : 'var(--color-danger)' }}
                  >
                    💰 {item.cost}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mb-2">
                  {item.description}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onBuy(item)}
                  disabled={!canAfford}
                  fullWidth
                >
                  {canAfford ? '购买' : '金币不足'}
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Decoration Tab ───

function DecoTab({
  items,
  coins,
  owned,
  equipped,
  onAction,
}: {
  items: DecorationItem[]
  coins: number
  owned: string[]
  equipped: string
  onAction: (item: DecorationItem) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => {
        const isOwned = owned.includes(item.id)
        const isEquipped = equipped === item.emoji
        const canAfford = coins >= item.cost
        return (
          <div
            key={item.id}
            style={{
              background: isEquipped
                ? 'var(--color-accent-soft)'
                : 'var(--color-bg-surface-2)',
              border: isEquipped
                ? '1.5px solid var(--color-accent)'
                : '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              boxShadow: '0 1px 4px rgba(44,24,16,0.06)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                    {item.name}
                  </span>
                  {!isOwned && (
                    <span
                      className="text-xs font-semibold tabular-nums"
                      style={{
                        color: canAfford ? '#d4a017' : 'var(--color-danger)',
                      }}
                    >
                      💰 {item.cost}
                    </span>
                  )}
                  {isOwned && (
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {isEquipped ? '✅ 装备中' : '已拥有'}
                    </span>
                  )}
                </div>
                <Button
                  variant={isEquipped ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => onAction(item)}
                  disabled={!isOwned && !canAfford}
                  fullWidth
                >
                  {isEquipped
                    ? '卸下'
                    : isOwned
                      ? '装备'
                      : canAfford
                        ? '购买'
                        : '金币不足'}
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Pet Tab ───

function PetTab({
  items,
  coins,
  unlocked,
  activeType,
  onAction,
}: {
  items: PetTypeItem[]
  coins: number
  unlocked: string[]
  activeType: string
  onAction: (item: PetTypeItem) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => {
        const isUnlocked = unlocked.includes(item.type)
        const isActive = activeType === item.type
        const canAfford = coins >= item.cost
        return (
          <div
            key={item.id}
            style={{
              background: isActive
                ? 'var(--color-accent-soft)'
                : 'var(--color-bg-surface-2)',
              border: isActive
                ? '1.5px solid var(--color-accent)'
                : '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              boxShadow: '0 1px 4px rgba(44,24,16,0.06)',
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="text-4xl"
                style={{
                  filter: isUnlocked ? 'none' : 'grayscale(1) opacity(0.5)',
                }}
              >
                {item.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                    {item.name}
                  </span>
                  {!isUnlocked && item.cost > 0 && (
                    <span
                      className="text-xs font-semibold tabular-nums"
                      style={{
                        color: canAfford ? '#d4a017' : 'var(--color-danger)',
                      }}
                    >
                      💰 {item.cost}
                    </span>
                  )}
                  {isUnlocked && (
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {isActive ? '✅ 使用中' : '已解锁'}
                    </span>
                  )}
                </div>
                {isActive ? (
                  <Button variant="secondary" size="sm" disabled fullWidth>
                    当前使用中
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onAction(item)}
                    disabled={!isUnlocked && !canAfford}
                    fullWidth
                  >
                    {isUnlocked
                      ? '切换'
                      : canAfford
                        ? '解锁'
                        : '金币不足'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
