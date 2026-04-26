import type { TaskStatus } from '../services/dataService'

// Unified color system - Design Tokens
export const COLORS = {
  primary: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#79BEEB',     // 主色
    400: '#5AACDF',     // 边框/悬停
    500: '#3B82F6',     // 强调
  },
  success: {
    bg: '#D1FAE5',
    text: '#059669',
    border: '#34D399',
  },
  warning: {
    bg: '#FEF3C7',
    text: '#D97706',
    border: '#F59E0B',
  },
  danger: {
    bg: '#FEE2E2',
    text: '#DC2626',
    border: '#F87171',
  },
  neutral: {
    50: '#FAF8F5',
    100: '#F5F1EA',
    200: '#E8E6E1',
    300: '#D6D3CD',
    400: '#9E9899',
    500: '#5C5658',
    600: '#3A3638',
  },
} as const

// Shadow system - unified for all components
export const SHADOWS = {
  card: '4px 4px 0px #D6D3CD',
  cardHover: '6px 6px 0px #D6D3CD',
  cardSmall: '2px 2px 0px #D6D3CD',
  floating: '0 8px 30px rgba(0, 0, 0, 0.12)',
} as const

// Radius system - unified for all components
export const RADII = {
  sm: '6px',
  md: '8px',
  lg: '12px',   // 标准卡片
  xl: '16px',   // 大型容器
} as const

// Animation system
export const ANIMATIONS = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
} as const

// Priority configuration - unified colors for all components
export const PRIORITY_CONFIG: Record<number, { bg: string; text: string; border: string; label: string }> = {
  1: { bg: '#F3F4F6', text: '#6B7280', border: '#9CA3AF', label: '低' },
  2: { bg: '#E0F2FE', text: '#0369A1', border: '#79BEEB', label: '中' },
  3: { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B', label: '高' },
  4: { bg: '#FEE2E2', text: '#DC2626', border: '#F87171', label: '紧急' },
  5: { bg: '#FECACA', text: '#B91C1C', border: '#FF5252', label: '非常紧急' },
}

// Default fallback for unknown priority
export const DEFAULT_PRIORITY_CONFIG = PRIORITY_CONFIG[3]

// Helper function to safely get priority config
export const getPriorityConfig = (priority: number | undefined | null) => {
  if (!priority || !PRIORITY_CONFIG[priority]) {
    return DEFAULT_PRIORITY_CONFIG
  }
  return PRIORITY_CONFIG[priority]
}

// Simplified color mapping for priority badge backgrounds
// PRIORITY_COLORS - backward compatibility alias
export const PRIORITY_COLORS: Record<number, string> = {
  1: '#9E9899',
  2: '#79BEEB',
  3: '#FFD3B6',
  4: '#FF8C82',
  5: '#FF5252',
}
export const PRIORITY_BG_COLORS = PRIORITY_COLORS

export const PRIORITY_LABELS: Record<number, string> = {
  1: '低',
  2: '中',
  3: '高',
  4: '紧急',
  5: '非常紧急',
}

// Status configuration
export const STATUS_CONFIG: Record<TaskStatus, { bg: string; text: string; border: string; label: string }> = {
  todo: { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB', label: '待办' },
  in_progress: { bg: '#DBEAFE', text: '#1D4ED8', border: '#60A5FA', label: '进行中' },
  paused: { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B', label: '已暂停' },
  completed: { bg: '#D1FAE5', text: '#059669', border: '#34D399', label: '已完成' },
  archived: { bg: '#F3F4F6', text: '#9E9899', border: '#D1D5DB', label: '已归档' },
}

// Default fallback for unknown status
export const DEFAULT_STATUS_CONFIG = STATUS_CONFIG.todo

// Helper function to safely get status config
export const getStatusConfig = (status: TaskStatus | undefined | null) => {
  if (!status || !STATUS_CONFIG[status]) {
    return DEFAULT_STATUS_CONFIG
  }
  return STATUS_CONFIG[status]
}

// Safe date formatting utilities
export const isValidDate = (dateStr: string | undefined | null): boolean => {
  if (!dateStr || typeof dateStr !== 'string') return false
  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date.getTime())
}

export const formatDateShort = (dateStr: string | undefined | null): string => {
  if (!isValidDate(dateStr)) return ''
  return dateStr!.slice(5, 10) // Returns MM-DD format
}

export const formatDateFull = (dateStr: string | undefined | null): string => {
  if (!isValidDate(dateStr)) return ''
  return dateStr!.slice(0, 10) // Returns YYYY-MM-DD format
}

// Safe number formatting
export const formatDuration = (minutes: number | undefined | null): string => {
  if (!minutes || minutes <= 0) return ''
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`
}

// Status filters for task list
export const STATUS_FILTERS: { key: TaskStatus | 'all' | 'active'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'todo', label: '待办' },
  { key: 'paused', label: '已暂停' },
  { key: 'completed', label: '已完成' },
  { key: 'archived', label: '已归档' },
]

// Emotional tags
export const EMOTIONAL_EMOJIS: Record<string, string> = {
  easy: '😊',
  neutral: '😐',
  resist: '😰',
}
