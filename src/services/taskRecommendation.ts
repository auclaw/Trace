import type { Task } from './dataService'

// ==================== 类型定义 ====================

/**
 * 推荐权重配置
 * 所有因子权重总和建议为 1.0，便于理解
 */
export interface RecommendationWeights {
  // 优先级权重：P0 最高，P3 最低
  priority: number

  // 时间紧迫性权重：截止日期越近，分数越高
  urgency: number

  // 预估时长权重：优先推荐适合当前空闲时间的任务
  durationFit: number

  // 用户习惯权重：用户习惯在某个时间段做的任务类型
  habit: number

  // 任务进度权重：优先推荐接近完成的任务
  progress: number

  // 上下文匹配权重：与用户当前活动相关的任务优先
  contextMatch: number

  // 情感标签权重：阻力小的任务优先（easy > neutral > resist）
  emotionalTag: number
}

/**
 * 用户习惯记录
 */
export interface UserHabitRecord {
  // 时间段（小时 0-23）-> 任务类别 -> 完成次数
  timeCategoryCounts: Record<number, Record<string, number>>

  // 星期几 -> 任务类别 -> 完成次数
  weekdayCategoryCounts: Record<number, Record<string, number>>

  // 任务类别 -> 平均完成时长
  categoryAverageDuration: Record<string, number>

  // 最近完成的任务 ID 列表（用于去重推荐）
  recentCompletedTaskIds: string[]
}

/**
 * 带推荐分数的任务
 */
export interface ScoredTask {
  task: Task
  score: number
  breakdown: {
    priorityScore: number
    urgencyScore: number
    durationFitScore: number
    habitScore: number
    progressScore: number
    emotionalScore: number
  }
  reason: string  // AI 解释为什么推荐这个任务
}

/**
 * 推荐模式
 */
export type RecommendationMode = 'ai_auto' | 'user_custom' | 'priority_only'

// ==================== 默认配置 ====================

export const DEFAULT_WEIGHTS: RecommendationWeights = {
  priority: 0.35,
  urgency: 0.25,
  durationFit: 0.15,
  habit: 0.10,
  progress: 0.08,
  contextMatch: 0.05,
  emotionalTag: 0.02,
}

export const MINIMAL_WEIGHTS: RecommendationWeights = {
  priority: 0.60,
  urgency: 0.20,
  durationFit: 0.10,
  habit: 0.05,
  progress: 0.03,
  contextMatch: 0.02,
  emotionalTag: 0.00,
}

export const BALANCED_WEIGHTS: RecommendationWeights = {
  priority: 0.30,
  urgency: 0.30,
  durationFit: 0.15,
  habit: 0.10,
  progress: 0.10,
  contextMatch: 0.03,
  emotionalTag: 0.02,
}

// ==================== 用户习惯存储 ====================

const HABIT_STORAGE_KEY = 'trace-user-habits'

function loadUserHabits(): UserHabitRecord {
  try {
    const stored = localStorage.getItem(HABIT_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load user habits', e)
  }
  return {
    timeCategoryCounts: {},
    weekdayCategoryCounts: {},
    categoryAverageDuration: {},
    recentCompletedTaskIds: [],
  }
}

function saveUserHabits(habits: UserHabitRecord): void {
  try {
    localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(habits))
  } catch (e) {
    console.warn('Failed to save user habits', e)
  }
}

// ==================== 评分函数 ====================

/**
 * 优先级评分
 * P0 = 100分, P1 = 80分, P2 = 60分, P3 = 40分, P4 = 20分
 */
function calculatePriorityScore(task: Task): number {
  const priorityScores: Record<number, number> = {
    0: 100,  // P0 - 最高优先级
    1: 80,   // P1
    2: 60,   // P2
    3: 40,   // P3
    4: 20,   // P4
  }
  return priorityScores[task.priority] || 50
}

/**
 * 时间紧迫性评分
 * 考虑截止日期和当前时间
 */
function calculateUrgencyScore(task: Task): number {
  if (!task.dueDate) {
    return 30 // 没有截止日期的任务基础分
  }

  const now = new Date()
  const dueDate = new Date(task.dueDate)
  const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

  if (daysUntilDue < 0) {
    return 100 // 已逾期
  } else if (daysUntilDue === 0) {
    return 95 // 今天截止
  } else if (daysUntilDue <= 1) {
    return 85 // 明天截止
  } else if (daysUntilDue <= 3) {
    return 70 // 3天内
  } else if (daysUntilDue <= 7) {
    return 50 // 一周内
  } else if (daysUntilDue <= 14) {
    return 30 // 两周内
  }
  return 15 // 两周以后
}

/**
 * 时长适配评分
 * 根据当前可用时间推荐合适时长的任务
 */
function calculateDurationFitScore(task: Task, availableMinutes: number = 60): number {
  const estimated = task.estimatedMinutes || 30

  if (estimated <= availableMinutes * 0.5) {
    // 任务太短，但可以接受
    return 60
  } else if (estimated <= availableMinutes) {
    // 刚好适合
    return 100
  } else if (estimated <= availableMinutes * 1.5) {
    // 稍微长一点，可以分块做
    return 75
  }
  // 太长了，现在不适合做
  return 30
}

/**
 * 用户习惯评分
 * 根据用户历史习惯判断当前时间是否适合做这类任务
 */
function calculateHabitScore(task: Task, habits: UserHabitRecord): number {
  const now = new Date()
  const hour = now.getHours()
  const weekday = now.getDay()

  let score = 50 // 默认中间分

  // 检查时间段习惯
  const timeCounts = habits.timeCategoryCounts[hour]
  if (timeCounts && timeCounts[task.project]) {
    score += Math.min(timeCounts[task.project] * 5, 30)
  }

  // 检查星期几习惯
  const weekdayCounts = habits.weekdayCategoryCounts[weekday]
  if (weekdayCounts && weekdayCounts[task.project]) {
    score += Math.min(weekdayCounts[task.project] * 3, 20)
  }

  return Math.min(score, 100)
}

/**
 * 任务进度评分
 * 优先推荐已经开始且接近完成的任务
 */
function calculateProgressScore(task: Task): number {
  if (task.status === 'completed') {
    return 0
  }

  if (task.actualMinutes > 0 && task.estimatedMinutes > 0) {
    const progress = task.actualMinutes / task.estimatedMinutes
    if (progress >= 0.8) {
      // 接近完成，强力推荐
      return 100
    } else if (progress >= 0.5) {
      // 过半，推荐
      return 80
    } else if (progress > 0) {
      // 已开始，优先推荐
      return 60
    }
  }

  // 未开始
  return 40
}

/**
 * 情感标签评分
 * easy > neutral > resist
 */
function calculateEmotionalScore(task: Task): number {
  const tagScores: Record<string, number> = {
    easy: 100,
    neutral: 70,
    resist: 30,
  }
  return tagScores[task.emotionalTag || 'neutral'] || 70
}

// ==================== 生成推荐理由 ====================

function generateRecommendationReason(_task: Task, breakdown: ScoredTask['breakdown']): string {
  const reasons: string[] = []

  if (breakdown.priorityScore >= 80) {
    reasons.push('优先级高')
  }

  if (breakdown.urgencyScore >= 80) {
    if (breakdown.urgencyScore >= 95) {
      reasons.push('今天截止')
    } else if (breakdown.urgencyScore >= 90) {
      reasons.push('已逾期')
    } else {
      reasons.push('即将截止')
    }
  }

  if (breakdown.progressScore >= 80) {
    reasons.push('接近完成')
  } else if (breakdown.progressScore >= 60) {
    reasons.push('已开始')
  }

  if (breakdown.habitScore >= 70) {
    reasons.push('符合你的习惯')
  }

  if (breakdown.emotionalScore >= 90) {
    reasons.push('轻松易开始')
  }

  if (reasons.length === 0) {
    return 'AI 为你推荐'
  }

  return reasons.join(' · ')
}

// ==================== 公开 API ====================

/**
 * 为任务列表计算推荐分数并排序
 * @param tasks 待排序的任务列表
 * @param weights 权重配置
 * @param availableMinutes 当前可用时间（分钟）
 * @param currentActivityCategory 当前活动类别（用于上下文匹配）
 */
export function scoreAndSortTasks(
  tasks: Task[],
  weights: RecommendationWeights = DEFAULT_WEIGHTS,
  availableMinutes: number = 60,
  currentActivityCategory?: string
): ScoredTask[] {
  const habits = loadUserHabits()

  const scoredTasks: ScoredTask[] = tasks
    .filter(task => task.status !== 'completed')
    .map(task => {
      const priorityScore = calculatePriorityScore(task)
      const urgencyScore = calculateUrgencyScore(task)
      const durationFitScore = calculateDurationFitScore(task, availableMinutes)
      const habitScore = calculateHabitScore(task, habits)
      const progressScore = calculateProgressScore(task)
      const emotionalScore = calculateEmotionalScore(task)

      // 上下文匹配分（简化实现）
      let contextScore = 50
      if (currentActivityCategory && task.project.includes(currentActivityCategory)) {
        contextScore = 100
      }

      // 加权总分
      const totalScore =
        priorityScore * weights.priority +
        urgencyScore * weights.urgency +
        durationFitScore * weights.durationFit +
        habitScore * weights.habit +
        progressScore * weights.progress +
        contextScore * weights.contextMatch +
        emotionalScore * weights.emotionalTag

      const breakdown = {
        priorityScore,
        urgencyScore,
        durationFitScore,
        habitScore,
        progressScore,
        emotionalScore,
      }

      return {
        task,
        score: totalScore,
        breakdown,
        reason: generateRecommendationReason(task, breakdown),
      }
    })

  // 按分数降序排序
  return scoredTasks.sort((a, b) => b.score - a.score)
}

/**
 * 获取前 N 个推荐任务
 */
export function getTopRecommendations(
  tasks: Task[],
  count: number = 3,
  weights?: RecommendationWeights,
  availableMinutes?: number
): ScoredTask[] {
  return scoreAndSortTasks(tasks, weights, availableMinutes).slice(0, count)
}

/**
 * 记录任务完成，更新用户习惯数据
 * 用户完成任务后调用此函数，AI 会学习用户的习惯
 */
export function recordTaskCompletion(task: Task): void {
  const habits = loadUserHabits()
  const now = new Date()
  const hour = now.getHours()
  const weekday = now.getDay()
  const category = task.project || 'default'

  // 更新时间段计数
  if (!habits.timeCategoryCounts[hour]) {
    habits.timeCategoryCounts[hour] = {}
  }
  habits.timeCategoryCounts[hour][category] = (habits.timeCategoryCounts[hour][category] || 0) + 1

  // 更新星期几计数
  if (!habits.weekdayCategoryCounts[weekday]) {
    habits.weekdayCategoryCounts[weekday] = {}
  }
  habits.weekdayCategoryCounts[weekday][category] = (habits.weekdayCategoryCounts[weekday][category] || 0) + 1

  // 更新分类平均时长
  if (task.actualMinutes > 0) {
    const currentAvg = habits.categoryAverageDuration[category] || 0
    const currentCount = habits.weekdayCategoryCounts[weekday][category]
    habits.categoryAverageDuration[category] =
      (currentAvg * (currentCount - 1) + task.actualMinutes) / currentCount
  }

  // 记录最近完成的任务
  habits.recentCompletedTaskIds.unshift(task.id)
  habits.recentCompletedTaskIds = habits.recentCompletedTaskIds.slice(0, 50)

  saveUserHabits(habits)
}

/**
 * 获取用户的习惯统计
 */
export function getUserHabits(): UserHabitRecord {
  return loadUserHabits()
}

/**
 * 重置用户习惯数据
 */
export function resetUserHabits(): void {
  localStorage.removeItem(HABIT_STORAGE_KEY)
}

/**
 * 获取预设的权重配置列表
 */
export function getPresetWeights(): { name: string; weights: RecommendationWeights; description: string }[] {
  return [
    {
      name: 'AI 自动',
      weights: DEFAULT_WEIGHTS,
      description: '智能平衡所有因素，推荐最适合的任务',
    },
    {
      name: '优先级别优先',
      weights: MINIMAL_WEIGHTS,
      description: '严格按 P1 → P2 → P3 顺序推荐',
    },
    {
      name: '均衡推荐',
      weights: BALANCED_WEIGHTS,
      description: '优先级和紧迫性各占 30%，均衡考虑',
    },
  ]
}
