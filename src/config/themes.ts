// Theme configuration - extracted from App.tsx to avoid circular imports

export type Theme = 'light' | 'dark'
export type ColorTheme = 'blue' | 'green' | 'purple' | 'orange' | 'pink'
export type BackgroundSkin = 'gradient' | 'solid' | 'glass'

export interface ColorThemeConfig {
  name: string
  nameEn: string
  accent: string
  accentSoft: string
  description: string
}

export const colorThemeConfigs: Record<ColorTheme, ColorThemeConfig> = {
  orange: {
    name: '活力暖阳',
    nameEn: 'Warm Sunrise',
    accent: '#f97316',
    accentSoft: 'rgba(249, 115, 22, 0.12)',
    description: '充满活力与生命力，温暖而积极',
  },
  blue: {
    name: '清爽天蓝',
    nameEn: 'Sky Blue',
    accent: '#3b82f6',
    accentSoft: 'rgba(59, 130, 246, 0.12)',
    description: '干净清爽，适合长时间工作',
  },
  green: {
    name: '自然翠绿',
    nameEn: 'Nature Green',
    accent: '#22c55e',
    accentSoft: 'rgba(34, 197, 94, 0.12)',
    description: '清新自然，缓解视觉疲劳',
  },
  purple: {
    name: '优雅紫调',
    nameEn: 'Elegant Purple',
    accent: '#a855f7',
    accentSoft: 'rgba(168, 85, 247, 0.12)',
    description: '优雅知性，适合创意工作',
  },
  pink: {
    name: '柔粉樱花',
    nameEn: 'Sakura Pink',
    accent: '#ec4899',
    accentSoft: 'rgba(236, 72, 153, 0.12)',
    description: '柔美清新，充满灵感',
  },
}

export interface BackgroundSkinConfig {
  name: string
  description: string
  getBgClass: (isDark: boolean) => string
}

export const backgroundSkinConfigs: Record<BackgroundSkin, BackgroundSkinConfig> = {
  gradient: {
    name: '柔和渐变',
    description: '通透渐变背景，现代感十足',
    // eslint-disable-next-line no-useless-concat
    getBgClass: (isDark: boolean) =>
      isDark
        ? 'bg-gradient-to-br from-[#1a1614]' + ' to-[#1e1a2e]'
        : 'bg-gradient-to-br from-[#fffefb]' + ' to-[#fef7ed]',
  },
  solid: {
    name: '纯净背景',
    description: '纯色背景，干净简洁',
    // eslint-disable-next-line no-useless-concat
    getBgClass: (isDark: boolean) =>
      isDark ? 'bg-[#1a1614]' : 'bg-[#fffefb]',
  },
  glass: {
    name: '玻璃拟态',
    description: '半透明磨砂效果',
    // eslint-disable-next-line no-useless-concat
    getBgClass: (isDark: boolean) =>
      isDark
        ? 'bg-gradient-to-br from-[#1a1614]' + ' to-[#1e1a2e]'
        : 'bg-gradient-to-br from-[#fffefb]' + ' to-[#fef7ed]',
  },
}

// Category colors for activity types
export const CATEGORY_COLORS: Record<string, string> = {
  '开发': '#3b82f6',
  '工作': '#6366f1',
  '学习': '#8b5cf6',
  '会议': '#06b6d4',
  '休息': '#22c55e',
  '娱乐': '#f59e0b',
  '运动': '#ef4444',
  '阅读': '#14b8a6',
  '其他': '#94a3b8',
}

// Priority colors
export const PRIORITY_COLORS: Record<number, string> = {
  1: '#94a3b8',
  2: '#3b82f6',
  3: '#f59e0b',
  4: '#f97316',
  5: '#ef4444',
}

// Default feature modules
export const DEFAULT_MODULES = [
  'dashboard',
  'timeline',
  'planner',
  'focus',
  'habits',
  'statistics',
  'pet',
  'settings',
]
