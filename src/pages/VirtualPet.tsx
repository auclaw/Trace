// Virtual Pet Page
// 效率宠物 - 专注涨经验，分心掉心情，和用户效率绑定一起成长

import React, { useState, useEffect } from 'react'
import type { Theme } from '../App'
import {
  getPet,
  feedPet,
  interactPet,
  renamePet,
  type PetDTO
} from '../utils/api'

interface VirtualPetProps {
  theme: Theme
}

const VirtualPet: React.FC<VirtualPetProps> = ({ theme }) => {
  const isDark = theme === 'dark'
  const titleColor = isDark ? 'text-aether-text-dark-primary' : 'text-aether-text-primary'
  const textColor = isDark ? 'text-aether-text-dark-secondary' : 'text-aether-text-secondary'
  const cardBg = isDark ? 'bg-aether-dark-200' : 'bg-aether-200'
  const borderColor = isDark ? 'border-[var(--color-border-subtle)]' : 'border-[var(--color-border-subtle)]'

  const [pet, setPet] = useState<PetDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadPet = async () => {
    setLoading(true)
    try {
      const data = await getPet()
      setPet(data)
      setNewName(data.name)
    } catch (err) {
      console.error('加载宠物失败', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPet()
  }, [])

  const handleFeed = async (foodType: string = 'normal') => {
    setActionLoading(true)
    try {
      const result = await feedPet(foodType)
      if (pet) {
        setPet({
          ...pet,
          ...result,
        })
      }
      const msg = result.leveled_up
        ? `恭喜！你的宠物升级到 ${result.new_level} 级了！`
        : '喂食成功！'
      alert(msg)
    } catch (err) {
      console.error('喂食失败', err)
      alert('操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleInteract = async () => {
    setActionLoading(true)
    try {
      if (!pet) return
      const result = await interactPet(pet.id)
      setPet({
        ...pet,
        mood: result.mood,
      })
      alert('互动成功！心情提升了～')
    } catch (err) {
      console.error('互动失败', err)
      alert('操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRename = async () => {
    if (!newName.trim() || !pet) return
    setActionLoading(true)
    try {
      const result = await renamePet(newName.trim(), pet.pet_type)
      setPet(result)
      setShowRenameModal(false)
    } catch (err) {
      console.error('重命名失败', err)
      alert('操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const changePetType = async (newType: 'cat' | 'dog' | 'rabbit') => {
    if (!pet) return
    if (!confirm(`确定要更换宠物类型为 ${newType === 'cat' ? '猫咪' : newType === 'dog' ? '狗狗' : '兔子'} 吗？`)) return
    setActionLoading(true)
    try {
      const result = await renamePet(pet.name, newType)
      setPet(result)
    } catch (err) {
      console.error('更换类型失败', err)
      alert('操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  // 计算经验条百分比
  const getExpPercentage = (): number => {
    if (!pet) return 0
    const requiredExp = pet.level * 100
    return (pet.experience / requiredExp) * 100
  }

  // 获取宠物表情根据状态
  const getPetEmoji = (): string => {
    if (!pet) return '🐱'
    if (pet.hunger < 20) return '😿'
    if (pet.mood < 20) return '😢'
    if (pet.hunger < 40) return '😿'
    if (pet.mood < 40) return '🙁'
    if (pet.level >= 20) return '🌟'
    if (pet.level >= 10) return '😻'
    return pet.pet_type === 'cat' ? '🐱' : pet.pet_type === 'dog' ? '🐶' : '🐰'
  }

  const getStatusColor = (value: number): string => {
    if (value < 20) return 'bg-red-500'
    if (value < 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className={`text-center py-12 ${textColor}`}>加载中...</div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="p-8">
        <div className={`text-center py-12 ${textColor}`}>加载宠物失败</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className={`text-2xl font-bold ${titleColor} mb-2`}>
          {pet.name} 🌟
        </h2>
        <p className={textColor}>
          你的效率宠物会随着你的专注工作一起成长，专注加分心减，养成好习惯养好宠物～
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 宠物主展示区 */}
        <div className={`${cardBg} rounded-2xl p-8 border ${borderColor} md:col-span-2 text-center`}>
          <div className="text-[120px] leading-none mb-6">{getPetEmoji()}</div>
          <h3 className={`text-2xl font-bold ${titleColor} mb-2`}>{pet.name}</h3>
          <p className={`${textColor} mb-6`}>
            Lv.{pet.level} {pet.pet_type === 'cat' ? '猫咪' : pet.pet_type === 'dog' ? '狗狗' : '兔子'}
          </p>

          {/* 经验条 */}
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-1">
              <span className={textColor}>升级进度</span>
              <span className={titleColor}>{pet.experience} / {pet.level * 100} XP</span>
            </div>
            <div className={`w-full h-4 rounded-full ${isDark ? 'bg-aether-dark-300' : 'bg-aether-300'} overflow-hidden`}>
              <div
                className="h-full bg-gradient-to-r from-[var(--color-accent)] to-green-500 transition-all duration-500"
                style={{ width: `${getExpPercentage()}%` }}
              ></div>
            </div>
          </div>

          {/* 状态栏 */}
          <div className="space-y-4 mb-8 text-left">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className={textColor}>饱食度</span>
                <span className={titleColor}>{pet.hunger} / 100</span>
              </div>
              <div className={`w-full h-3 rounded-full ${isDark ? 'bg-aether-dark-300' : 'bg-aether-300'} overflow-hidden`}>
                <div
                  className={`h-full ${getStatusColor(pet.hunger)} transition-all duration-300`}
                  style={{ width: `${pet.hunger}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className={textColor}>心情</span>
                <span className={titleColor}>{pet.mood} / 100</span>
              </div>
              <div className={`w-full h-3 rounded-full ${isDark ? 'bg-aether-dark-300' : 'bg-aether-300'} overflow-hidden`}>
                <div
                  className={`h-full ${getStatusColor(pet.mood)} transition-all duration-300`}
                  style={{ width: `${pet.mood}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => handleFeed('normal')}
              disabled={actionLoading}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
            >
              🥖 普通喂食 (+10饱食 +5心情)
            </button>
            <button
              onClick={() => handleFeed('premium')}
              disabled={actionLoading}
              className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
            >
              🍗 高级喂食 (+20饱食 +10心情 -5硬币)
            </button>
            <button
              onClick={handleInteract}
              disabled={actionLoading}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
            >
              🎾 玩耍 (+15心情)
            </button>
          </div>
        </div>

        {/* 侧边信息和设置 */}
        <div className={`${cardBg} rounded-xl p-6 border ${borderColor} space-y-6`}>
          <div>
            <h4 className={`font-semibold ${titleColor} mb-3`}>统计信息</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={textColor}>等级</span>
                <span className={`${titleColor} font-medium`}>{pet.level}</span>
              </div>
              <div className="flex justify-between">
                <span className={textColor}>总经验</span>
                <span className={`${titleColor} font-medium`}>{pet.experience}</span>
              </div>
              <div className="flex justify-between">
                <span className={textColor}>金币</span>
                <span className={`${titleColor} font-medium`}>{pet.coins} 💰</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 border-[var(--color-border-subtle)]">
            <h4 className={`font-semibold ${titleColor} mb-3`}>更换宠物</h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => changePetType('cat')}
                disabled={actionLoading || pet.pet_type === 'cat'}
                className={`p-3 rounded-lg text-3xl text-center transition-colors ${
                  pet.pet_type === 'cat'
                    ? 'bg-[var(--color-accent)] text-white'
                    : isDark ? 'bg-aether-dark-300 hover:bg-aether-dark-400' : 'bg-aether-300 hover:bg-aether-400'
                } disabled:opacity-50`}
              >
                🐱
              </button>
              <button
                onClick={() => changePetType('dog')}
                disabled={actionLoading || pet.pet_type === 'dog'}
                className={`p-3 rounded-lg text-3xl text-center transition-colors ${
                  pet.pet_type === 'dog'
                    ? 'bg-[var(--color-accent)] text-white'
                    : isDark ? 'bg-aether-dark-300 hover:bg-aether-dark-400' : 'bg-aether-300 hover:bg-aether-400'
                } disabled:opacity-50`}
              >
                🐶
              </button>
              <button
                onClick={() => changePetType('rabbit')}
                disabled={actionLoading || pet.pet_type === 'rabbit'}
                className={`p-3 rounded-lg text-3xl text-center transition-colors ${
                  pet.pet_type === 'rabbit'
                    ? 'bg-[var(--color-accent)] text-white'
                    : isDark ? 'bg-aether-dark-300 hover:bg-aether-dark-400' : 'bg-aether-300 hover:bg-aether-400'
                } disabled:opacity-50`}
              >
                🐰
              </button>
            </div>
          </div>

          <div className="border-t pt-6 border-[var(--color-border-subtle)]">
            <h4 className={`font-semibold ${titleColor} mb-3`}>设置</h4>
            <button
              onClick={() => setShowRenameModal(true)}
              className="w-full px-4 py-2 text-left rounded-lg border border-[var(--color-border-subtle)] hover:bg-opacity-80 transition-colors"
            >
              <span className={textColor}>重命名宠物</span>
              <p className={`${titleColor} font-medium`}>当前: {pet.name}</p>
            </button>
          </div>

          <div className="border-t pt-6 border-[var(--color-border-subtle)]">
            <h4 className={`font-semibold ${titleColor} mb-3`}>成长规则</h4>
            <ul className={`text-sm space-y-1 ${textColor}`}>
              <li>• 每专注 1 分钟 +1 经验</li>
              <li>• 连续专注 25 分钟 +5 金币</li>
              <li>• 每分钟分心会降低心情</li>
              <li>• 饱食度每天会自然下降</li>
              <li>• 宠物升级需要经验</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 重命名模态框 */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${cardBg} rounded-xl p-6 w-full max-w-sm border ${borderColor}`}>
            <h3 className={`text-xl font-semibold ${titleColor} mb-4`}>重命名宠物</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="输入宠物名字"
              className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
                isDark ? 'bg-aether-dark-300 text-aether-text-dark-primary' : 'bg-aether-200 text-aether-text-primary'
              }`}
            />
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setShowRenameModal(false)}
                className={`px-4 py-2 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'text-gray-700 bg-gray-100'} rounded-lg hover:bg-gray-200 transition-colors`}
              >
                取消
              </button>
              <button
                onClick={handleRename}
                disabled={actionLoading || !newName.trim()}
                className="px-4 py-2 bg-[var(--color-accent)] text-[#fffefb] rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VirtualPet
