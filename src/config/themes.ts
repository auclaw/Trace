// Theme configuration — Trace "Macaron Editorial" Design System v3
// Figma reference: Coral Pink primary + Pastel Macaron secondary palette
// Typography: Quicksand (headings), Plus Jakarta Sans (body), JetBrains Mono (code/labels)

export type Theme = 'light' | 'dark'
export type ColorTheme = 'coral' | 'blue' | 'mint' | 'lilac' | 'lemon' | 'pink'
export type BackgroundSkin = 'gradient' | 'solid' | 'glass'

export interface ColorThemeConfig {
  name: string
  nameEn: string
  accent: string
  accentHover: string
  accentSoft: string
  description: string
}

export const colorThemeConfigs: Record<ColorTheme, ColorThemeConfig> = {
  coral: {
    name: '珊瑚粉',
    nameEn: 'Coral Pink',
    accent: '#FF8C82',
    accentHover: '#FB5F51',
    accentSoft: 'rgba(255, 140, 130, 0.12)',
    description: '温暖活泼，适合日常使用',
  },
  blue: {
    name: '马卡龙蓝',
    nameEn: 'Macaron Blue',
    accent: '#79BEEB',
    accentHover: '#5AACDF',
    accentSoft: 'rgba(121, 190, 235, 0.12)',
    description: '清爽平静，适合长时间专注',
  },
  mint: {
    name: '马卡龙薄荷',
    nameEn: 'Macaron Mint',
    accent: '#A8E6CF',
    accentHover: '#7DD4B0',
    accentSoft: 'rgba(168, 230, 207, 0.12)',
    description: '清新自然，缓解视觉疲劳',
  },
  lilac: {
    name: '马卡龙紫',
    nameEn: 'Macaron Lilac',
    accent: '#D4C4FB',
    accentHover: '#B8A3F5',
    accentSoft: 'rgba(212, 196, 251, 0.12)',
    description: '优雅知性，适合创意工作',
  },
  lemon: {
    name: '马卡龙柠檬',
    nameEn: 'Macaron Lemon',
    accent: '#FFD3B6',
    accentHover: '#FFBB8E',
    accentSoft: 'rgba(255, 211, 182, 0.12)',
    description: '温暖柔和，充满灵感',
  },
  pink: {
    name: '马卡龙粉',
    nameEn: 'Macaron Pink',
    accent: '#FFB5D4',
    accentHover: '#FF8FC0',
    accentSoft: 'rgba(255, 181, 212, 0.12)',
    description: '温柔甜美，治愈系配色',
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
    getBgClass: (isDark: boolean) =>
      isDark
        ? 'bg-gradient-to-br from-[#1A1718] to-[#221E20]'
        : 'bg-gradient-to-br from-[#FDFBF7] to-[#FAF2E8]',
  },
  solid: {
    name: '纯净背景',
    description: '纯色背景，干净简洁',
    getBgClass: (isDark: boolean) =>
      isDark ? 'bg-[#1A1718]' : 'bg-[#FDFBF7]',
  },
  glass: {
    name: '玻璃拟态',
    description: '半透明磨砂效果',
    getBgClass: (isDark: boolean) =>
      isDark
        ? 'bg-gradient-to-br from-[#1A1718] to-[#221E20]'
        : 'bg-gradient-to-br from-[#FDFBF7] to-[#FAF2E8]',
  },
}

// Category colors — using macaron palette
export const CATEGORY_COLORS: Record<string, string> = {
  '开发': '#79BEEB',    // Macaron Blue
  '工作': '#FF8C82',    // Coral Pink
  '学习': '#D4C4FB',    // Macaron Lilac
  '会议': '#79BEEB',    // Macaron Blue
  '休息': '#A8E6CF',    // Macaron Mint
  '娱乐': '#FFD3B6',    // Macaron Lemon
  '运动': '#FF8C82',    // Coral Pink
  '阅读': '#A8E6CF',    // Macaron Mint
  '其他': '#9E9899',    // Muted gray
}

// Priority colors — warm macaron gradient from low to high
export const PRIORITY_COLORS: Record<number, string> = {
  1: '#9E9899',    // Muted
  2: '#79BEEB',    // Blue
  3: '#FFD3B6',    // Lemon
  4: '#FF8C82',    // Coral
  5: '#FB5F51',    // Coral hover (urgent)
}

// Default feature modules (V1 — 5 tabs)
export const DEFAULT_MODULES = [
  'dashboard',
  'timeline',
  'task',
  'analytics',
  'settings',
]
