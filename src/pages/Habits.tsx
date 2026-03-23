import { useState, useEffect, useCallback } from 'react'
import type { Theme } from '../App'
import { apiRequest } from '../utils/api'

interface Habit {
  id: number
  name: string
  target_hours: number
}

interface HabitCheckin {
  id: number
  habit_id: number
  checkin_date: string
  actual_hours: number
  completed: number
}

interface HabitsProps {
  theme: Theme
}

const Habits: React.FC<HabitsProps> = ({ theme }) => {
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState(true)
  const [habits, setHabits] = useState<Habit[]>([])
  const [checkins, setCheckins] = useState<HabitCheckin[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTargetHours, setNewTargetHours] = useState('1.0')
  const today = new Date().toISOString().split('T')[0]

  const loadHabits = useCallback(async () => {
    try {
      const response = await apiRequest('/api/habits', 'GET')
      if (response.code === 200) {
        setHabits(response.data.habits)
        setCheckins(response.data.checkins)
      }
    } catch (error) {
      console.error('加载习惯列表失败', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const createHabit = async () => {
    if (!newName.trim()) {
      alert('习惯名称不能为空')
      return
    }
    const target = parseFloat(newTargetHours)
    if (isNaN(target) || target <= 0) {
      alert('请输入有效的目标小时数')
      return
    }
    try {
      const response = await apiRequest('/api/habits/create', 'POST', {
        name: newName.trim(),
        target_hours: target
      })
      if (response.code === 200) {
        setNewName('')
        setNewTargetHours('1.0')
        setShowCreate(false)
        loadHabits()
      }
    } catch (error) {
      console.error('创建习惯失败', error)
    }
  }

  const checkinHabit = async (habitId: number, targetHours: number) => {
    // Simple dialog to get actual hours
    const actualStr = prompt('输入今日实际小时数：', targetHours.toString())
    if (actualStr === null) return
    const actual = parseFloat(actualStr)
    if (isNaN(actual) || actual < 0) {
      alert('请输入有效的小时数')
      return
    }
    try {
      await apiRequest('/api/habits/checkin', 'POST', {
        habit_id: habitId,
        checkin_date: today,
        actual_hours: actual,
        completed: actual >= targetHours ? 1 : 0
      })
      // Reload
      loadHabits()
    } catch (error) {
      console.error('打卡失败', error)
      alert('打卡失败')
    }
  }

  const getCompletionPercentage = (actual: number, target: number) => {
    return Math.min(100, Math.round((actual / target) * 100))
  }

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-green-500'
    if (pct >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  useEffect(() => {
    loadHabits()
  }, [loadHabits])

  const bgClass = isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
  const cardBgClass = isDark ? 'bg-gray-800' : 'bg-gray-50'
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200'
  const buttonPrimaryClass = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded'
  const buttonSecondaryClass = isDark
    ? 'bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-900 px-3 py-1 rounded'

  if (loading) {
    return (
      <div className={`${bgClass} min-h-screen p-4`}>
        <div className="animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <div className={`${bgClass} min-h-screen p-4`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">习惯目标</h1>
          <button
            className={buttonPrimaryClass}
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? '取消' : '+ 添加习惯'}
          </button>
        </div>

        {/* Create New Habit */}
        {showCreate && (
          <div className={`mb-6 p-4 border ${borderClass} rounded ${cardBgClass}`}>
            <h2 className="text-lg font-semibold mb-4">添加新习惯</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">习惯名称</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full px-3 py-2 border ${borderClass} rounded ${isDark ? 'bg-gray-700' : 'bg-white'}`}
                  placeholder="例如：深度工作"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">每日目标小时数</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={newTargetHours}
                  onChange={(e) => setNewTargetHours(e.target.value)}
                  className={`w-full px-3 py-2 border ${borderClass} rounded ${isDark ? 'bg-gray-700' : 'bg-white'}`}
                />
              </div>
              <div>
                <button className={buttonPrimaryClass} onClick={createHabit}>
                  创建
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Habit List */}
        <div className="space-y-4">
          {habits.length === 0 ? (
            <div className={`p-8 text-center border ${borderClass} rounded ${cardBgClass}`}>
              <p className="text-gray-500">还没有添加任何习惯目标</p>
              <p className="text-sm text-gray-400 mt-1">添加习惯，每日打卡，追踪进步</p>
            </div>
          ) : (
            habits.map(habit => {
              // Get today's checkin if exists
              const todayCheckin = checkins.find(
                c => c.habit_id === habit.id && c.checkin_date === today
              )
              const actualHours = todayCheckin?.actual_hours ?? 0
              const completed = todayCheckin?.completed ?? 0
              const pct = getCompletionPercentage(actualHours, habit.target_hours)

              return (
                <div
                  key={habit.id}
                  className={`p-4 border ${borderClass} rounded ${cardBgClass}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">{habit.name}</h3>
                      <p className="text-sm text-gray-500">
                        目标：{habit.target_hours} 小时/天
                      </p>
                    </div>
                    <button
                      className={buttonSecondaryClass}
                      onClick={() => checkinHabit(habit.id, habit.target_hours)}
                    >
                      今日打卡
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className={`h-4 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                    <div
                      className={`h-full ${getProgressColor(pct)} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="mt-2 text-sm text-gray-500 flex justify-between">
                    <span>今日：{actualHours.toFixed(1)} 小时</span>
                    <span>{pct}%</span>
                  </div>

                  {completed === 1 && (
                    <div className="mt-2">
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                        ✓ 今日完成
                      </span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default Habits
