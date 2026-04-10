// Runtime feature flags - 功能特性开关
// 从后端设置加载，并在前端使用

import dataService from '../services/dataService'
import type { AppSettings as Settings } from '../services/dataService'

// 所有可用功能特性
export type FeatureFlagKey =
  | 'keyboardShortcuts'    // 全局键盘快捷键
  | 'focusMode'            // 专注模式
  | 'pomodoro'             // 番茄工作法
  | 'pdfExport'            // PDF 导出
  | 'onboardingTour'       // 新手导览
  | 'idleDetection'        // 空闲检测

// 默认所有新功能开启
const defaultFeatureFlags: Record<FeatureFlagKey, boolean> = {
  keyboardShortcuts: true,
  focusMode: true,
  pomodoro: true,
  pdfExport: true,
  onboardingTour: true,
  idleDetection: true,
}

// 内存缓存
let featureFlagCache: Record<FeatureFlagKey, boolean> | null = null

/**
 * 获取功能开关状态
 */
export function getFeatureFlag(key: FeatureFlagKey): boolean {
  if (featureFlagCache) {
    return featureFlagCache[key] ?? defaultFeatureFlags[key] ?? true
  }
  // 如果缓存未初始化，返回默认值
  return defaultFeatureFlags[key] ?? true
}

/**
 * 设置功能开关状态
 */
export function setFeatureFlag(key: FeatureFlagKey, enabled: boolean): void {
  if (!featureFlagCache) {
    featureFlagCache = { ...defaultFeatureFlags }
  }
  featureFlagCache[key] = enabled
}

/**
 * 从后端设置加载所有功能开关
 */
export async function loadFeatureFlags(): Promise<void> {
  try {
    const settings = await dataService.getSettings()
    // 如果设置中已有 featureFlags，使用它
    if (settings && typeof settings === 'object' && 'featureFlags' in settings) {
      featureFlagCache = {
        ...defaultFeatureFlags,
        ...(settings.featureFlags as Record<FeatureFlagKey, boolean>)
      }
    } else {
      featureFlagCache = { ...defaultFeatureFlags }
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to load feature flags:', error)
    featureFlagCache = { ...defaultFeatureFlags }
  }
}

/**
 * 保存所有功能开关到后端设置
 */
export async function saveFeatureFlags(): Promise<void> {
  if (!featureFlagCache) {
    return
  }
  try {
    const settings = await dataService.getSettings()
    const updatedSettings: Settings = {
      ...settings,
      featureFlags: { ...featureFlagCache },
    }
    await dataService.updateSettings(updatedSettings)
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to save feature flags:', error)
  }
}

/**
 * 获取所有功能开关的当前状态
 */
export function getAllFeatureFlags(): Record<FeatureFlagKey, boolean> {
  if (featureFlagCache) {
    return { ...featureFlagCache }
  }
  return { ...defaultFeatureFlags }
}

/**
 * 按分类分组功能开关
 */
export const featureFlagCategories = {
  productivity: [
    { key: 'keyboardShortcuts' as const, name: '键盘快捷键', description: 'Space 暂停/继续，n 新建任务，d 仪表盘，s 设置' },
    { key: 'focusMode' as const, name: '专注模式', description: ' distraction-free 全窗口专注视图' },
    { key: 'pomodoro' as const, name: '番茄工作法', description: '25/5 倒计时专注工作法' },
  ],
  export: [
    { key: 'pdfExport' as const, name: 'PDF 导出', description: '导出每日/每周汇总报表' },
  ],
  ui: [
    { key: 'onboardingTour' as const, name: '首次使用导览', description: '新用户交互式产品介绍' },
  ],
  tracking: [
    { key: 'idleDetection' as const, name: '自动空闲检测', description: '超过 5 分钟无操作自动暂停追踪' },
  ],
} as const

export type FeatureFlagCategory = keyof typeof featureFlagCategories
